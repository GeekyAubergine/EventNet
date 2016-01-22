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
      if (event.detail && event.detail.networkId) {
        localStorage.networkID = event.detail.networkId;
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
          timeStamp.innerHTML = window.eventNet.util.beautifyTimeDifference(timeStamp.getAttribute("datetime"));
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
      setInterval(updateTimeStamps, 100); //Trigger every 30 seconds
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
