window.eventNet = window.eventNet || {};
window.eventNet.networks = (function() {
  "use strict";
  var
    NETWORK_LIST_ID = "networks",
    NETWORK_ID_PREFIX = "network-",
    DISTANCE_CLASS = "distance",
    NUMBER_OF_POSTS_CLASS = "number-of-posts",

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

    renderNetwork = function(listElement, data) {
      var networkElement = window.eventNet.util.append(listElement, "li");
      networkElement.id = NETWORK_ID_PREFIX + data.networkId;

      //Network name
      var eventName = window.eventNet.util.append(networkElement, "h3");
      eventName.innerHTML = data.eventName;

      var dataList = window.eventNet.util.append(networkElement, "ul");

      //Network distance
      var listElement1 = window.eventNet.util.append(dataList, "li");
      var networkDistance = window.eventNet.util.append(listElement1, "span", [DISTANCE_CLASS]);
      networkDistance.innerHTML = beautifyDistance(parseInt(data.distanceFromUser)) + " away";

      //Network posts
      var listElement2 = window.eventNet.util.append(dataList, "li");
      var networkPosts = window.eventNet.util.append(listElement2, "span", [NUMBER_OF_POSTS_CLASS]);

      var numberOfPosts = 0;
      if (data.numberOfPosts) {
        numberOfPosts = parseInt(data.numberOfPosts);
      }
      var numberOfPostsString = numberOfPosts;
      if (numberOfPosts == 1) {
        numberOfPostsString += " post";
      } else {
        numberOfPostsString += " posts";
      }

      if (numberOfPosts > 0) {
        numberOfPostsString += ", <time datetime=\"" + data.mostRecentPost + "\"></time>";
      }
      networkPosts.innerHTML = numberOfPostsString;

      //Add marker to map
      new google.maps.Marker({
        position: data.networkPosition,
        map: map,
        title: data.event_name
      });

      //On click map move
      networkElement.addEventListener("click", function(e) {
        document.dispatchEvent(new CustomEvent("networkSelected", {
          detail: data
        }));
      });
    },

    renderNetworks = function(response) {
      response = JSON.parse(response.target.responseText).data;
      if (response == undefined || response == null) {
        return;

      }
      var networkList = document.getElementById(NETWORK_LIST_ID);

      //Clear list
      while (networkList.firstChild) {
        networkList.removeChild(networkList.firstChild);
      }

      for (var i in response) {
        var d = response[i];
        var data = {
          networkId: d.network_id,
          networkPosition: {
            lat: parseFloat(d.network_latitude),
            latitude: parseFloat(d.network_latitude),
            lng: parseFloat(d.network_longitude),
            longitude: parseFloat(d.network_longitude)
          },
          eventName: d.event_name,
          networkTimestamp: d.network_timestamp,
          numberOfPosts: d.number_of_posts,
          mostRecentPost: d.most_recent_post,
          distanceFromUser: d.distance_from_user
        };
        renderNetwork(networkList, data);
      }

      //Delay added for UI effect, not required.
      setTimeout(selectNetworkFromSavedData, 250);
      document.dispatchEvent(new CustomEvent("contentUpdated"));
    },

    loadNetworks = function() {
      var userLocation = window.eventNet.core.getLocation();

      var url = "api/v1/events?limit=1000";
      url += "&latitude=" + userLocation.latitude;
      url += "&longitude=" + userLocation.longitude;

      window.eventNet.xhr.load({
        url: url,
        callBacks: {
          load: renderNetworks,
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
    },

    createNetwork = function(e) {
      var nameField = document.getElementById("new-network-name");

      var eventName = nameField.value.trim();

      if (eventName == "") {
        nameField.classList.add("error");
        return;
      } else {
        nameField.classList.remove("error");
      }

      var userLocation = window.eventNet.core.getLocation();

      window.eventNet.xhr.load({
        method: "POST",
        url: "api/v1/events",
        payload: {
          eventName: eventName,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        callBacks: {
          load: loadNetworks,
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });

      nameField.value = "";
      return false;
    },

    selectNetwork = function(data) {
      if (data.detail) {
        data = data.detail;
      }
      updateMapCentre(data.networkPosition);

      var selected = document.getElementsByClassName("selected");
      for (var i = 0; i < selected.length; i++) {
        selected[i].classList.remove("selected");
      }
      document.getElementById(NETWORK_ID_PREFIX + data.networkId).classList.add("selected");
    },

    selectNetworkFromSavedData = function() {
      var selectedNetwork = window.eventNet.core.getSelectedNetwork();
      if (selectedNetwork > 0) {
        var network = document.getElementById(NETWORK_ID_PREFIX + selectedNetwork);
        if (network != null) {
          network.classList.add("selected");
        }
      }
    },

    setUp = function() {
      initMap();
      loadNetworks();
      document.addEventListener("positionUpdated", updateUserPosition);
      document.addEventListener("positionUpdated", loadNetworks);
      document.addEventListener("networkSelected", selectNetwork);
      document.getElementById("new-network-button").addEventListener("click", createNetwork);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.networks.setUp);
