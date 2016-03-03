window.eventNet = window.eventNet || {};

window.eventNet.util = (function() {
  var

    beautifyTimeDifference = function(date) {
      date = date.replace(" ", "T");
      var old = (new Date(date)).getTime();
      var now = (new Date()).getTime();
      //Get time difference in seconds
      var difference = parseInt(Math.abs(now - old) / 1000);

      //Seconds
      if (difference < 60) {
        return difference + "s";
      }

      //Minutes
      difference = parseInt(difference / 60);
      if (difference < 60) {
        return difference + "m";
      }

      //Hours
      difference = parseInt(difference / 60);
      if (difference < 60) {
        return difference + "h";
      }

      //Days
      difference = parseInt(difference / 24);
      if (difference < 24) {
        return difference + "d";
      }

      //Weeks
      difference = parseInt(difference / 7);
      return difference + "w";
    },

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
    "beautifyDistance": beautifyDistance
  };

}());

window.eventNet.core = (function() {
  "use strict";

  var
    socket,
    locationWatcher,
    previousPosition = {
      latitude: 0,
      longitude: 0
    },
    locationOptions = {
      enableHighAccuracy: true,
      timeOut: 5000,
      maximumAge: 0
    },

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
      socket = io.connect(domain);
    },

    emitToSocket = function(header, data) {
      socket.emit(header, data);
    },

    addSocketListener = function(header, callback) {
      socket.on(header, callback);
    },

    degreesToRadains = function(angle) {
      return angle * Math.PI / 180;
    },

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

    updateLocation = function(position) {
      position = position.coords;
      if (previousPosition.latitude != position.latitude && previousPosition.longitude != position.longitude) {
        previousPosition = position;
        document.dispatchEvent(new CustomEvent("positionUpdated", {
          detail: position
        }));
      }
    },

    watchLocation = function() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateLocation, null, locationOptions);
        locationWatcher = navigator.geolocation.watchPosition(updateLocation, null, locationOptions);
      } else {
        console.log("Location not available");
      }
    },

    getLocation = function() {
      return previousPosition;
    },

    updateSelectedEvent = function(event) {
      if (event.detail && event.detail.eventId) {
        localStorage["eventID"] = event.detail.eventId;
      }
    },

    updateTokens = function(response) {
      response = JSON.parse(response.target.responseText).data;
      localStorage["accessToken"] = response.accessToken;
      localStorage["tokenExpire"] = response.tokenExpire;
      setUpTimeoutForNextLoginCheck();
    },

    renewToken = function() {
      window.eventNet.xhr.load({
        method: "POST",
        url: "/api/v1/users/" + localStorage["renewToken"],
        callBacks: {
          load: updateTokens
        }
      });
    },

    setUpTimeoutForNextLoginCheck = function() {
      var expired = new Date(localStorage["tokenExpire"]);
      var now = new Date();
      var delta = expired.getTime() - now.getTime();
      console.log(delta);
      setTimeout(checkLogin, delta);
    },

    checkLogin = function() {
      var expired = new Date(localStorage["tokenExpire"]);
      var now = new Date();

      //If expired, renew, else check if still valid
      if (expired < now) {
       renewToken();
      }
      else {
        window.eventNet.xhr.load({
          method: "GET",
          url: "/api/v1/users?accessToken=" + localStorage["accessToken"],
          callBacks:{
            load: function(response) {
              response = JSON.parse(response.target.responseText).data;
              localStorage["loggedIn"] = response;
            }
          }
        });
      }
    },

    getSelectedEvent = function() {
      if (localStorage["eventID"] == undefined) {
        localStorage["eventID"] = 0;
      }
      return localStorage["eventID"];
    },

    storeUserData = function(event) {
      if (event.detail) {
        localStorage["accessToken"] = event.detail.accessToken;
        localStorage["renewToken"] = event.detail.renewToken;
        localStorage["tokenExpire"] = event.detail.tokenExpire;
        localStorage["userIcon"] = event.detail.icon;
        localStorage["loggedIn"] = true;
        setUpTimeoutForNextLoginCheck();
      }
    },

    isUserLoggedIn = function() {
      return localStorage["loggedIn"] != undefined && localStorage["loggedIn"];
    },

    getUserToken = function() {
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

    setUp = function() {
      checkLogin();
      setUpTimeoutForNextLoginCheck();
      watchLocation();
      setUpSockets();
      document.addEventListener("eventSelected", updateSelectedEvent);
      document.addEventListener("userInfomationUpdated", storeUserData);
    };

  return {
    "setUp": setUp,
    "getLocation": getLocation,
    "getSelectedEvent": getSelectedEvent,
    "isUserLoggedIn": isUserLoggedIn,
    "getUserToken": getUserToken,
    "getUserImage": getUserImage,
    "emitToSocket": emitToSocket,
    "addSocketListener": addSocketListener,
    "getDistanceBetweenPoints": getDistanceBetweenPoints
  };
}());

window.eventNet.ui = (function() {
  "use strict";
  var
    HIDDEN_CLASS = "hidden",

    updateTimeStamps = function() {
      var timeStamps = document.body.getElementsByTagName("time");
      for (var i = 0; i < timeStamps.length; i++) {
        var timeStamp = timeStamps[i];
        if (typeof(timeStamp.getAttribute) == "function") {
          timeStamp.innerHTML = window.eventNet.util.beautifyTimeDifference(timeStamp.getAttribute("datetime"));
        }
      }
    },

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

    show = function(target) {
      target.classList.remove(HIDDEN_CLASS);
    },

    hide = function(target) {
      target.classList.add(HIDDEN_CLASS);
    },

    toggleVisibility = function(target) {
      target.classList.toggle(HIDDEN_CLASS);
    },

    setUp = function() {
      setInterval(updateTimeStamps, 100); //Trigger every 30 seconds
      document.addEventListener("positionUpdated", updateDistanceStamps);
      document.addEventListener("contentUpdated", updateDistanceStamps);
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
