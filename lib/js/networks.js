window.eventNet = window.eventNet || {};
window.eventNet.networks = (function() {
  "use strict";
  var
    map,
    mapOptions = {
      zoom: 0,
      center: {
        lat: 0,
        lng: 0
      },
    },
    currentLocationMarker,

    initMap = function() {
      map = new google.maps.Map(document.getElementById('map'), mapOptions);
    },

    drawLocationOnMap = function(position) {
      if (currentLocationMarker) {
        currentLocationMarker.setMap(null);
      }
      currentLocationMarker = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.35,
        map: map,
        center: {
          lat: position.latitude,
          lng: position.longitude
        },
        radius: position.accuracy
      });
    },

    updateMapPosition = function(e) {
      var position = e.detail;
      map.setCenter({
        lat: position.latitude,
        lng: position.longitude
      });
      var zoom = 20 - Math.floor(Math.log(position.accuracy) / Math.log(2));
      console.log(zoom);
      map.setZoom(zoom);
      drawLocationOnMap(position);
    },



    setUp = function() {
      initMap();
      document.addEventListener("positionUpdated", updateMapPosition);
    };

  return {
    "setUp": setUp,
    "initMap": initMap
  };
}());

window.addEventListener("load", window.eventNet.networks.setUp);
