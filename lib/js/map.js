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
    notificationsList,

    renderNotification = function(data) {
      var notification = document.createElement("article");
      notificationsList.insertBefore(notification, notificationsList.firstChild);

      //Notification type
      var content = window.eventNet.util.append(notification, "h3");
      content.innerHTML = data.type;

      //Notification content
      var content = window.eventNet.util.append(notification, "p");
      content.innerHTML = data.content;

      var timeStamp = data.timestamp;
      if (data.edited) {
        timeStamp = data.editedTimestamp;
        timeContainer.innerHTML = "Edited&nbsp";
      }
      var timeInfo = window.eventNet.util.append(notification, "time");
      timeInfo.setAttribute("datetime", data.date);

      var spacer = window.eventNet.util.append(notification, "span");
      spacer.innerHTML = "&nbsp,&nbsp";

      var distanceInfo = window.eventNet.util.append(notification, "span", ["distanceInfo"]);
      distanceInfo.setAttribute("data-latitude", data.position.latitude);
      distanceInfo.setAttribute("data-longitude", data.position.longitude);

      document.dispatchEvent(new CustomEvent("contentUpdated"));
      drawMarkerOnMap(data);
    },

    addNotificationEventListeners = function() {
      notificationsList = document.getElementById("notification-list");
      var date = (new Date()).toISOString().substring(0, 19).replace('T', ' ');

      window.eventNet.core.addSocketListener("newPost", function(data) {
        data.type = "Post";
        data.date = date;
        renderNotification(data);
      });

      window.eventNet.core.addSocketListener("newComment", function(data) {
        data.type = "Comment";
        data.date = date;
        renderNotification(data);
      });
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

    drawMarkerOnMap = function(data) {
      while (markers.length >= MAX_MARKERS) {
        var oldMarker = markers.shift();
        oldMarker.setMap(null);
      }

      var marker = new google.maps.Marker({
        position: {
          lat: data.position.latitude,
          lng: data.position.longitude
        },
        map: map,
        title: data.content
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

    initMap = function() {
      map = new google.maps.Map(document.getElementById('map'), mapOptions);
    },

    setEventTitle = function() {
      window.eventNet.xhr.load({
        url: "api/v1/events/" + window.eventNet.core.getSelectedEvent(),
        callBacks: {
          load: function(response) {
            response = JSON.parse(response.target.responseText).data;
            console.log(response);
            document.getElementById("event-name").innerHTML = response[0].event_name;
          }
        }
      });
    },

    setUp = function() {
      initMap();
      setEventTitle();
      addNotificationEventListeners();
      document.addEventListener("positionUpdated", updateUserPosition);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.map.setUp);
