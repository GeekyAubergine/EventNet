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
