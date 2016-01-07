window.eventNet = window.eventNet || {};
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
      //  console.log("Position Updated: ");
      //  console.log(position);
        document.dispatchEvent(new CustomEvent("positionUpdated", {
          detail: position
        }));
      }
    },

    getLocation = function() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateLocation, null, locationOptions);
        locationWatcher = navigator.geolocation.watchPosition(updateLocation, null, locationOptions);
      } else {
        console.log("Location not available");
      }
    },

    setUp = function() {
      getLocation();
    };

  return {
    "setUp": setUp,
    "getLocation": getLocation
  };
}());

window.addEventListener("load", window.eventNet.core.setUp);
