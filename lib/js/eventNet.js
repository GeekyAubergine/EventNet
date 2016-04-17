window.eventNet = window.eventNet || {};

window.eventNet.util = (function() {
  var

    //Fixes the date returned from MySQL and changes it to a date that JS can use.
    fixDateFormat = function(date) {
      return date.replace(" ", "T");
    },

    //Changes the time difference into a nice format, for example '10 mins ago'.
    beautifyTimeDifference = function(date) {
      date = fixDateFormat(date);
      var old = (new Date(date)).getTime();
      var now = (new Date()).getTime();
      //Get time difference in seconds
      var difference = parseInt(Math.abs(now - old) / 1000);

      //Seconds
      if (difference < 60) {
        return "Just now";
      }

      //Minutes
      difference = parseInt(difference / 60);
      if (difference == 1) {
        return "1 min ago";
      } else if (difference < 60) {
        return difference + " mins ago";
      }

      //Hours
      difference = parseInt(difference / 60);
      if (difference == 1) {
        return "1 hour ago";
      }
      if (difference < 60) {
        return difference + " hours ago";
      }

      //Days
      difference = parseInt(difference / 24);
      if (difference == 1) {
        return "1 day ago";
      }
      if (difference < 24) {
        return difference + " days ago";
      }

      //Weeks
      difference = parseInt(difference / 7);
      if (difference == 1) {
        return "1 week ago";
      }
      if (difference < 52) {
        return difference + " weeks ago";
      }

      //Years
      difference = parseInt(difference / 52);
      if (difference == 1) {
        return "1 year ago";
      }
      return difference + " years ago";
    },

    //Changes the distance into a nice format, for example '25 m'
    beautifyDistance = function(distance) {
      distance = Math.round(distance * 1000);
      if (distance < 5) {
        return "5m";
      }
      if (distance < 10) {
        return distance + "m";
      }
      if (distance < 100) {
        distance = Math.round(distance / 10) * 10;
        return distance + "m";
      }
      if (distance < 1000) {
        distance = Math.round(distance / 100) * 100;
        return distance + "m";
      }
      distance = Math.round(distance / 100) / 10;
      return distance + "km";
    },

    //Appends a new DOM element to the parent object, it also adds all given classes to the new DOM element.
    append = function(parent, tagToAppend, classes) {
      var child = document.createElement(tagToAppend);
      parent.appendChild(child);
      if (classes != undefined) {
        for (var i in classes) {
          child.classList.add(classes[i]);
        }
      }
      return child;
    };

  return {
    "append": append,
    "beautifyTimeDifference": beautifyTimeDifference,
    "beautifyDistance": beautifyDistance,
    "fixDateFormat": fixDateFormat
  };

}());

window.eventNet.core = (function() {
  "use strict";

  var
    DEBUG = true,
    socket,
    locationWatcher,
    previousPosition = {
      latitude: 0,
      longitude: 0,
      accuracy: 50
    },
    locationOptions = {
      enableHighAccuracy: true,
      timeOut: 5000,
      maximumAge: 0
    },

    //Log method
    log = function(out) {
      if (DEBUG) {
        console.log(out);
      }
    },

    /* ---- Sockets ---- */

    //Initialises the sockets
    setUpSockets = function() {
      var url = window.location.href;
      var domain = "";
      if (url.indexOf("://") > -1) {
        domain = url.split("/")[2];
      } else {
        domain = url.split("/")[0];
      }
      if (domain.indexOf(":") > -1) {
        domain = domain.substring(0, domain.indexOf(":"));
      }
      domain = "http://" + domain + ":8081";
      log("Opening socket");
      if (socket) {
        socket.disconnect();
        socket.close();
      }
      socket = io.connect(domain);
    },

    emitToSocket = function(header, data) {
      socket.emit(header, data);
    },

    closeSocket = function() {
      socket.disconnect();
      socket.close();
      log("Closing socket");
    },

    addSocketListener = function(header, callback) {
      socket.on(header, callback);
    },

    /* ---- Distance Calculations ---- */

    //Changes degress to radians
    degreesToRadains = function(angle) {
      return angle * Math.PI / 180;
    },

    //Returns the distance between two points in KM
    getDistanceBetweenPoints = function(position1, position2) {
      var R = 6371; // Radius of the earth in km
      var dLat = degreesToRadains(position2.latitude - position1.latitude); // degreesToRadains below
      var dLon = degreesToRadains(position2.longitude - position1.longitude);
      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadains(position1.latitude)) * Math.cos(degreesToRadains(position2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; //Distance in km
    },

    /* ---- Location ---- */

    //Stores the users current location
    storeLocation = function(position) {
      localStorage["locationLatitude"] = position.latitude;
      localStorage["locationLongitude"] = position.longitude;
      localStorage["locationAccuracy"] = position.accuracy * 2;
    },

    //Loads the users last stored position
    loadStoredPosition = function() {
      var lat = 0;
      if (localStorage["locationLatitude"] != undefined) {
        lat = localStorage["locationLatitude"];
      }

      var long = 0;
      if (localStorage["locationLongitude"] != undefined) {
        long = localStorage["locationLongitude"];
      }

      var accuracy = 1E9;
      if (localStorage["locationAccuracy"] != undefined) {
        accuracy = localStorage["locationAccuracy"];
      }

      previousPosition.latitude = parseFloat(lat);
      previousPosition.longitude = parseFloat(long);
      previousPosition.accuracy = parseFloat(accuracy);

      document.dispatchEvent(new CustomEvent("positionUpdated", {
        detail: previousPosition
      }));
    },

    /*
      Determines if the new location is more accurate than the previous location.
      If it is it will send a 'position updated' event
    */
    updateLocation = function(position) {
      position = position.coords;
      if (DEBUG) {
        var lat = position.latitude;
        var long = position.longitude;
        var accuracy = position.accuracy;
        log("Position updated. Lat: " + lat + " Long: " + long + " Acc: " + accuracy);
      }
      if ((previousPosition.latitude != position.latitude || previousPosition.longitude != position.longitude) && position.accuracy < previousPosition.accuracy) {
        previousPosition = position;
        document.dispatchEvent(new CustomEvent("positionUpdated", {
          detail: position
        }));
        storeLocation(position);
      }
    },

    //Sets up location monitors
    watchLocation = function() {
      setTimeout(loadStoredPosition, 10); //De lay to allow maps to load
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateLocation, null, locationOptions);
        locationWatcher = navigator.geolocation.watchPosition(updateLocation, null, locationOptions);
      } else {
        log("Location not available");
      }
    },

    //Returns the users current location
    getLocation = function() {
      return previousPosition;
    },

    // ---- Events ---- //

    updateSelectedEvent = function(event) {
      if (event.detail && event.detail.eventId) {
        localStorage["eventID"] = event.detail.eventId;
      }
    },

    getSelectedEvent = function() {
      if (localStorage["eventID"] == undefined) {
        localStorage["eventID"] = 0;
      }
      return localStorage["eventID"];
    },

    //Returns wether or not the current event is archieved
    isEventArchived = function(callback) {
      //Determine if archived
      window.eventNet.xhr.load({
        url: "api/v1/events?eventId=" + getSelectedEvent(),
        callBacks: {
          load: function(response) {
            response = JSON.parse(response.target.responseText).data;
            var archived = response[0].event_archived === "1";
            callback(archived);
          }
        }
      });
    },

    // ---- LOGIN ---- //

    //Sends the user to a login page
    sendToLogin = function() {
      if (window.location.href.indexOf("/signin.html") == -1) {
        log("Redirecting to login");
        window.location.href = "/signin.html";
      }
    },

    //Stores new tokens
    updateTokens = function(response) {
      response = JSON.parse(response.target.responseText).data;
      localStorage["accessToken"] = response.accessToken;
      localStorage["tokenExpire"] = response.tokenExpire;
      setUpTimeoutForNextLoginCheck();
    },

    //Renew access token
    renewToken = function() {
      log("Access token expirered, renewing");
      window.eventNet.xhr.load({
        method: "POST",
        url: "/api/v1/users/" + localStorage["renewToken"],
        callBacks: {
          load: updateTokens
        }
      });
    },

    //Sets up a timer for the next check for token expiration
    setUpTimeoutForNextLoginCheck = function() {
      var expired = new Date(localStorage["tokenExpire"]);
      var now = new Date();
      var delta = expired.getTime() - now.getTime();
      log("Next acecess token renew: " + expired);
      setTimeout(checkLogin, 1000);
    },

    //Checks if the user if logged in
    checkLogin = function() {
      var expired = new Date(localStorage["tokenExpire"]);
      var now = new Date();

      //If expired, renew, else check if still valid
      if (localStorage["tokenExpire"] != undefined && expired.getTime() < now.getTime()) {
        renewToken();
      } else {
        log("Checking validity of access token");
        window.eventNet.xhr.load({
          method: "GET",
          url: "/api/v1/users?accessToken=" + getAccessToken(),
          callBacks: {
            load: function(response) {
              response = JSON.parse(response.target.responseText).data;
              localStorage["loggedIn"] = response;
              log("Access token valid = " + response);
              if (!response) {
                sendToLogin();
              }
            }
          }
        });
      }
    },

    // ---- USER ---- //

    storeUserData = function(event) {
      if (event.detail) {
        log("User data updated:" + event.detail);
        localStorage["accessToken"] = event.detail.accessToken;
        localStorage["renewToken"] = event.detail.renewToken;
        localStorage["tokenExpire"] = event.detail.tokenExpire;
        localStorage["userIcon"] = event.detail.icon;
        setUpTimeoutForNextLoginCheck();
        checkLogin();
      }
    },

    isUserLoggedIn = function() {
      return localStorage["loggedIn"] != undefined && localStorage["loggedIn"];
    },

    getAccessToken = function() {
      if (localStorage["accessToken"] == undefined) {
        localStorage["accessToken"] = 1;
      }
      return localStorage["accessToken"];
    },

    getUserImage = function() {
      if (localStorage["userIcon"] != undefined && localStorage["userIcon"] != "undefined") {
        return localStorage["userIcon"];
      }
      return "res/icons/default_user.svg";
    },

    isAnonymousUser = function() {
      return getAccessToken() == 1;
    },

    setUp = function() {
      checkLogin();
      setUpTimeoutForNextLoginCheck();
      watchLocation();
      setUpSockets();
      document.addEventListener("eventSelected", updateSelectedEvent);
      document.addEventListener("userInfomationUpdated", storeUserData);
      window.addEventListener("beforeunload", closeSocket);
    };

  return {
    "setUp": setUp,
    "getLocation": getLocation,
    "getSelectedEvent": getSelectedEvent,
    "isUserLoggedIn": isUserLoggedIn,
    "getAccessToken": getAccessToken,
    "getUserImage": getUserImage,
    "isAnonymousUser": isAnonymousUser,
    "emitToSocket": emitToSocket,
    "addSocketListener": addSocketListener,
    "getDistanceBetweenPoints": getDistanceBetweenPoints,
    "isEventArchived": isEventArchived
  };
}());

window.eventNet.ui = (function() {
  "use strict";
  var
    HIDDEN_CLASS = "hidden",
    searchBox,
    resultsBox,

    //Maintains the width of the search results box
    updateWidthOfSearchResults = function() {
      resultsBox.style.width = (searchBox.offsetWidth + 1) + "px";
    },

    //Updates the timestamps within the current page and beautifies them
    updateTimeStamps = function() {
      var timeStamps = document.body.getElementsByTagName("time");
      for (var i = 0; i < timeStamps.length; i++) {
        var timeStamp = timeStamps[i];
        if (typeof(timeStamp.getAttribute) == "function") {
          timeStamp.innerHTML = window.eventNet.util.beautifyTimeDifference(timeStamp.getAttribute("datetime"));
        }
      }
    },

    //Updates the distance stamps within the current page and beautifies them
    updateDistanceStamps = function() {
      var distanceStamps = document.body.getElementsByClassName("distanceInfo");
      for (var i = 0; i < distanceStamps.length; i++) {
        var distanceStamp = distanceStamps[i];
        var lat = distanceStamp.getAttribute("data-latitude");
        var long = distanceStamp.getAttribute("data-longitude");
        var distance = window.eventNet.core.getDistanceBetweenPoints(window.eventNet.core.getLocation(), {
          latitude: lat,
          longitude: long
        });
        distanceStamp.innerHTML = window.eventNet.util.beautifyDistance(distance);
      }
    },

    //Unhides given DOM element
    show = function(target) {
      target.classList.remove(HIDDEN_CLASS);
    },

    //Hides given DOM element
    hide = function(target) {
      target.classList.add(HIDDEN_CLASS);
    },

    //Hides or unhides the given DOM element to the opposite of it's current state
    toggleVisibility = function(target) {
      target.classList.toggle(HIDDEN_CLASS);
    },

    setUp = function() {
      searchBox = document.getElementById("search");
      resultsBox = document.getElementById("search-results");
      updateWidthOfSearchResults();

      setInterval(updateTimeStamps, 30 * 1000); //Trigger every 30 seconds
      document.addEventListener("positionUpdated", updateDistanceStamps);
      document.addEventListener("contentUpdated", function() {
        updateTimeStamps();
        updateDistanceStamps();
      });
      window.addEventListener("resize", updateWidthOfSearchResults);
    };

  return {
    "toggleVisibility": toggleVisibility,
    "setUp": setUp,
    "hide": hide,
    "show": show
  };
}());

window.addEventListener("load", window.eventNet.core.setUp);
window.addEventListener("load", window.eventNet.ui.setUp);
