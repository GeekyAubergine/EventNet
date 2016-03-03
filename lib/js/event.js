window.eventNet = window.eventNet || {};
window.eventNet.events = (function() {
  "use strict";
  var
    EVENT_LIST_ID = "events",
    EVENT_ID_PREFIX = "event-",
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
    searchBox,

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

    renderNetwork = function(listElement, data) {
      var eventElement = window.eventNet.util.append(listElement, "li");
      eventElement.id = EVENT_ID_PREFIX + data.eventId;

      //Network name
      var eventName = window.eventNet.util.append(eventElement, "h3");
      eventName.innerHTML = data.eventName;

      var dataList = window.eventNet.util.append(eventElement, "ul");

      //Network distance
      var listElement1 = window.eventNet.util.append(dataList, "li");
      var eventDistance = window.eventNet.util.append(listElement1, "span", [DISTANCE_CLASS]);
      eventDistance.innerHTML = window.eventNet.util.beautifyDistance(parseInt(data.distanceFromUser)) + " away";

      //Network posts
      var listElement2 = window.eventNet.util.append(dataList, "li");
      var eventPosts = window.eventNet.util.append(listElement2, "span", [NUMBER_OF_POSTS_CLASS]);

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
      eventPosts.innerHTML = numberOfPostsString;

      //Add marker to map
      new google.maps.Marker({
        position: data.eventPosition,
        map: map,
        title: data.event_name
      });

      //On click map move
      eventElement.addEventListener("click", function(e) {
        document.dispatchEvent(new CustomEvent("eventSelected", {
          detail: data
        }));
      });
    },

    renderNetworks = function(response) {
      response = JSON.parse(response.target.responseText).data;
      if (response == undefined || response == null) {
        return;

      }
      var eventList = document.getElementById(EVENT_LIST_ID);

      //Clear list
      while (eventList.firstChild) {
        eventList.removeChild(eventList.firstChild);
      }

      for (var i in response) {
        var d = response[i];
        var data = {
          eventId: d.event_id,
          eventPosition: {
            lat: parseFloat(d.event_latitude),
            latitude: parseFloat(d.event_latitude),
            lng: parseFloat(d.event_longitude),
            longitude: parseFloat(d.event_longitude)
          },
          eventName: d.event_name,
          eventTimestamp: d.event_timestamp,
          numberOfPosts: d.number_of_posts,
          mostRecentPost: d.most_recent_post,
          distanceFromUser: d.distance_from_user
        };
        renderNetwork(eventList, data);
      }

      //Delay added for UI effect, not required.
      selectEventFromSavedData();
      document.dispatchEvent(new CustomEvent("contentUpdated"));
    },

    loadNetworks = function() {
      var userLocation = window.eventNet.core.getLocation();

      var url = "api/v1/events?limit=1000";
      url += "&latitude=" + userLocation.latitude;
      url += "&longitude=" + userLocation.longitude;
      url += "&name=" + searchBox.value.trim();

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
      var eventName = searchBox.value.trim();

      if (eventName == "") {
        searchBox.classList.add("error");
        return;
      } else {
        searchBox.classList.remove("error");
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

      searchBox.value = "";
      return false;
    },

    selectEvent = function(data) {
      if (data.detail) {
        data = data.detail;
      }
      updateMapCentre(data.eventPosition);

      var selected = document.getElementsByClassName("selected");
      for (var i = 0; i < selected.length; i++) {
        selected[i].classList.remove("selected");
      }
      document.getElementById(EVENT_ID_PREFIX + data.eventId).classList.add("selected");
    },

    selectEventFromSavedData = function() {
      var selectedNetwork = window.eventNet.core.getSelectedEvent();
      if (selectedNetwork > 0) {
        var event = document.getElementById(EVENT_ID_PREFIX + selectedNetwork);
        if (event != null) {
          event.classList.add("selected");
        }
      }
    },

    setUp = function() {
      searchBox = document.getElementById("search-box");

      initMap();
      loadNetworks();
      searchBox.addEventListener("keyup", loadNetworks);
      document.addEventListener("positionUpdated", updateUserPosition);
      document.addEventListener("positionUpdated", loadNetworks);
      document.addEventListener("eventSelected", selectEvent);
      document.getElementById("new-event-button").addEventListener("click", createNetwork);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.events.setUp);
