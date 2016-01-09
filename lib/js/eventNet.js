window.eventNet = window.eventNet || {};

window.eventNet.core = (function() {
  "use strict";

  var
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

    updateSelectedNetwork = function(e) {
      if (e.detail && e.detail.network_id) {
        localStorage.networkID = e.detail.network_id;
      }
    },

    getSelectedNetwork = function() {
      return localStorage.networkID;
    },

    beautifyTimeDifference = function(date) {
      var old = (new Date(date)).getTime();
      var now = (new Date()).getTime();
      //Get time difference in seconds
      var difference = parseInt(Math.abs(now - old) / 1000);

      //Seconds
      if (difference < 60) {
        return differnce + " seconds";
      }

      //Minutes
      difference = parseInt(difference / 60);
      if (difference < 60) {
        return difference + " minutes";
      }

      //Hours
      difference = parseInt(difference / 60);
      if (difference < 60) {
        return difference + " hours";
      }

      //Days
      difference = parseInt(difference / 24);
      if (difference < 24) {
        return difference + " hours";
      }

      //Weeks
      difference = parseInt(difference / 7);
      return difference + " weeks";
    },

    setUp = function() {
      watchLocation();
      document.addEventListener("networkSelected", updateSelectedNetwork);
    };

  return {
    "setUp": setUp,
    "getLocation": getLocation,
    "getSelectedNetwork": getSelectedNetwork,
    "beautifyTimeDifference": beautifyTimeDifference
  };
}());

window.eventNet.ui = (function() {
  "use strict";
  var

    toggleDivVisibility = function(target) {
      target.classList.toggle("hidden");
    },

    addEventListenerToClassName = function(className, eventString, callBack, bubble) {
      var elements = document.getElementsByClassName(className);
      for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener(eventString, callBack, bubble);
      }
    };
  return {
    "toggleDivVisibility": toggleDivVisibility,
    "addEventListenerToClassName": addEventListenerToClassName
  };
}());

window.addEventListener("load", window.eventNet.core.setUp);
