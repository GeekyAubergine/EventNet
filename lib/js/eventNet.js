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
        return "Less than a minute";
      }

      //Minutes
      difference = parseInt(difference / 60);
      if (difference < 60) {
        if (difference == 1) {
          return "1 minute";
        }
        return difference + " minutes";
      }

      //Hours
      difference = parseInt(difference / 60);
      if (difference < 60) {
        if (difference == 1) {
          return "1 hour";
        }
        return difference + " hours";
      }

      //Days
      difference = parseInt(difference / 24);
      if (difference < 24) {
        if (difference == 1) {
          return "1 day";
        }
        return difference + " days";
      }

      //Weeks
      difference = parseInt(difference / 7);
      if (difference == 1) {
        return "1 week";
      }
      return difference + " weeks";
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
    "beautifyTimeDifference": beautifyTimeDifference
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
      socket = io.connect("http://eventnet.com:8081");
    },

    emitToSocket = function(header, data) {
      socket.emit(header, data);
    },

    addSocketListener = function(header, callback) {
      socket.on(header, callback);
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

    updateSelectedNetwork = function(event) {
      if (event.detail && event.detail.network_id) {
        localStorage.networkID = event.detail.network_id;
      }
    },

    getSelectedNetwork = function() {
      return localStorage.networkID;
    },

    userUpdated = function(event) {
      console.log("User updated: ", event.detail);
      if (event.detail) {
        localStorage.userID = event.detail.userId;
        localStorage.userIcon = event.detail.userIcon;
      }
    },

    getUserId = function() {
      var id = localStorage.userID;
      if (id == undefined) {
        id = 1;
      }
      return id;
    },

    getUserImage = function() {
      if (localStorage.userIcon != undefined && localStorage.userIcon != "undefined") {
        return localStorage.userIcon;
      }
      return "res/icons/default_user.svg";
    },

    setUp = function() {
      watchLocation();
      setUpSockets();
      document.addEventListener("networkSelected", updateSelectedNetwork);
      document.addEventListener("userInfomationUpdated", userUpdated);
    };

  return {
    "setUp": setUp,
    "getLocation": getLocation,
    "getSelectedNetwork": getSelectedNetwork,
    "getUserId": getUserId,
    "getUserImage": getUserImage,
    "emitToSocket": emitToSocket,
    "addSocketListener": addSocketListener
  };
}());

window.eventNet.ui = (function() {
  "use strict";
  var
    HIDDEN_CLASS = "hidden",

    updateTimeStamps = function() {
      var timeStamps = document.body.getElementsByTagName("time");
      for (var i in timeStamps) {
        var timeStamp = timeStamps[i];
        if (typeof(timeStamp.getAttribute) == "function") {
          timeStamp.innerHTML = window.eventNet.util.beautifyTimeDifference(timeStamp.getAttribute("datetime")) + " ago";
        }
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
      setInterval(updateTimeStamps, 30 * 1000); //Trigger every 30 seconds
      document.addEventListener("contentUpdated", updateTimeStamps);
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
