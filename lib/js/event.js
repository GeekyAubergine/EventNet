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

    //Initialises the map
    initMap = function() {
      map = new google.maps.Map(document.getElementById('map'), mapOptions);
    },

    //Draws the user location on the map
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

    //Centers the map on the given location
    updateMapCentre = function(position) {
      map.setCenter({
        lat: position.latitude,
        lng: position.longitude
      });
      map.setZoom(16);
    },

    //Updates the user position on the map
    updateUserPosition = function(e) {
      var position = e.detail;
      updateMapCentre(position);
      var zoom = 20 - Math.floor(Math.log(position.accuracy) / Math.log(2));
      map.setZoom(zoom);
      drawLocationOnMap(position);
    },

    /* ---- Rendering ---- */

    renderEvent = function(listElement, data) {
      var eventElement = window.eventNet.util.append(listElement, "li");
      eventElement.id = EVENT_ID_PREFIX + data.eventId;

      if (data.archived) {
        var archived = window.eventNet.util.append(eventElement, "h4");
        archived.innerHTML = "Archived";

        eventElement.classList.add("archived");
      }

      //Event name
      var eventName = window.eventNet.util.append(eventElement, "h3");
      eventName.innerHTML = data.eventName;

      var dataList = window.eventNet.util.append(eventElement, "ul");

      //Event distance
      var listElement1 = window.eventNet.util.append(dataList, "li");
      var eventDistance = window.eventNet.util.append(listElement1, "span", [DISTANCE_CLASS]);
      eventDistance.innerHTML = window.eventNet.util.beautifyDistance(parseInt(data.distanceFromUser)) + " away";

      //Event posts
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

    renderEvents = function(response) {
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
          distanceFromUser: d.distance_from_user,
          archived: d.event_archived === "1"
        };
        renderEvent(eventList, data);
      }

      //Delay added for UI effect, not required.
      selectEventFromSavedData();
      document.dispatchEvent(new CustomEvent("contentUpdated"));
    },

    //Loads events
    loadEvents = function() {
      var userLocation = window.eventNet.core.getLocation();

      var url = "api/v1/events?archived=true";
      url += "&latitude=" + userLocation.latitude;
      url += "&longitude=" + userLocation.longitude;
      url += "&searchTerm=" + searchBox.value.trim();

      window.eventNet.xhr.load({
        url: url,
        callBacks: {
          load: renderEvents
        }
      });
    },

    //Creates and event
    createEvent = function(e) {
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
          load: loadEvents,
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });

      searchBox.value = "";
      return false;
    },

    //Selects an event
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

    //Loads event and selects it
    selectEventFromSavedData = function() {
      var selectedEvent = window.eventNet.core.getSelectedEvent();
      if (selectedEvent > 0) {
        var event = document.getElementById(EVENT_ID_PREFIX + selectedEvent);
        if (event != null) {
          event.classList.add("selected");
        }
      }
    },

    setUp = function() {
      searchBox = document.getElementById("search-box");

      initMap();
      loadEvents();
      searchBox.addEventListener("keyup", loadEvents);
      document.addEventListener("positionUpdated", updateUserPosition);
      document.addEventListener("positionUpdated", loadEvents);
      document.addEventListener("eventSelected", selectEvent);
      document.getElementById("new-event-button").addEventListener("click", createEvent);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.events.setUp);
