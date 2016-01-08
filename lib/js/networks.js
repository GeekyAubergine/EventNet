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
      var dLat = degreesToRadains(lat2 - lat1); // degreesToRadains below
      var dLon = degreesToRadains(lon2 - lon1);
      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadains(lat1)) * Math.cos(degreesToRadains(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c; // Distance in km
      return d;
    },

    degreesToRadains = function(deg) {
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

    sortNetworksByDistance = function(data) {
      data.sort(function(a, b) {
        return parseFloat(a.distanceFromUser) - parseFloat(b.distanceFromUser);
      });
      return data;
    },

    beautifyDistance = function(distance) {
      if (distance < 0.05) {
        return "Less than 50m";
      }
      if (distance < 0.1) {
        return "Less than 100m";
      }
      if (distance < 0.5) {
        return "Less than 500m";
      }
      if (distance < 1) {
        return "Less than 1 km";
      }
      return parseInt(distance) + "km";
    },

    addNetworkToNetworksList = function(listElement, networkData) {
      var networkElement = document.createElement("li");
      listElement.appendChild(networkElement);

      //Network name
      var networkName = document.createElement("h3");
      networkElement.appendChild(networkName);
      networkName.innerHTML = networkData.network_name;

      //Network distance
      var networkDistance = document.createElement("h4");
      networkElement.appendChild(networkDistance);
      networkDistance.className = "distance";
      networkDistance.innerHTML = beautifyDistance(parseInt(networkData.distanceFromUser)) + " away";

      //Network posts
      if (networkData.number_of_posts) {
        var networkPosts = document.createElement("h4");
        networkElement.appendChild(networkPosts);
        networkPosts.className = "number-of-posts";
        networkPosts.innerHTML = parseInt(networkData.number_of_posts) + " posts";
      }

      //Add marker to map
      new google.maps.Marker({
        position: {
          lat: parseFloat(networkData.network_latitude),
          lng: parseFloat(networkData.network_longitude)
        },
        map: map,
        title: networkData.network_name
      });

      //On click map move
      networkElement.addEventListener("click", function(e) {
        updateMapCentre({
          latitude: parseFloat(networkData.network_latitude),
          longitude: parseFloat(networkData.network_longitude)
        });
      });
    },

    listNetworks = function(data) {
      data = JSON.parse(data.target.responseText).data;
      var currentLocation = window.eventNet.core.getLocation();
      console.log(currentLocation);
      for (var i in data) {
        data[i].network_latitude = parseFloat(data[i].network_latitude);
        data[i].network_longitude = parseFloat(data[i].network_longitude);
        data[i].distanceFromUser = distanceBetweenToCoords(data[i].network_latitude, data[i].network_longitude, currentLocation.latitude, currentLocation.longitude);
      }
      data = sortNetworksByDistance(data);

      var networkList = document.getElementById("networks-list");

      //Clear list
      while (networkList.firstChild) {
        networkList.removeChild(networkList.firstChild);
      }

      for (var i in data) {
        addNetworkToNetworksList(networkList, data[i]);
      }
    },

    loadNetworks = function() {
      window.eventNet.xhr.load({
        url: "api/v1/networks",
        callBacks: {
          load: listNetworks,
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
    },

    setUp = function() {
      initMap();
      document.addEventListener("positionUpdated", updateUserPosition);
      document.addEventListener("positionUpdated", loadNetworks);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.networks.setUp);
