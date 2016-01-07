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

    distanceBetweenToCoords = function(lat1, lon1, lat2, lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = degreesToRadians(lat2 - lat1);
      var dLon = degreesToRadians(lon2 - lon1);
      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c; // Distance in km
      return d;
    },

    degreesToRadians = function(deg) {
      return deg * (Math.PI / 180)
    },

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
      map.setZoom(zoom);
      drawLocationOnMap(position);
    },

    listNetworks = function(data) {
      console.log("callbas");
      console.log(data);
    },

    loadNetworks = function() {
      window.eventNet.xhr.load({
        "url": "api/v1/networks",
        "callBacks": {
          "load": listNetworks,
          "error": function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
    },

    setUp = function() {
      initMap();
      loadNetworks();
      document.addEventListener("positionUpdated", updateMapPosition);
    };

  return {
    "setUp": setUp,
    "initMap": initMap
  };
}());

window.addEventListener("load", window.eventNet.networks.setUp);
