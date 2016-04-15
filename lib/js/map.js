window.eventNet = window.eventNet || {};
window.eventNet.map = (function() {
  "use strict";
  var

    MAX_MARKERS = 10,

    map,
    mapOptions = {
      zoom: 0,
      center: {
        lat: 0,
        lng: 0
      },
    },
    currentLocationMarker,
    searchBox,
    markers = [],

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

    drawMarkerOnMap = function(position) {
      while (markers.length >= MAX_MARKERS) {
        var oldMarker = markers.shift();
        oldMarker.setMap(null);
      }

      var marker = new google.maps.Marker({
        position: {
          lat: position.latitude,
          lng: position.longitude
        },
        map: map,
        title: 'Hello, World!'
        // animation: google.maps.Animation.DROP
      });
      markers.push(marker);
    },

    updateMapCentre = function(position) {
      map.setCenter({
        lat: position.latitude,
        lng: position.longitude
      });
      map.setZoom(16);
    },

    updateUserPosition = function(e) {
      var position = e.detail;
      updateMapCentre(position);
      var zoom = 20 - Math.floor(Math.log(position.accuracy) / Math.log(2));
      map.setZoom(zoom);
      drawLocationOnMap(position);
    },

    setUp = function() {
      initMap();
      document.addEventListener("positionUpdated", updateUserPosition);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.map.setUp);
