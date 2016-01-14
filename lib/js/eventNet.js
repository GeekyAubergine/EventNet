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

    append = function(parent, tagToAppend) {
      var child = document.createElement(tagToAppend);
      parent.appendChild(child);
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

    getUserId = function() {
      return parseInt(Math.random() * 4) + 1;
    },

    getUserImage = function() {
      return "res/icons/default_user.svg";
    },

    setUp = function() {
      watchLocation();
      document.addEventListener("networkSelected", updateSelectedNetwork);
    };

  return {
    "setUp": setUp,
    "getLocation": getLocation,
    "getSelectedNetwork": getSelectedNetwork,
    "getUserId": getUserId,
    "getUserImage": getUserImage
  };
}());

window.eventNet.ui = (function() {
  "use strict";
  var

    updateTimeStamps = function() {
      var timeStamps = document.body.getElementsByTagName("time");
      for (var i in timeStamps) {
        var timeStamp = timeStamps[i];
        if (typeof(timeStamp.getAttribute) == "function") {
          timeStamp.innerHTML = window.eventNet.util.beautifyTimeDifference(timeStamp.getAttribute("datetime")) + " ago";
        }
      }
    },

    toggleDivVisibility = function(target) {
      target.classList.toggle("hidden");
    },

    setUp = function() {
      setInterval(updateTimeStamps, 30 * 1000); //Trigger every 30 seconds
      document.addEventListener("contentUpdated", updateTimeStamps);
    };
  return {
    "toggleDivVisibility": toggleDivVisibility,
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.core.setUp);
window.addEventListener("load", window.eventNet.ui.setUp);
