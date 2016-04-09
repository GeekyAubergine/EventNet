window.eventNet = window.eventNet || {};
window.eventNet.search = (function() {
  "use strict";

  var

    SEARCH_LIMIT = 5,
    DISTANCE_CLASS = "distance",
    NUMBER_OF_POSTS_CLASS = "number-of-posts",

    // ---- Posts ---- //

    renderPosts = function(response) {
      response = JSON.parse(response.target.responseText).data;
    },

    searchPosts = function(phrase) {
      window.eventNet.xhr.load({
        url: "api/v1/posts?limit=" + SEARCH_LIMIT + "&searchTerm=" + phrase,
        callBacks: {
          load: renderPosts
        }
      })
    },

    // ---- Comments ---- //

    renderComments = function(response) {
      response = JSON.parse(response.target.responseText).data;
    },

    searchComments = function(phrase) {
      window.eventNet.xhr.load({
        url: "api/v1/comments?limit=" + SEARCH_LIMIT + "&searchTerm=" + phrase,
        callBacks: {
          load: renderComments
        }
      })
    },

    // ---- Events ---- //

    renderEvent = function(list, data) {
      var eventElement = window.eventNet.util.append(list, "li");

      if (data.archived) {
        var archived = window.eventNet.util.append(eventElement, "h4");
        archived.innerHTML = "Archived";

        eventElement.classList.add("archived");
      }

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

      //On click map move
      eventElement.addEventListener("click", function(e) {
        document.dispatchEvent(new CustomEvent("eventSelected", {
          detail: data
        }));
      });
    },

    renderEvents = function(response) {
      response = JSON.parse(response.target.responseText).data;

      var list = document.getElementById("search-results-events");
      //Remove current results
      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }

      //Show hide user results
      var container = list.parentElement;
      if (response.length > 0) {
        window.eventNet.ui.show(container);

        //Render results
        for (var i = 0; i < response.length; i++) {
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
          renderEvent(list, data);
        }
      } else {
        window.eventNet.ui.hide(container);
      }
    },

    searchEvents = function(phrase) {
      var userLocation = window.eventNet.core.getLocation();

      var url = "api/v1/events?limit=" + SEARCH_LIMIT;
      url += "&latitude=" + userLocation.latitude;
      url += "&longitude=" + userLocation.longitude;
      url += "&searchTerm=" + phrase;

      window.eventNet.xhr.load({
        url: url,
        callBacks: {
          load: renderEvents
        }
      })
    },

    // ---- Users ---- //

    renderUser = function(list, data) {
      var container = window.eventNet.util.append(list, "li");

      var icon = window.eventNet.util.append(container, "img");
      icon.src = data.icon;
      icon.alt = data.name + " user icon";

      var name = window.eventNet.util.append(container, "h4");
      name.innerHTML = data.name;
    },

    renderUsers = function(response) {
      response = JSON.parse(response.target.responseText).data;

      var list = document.getElementById("search-results-users");
      //Remove current results
      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }

      //Show hide user results
      var container = list.parentElement;
      if (response.length > 0) {
        window.eventNet.ui.show(container);

        //Render results
        for (var i = 0; i < response.length; i++) {
          var data = {
            name: response[i].user_display_name,
            icon: response[i].user_icon
          };
          renderUser(list, data);
        }
      } else {
        window.eventNet.ui.hide(container);
      }
    },

    searchUsers = function(phrase) {
      var userLocation = window.eventNet.core.getLocation();
      window.eventNet.xhr.load({
        url: "api/v1/users?limit=" + SEARCH_LIMIT + "&searchTerm=" + phrase,
        callBacks: {
          load: renderUsers
        }
      })
    },

    search = function(phrase) {
      if (phrase.length == 0) {
        phrase = "§±§";
      }
      searchPosts(phrase);
      searchComments(phrase);
      searchEvents(phrase);
      searchUsers(phrase);
    },

    setUp = function(data) {
      var searchBox =  document.getElementById("search");
      searchBox.addEventListener("keyup", function() {
        search(this.value);
      });

      var results = document.getElementById("search-results-container");
      searchBox.addEventListener("focus", function() {
        search(this.value);
        window.eventNet.ui.show(results);
      });
      searchBox.addEventListener("blur", function() {
        // window.eventNet.ui.hide(results);
      });
    };

  return {
    "setUp": setUp
  }

}());

window.eventNet.search.setUp();
