window.eventNet = window.eventNet || {};
window.eventNet.searchBar = (function() {
  "use strict";

  var

    SEARCH_LIMIT = 5,
    DISTANCE_CLASS = "distance",
    NUMBER_OF_POSTS_CLASS = "number-of-posts",

    // ---- Posts ---- //

    renderPost = function(list, data) {
      var post = window.eventNet.util.append(list, "li");

      //Network distance
      var content = window.eventNet.util.append(post, "p");
      content.innerHTML = data.content;

      var timeStamp = data.timestamp;
      if (data.edited) {
        timeStamp = data.editedTimestamp;
        timeContainer.innerHTML = "Edited&nbsp";
      }
      var timeInfo = window.eventNet.util.append(post, "time");
      timeInfo.setAttribute("datetime", timeStamp);

      var spacer = window.eventNet.util.append(post, "span");
      spacer.innerHTML = "&nbspago,&nbsp";

      var distanceInfo = window.eventNet.util.append(post, "span", ["distanceInfo"]);
      distanceInfo.setAttribute("data-latitude", data.latitude);
      distanceInfo.setAttribute("data-longitude", data.longitude);

      post.addEventListener("click", function() {
        window.location.href = "/?post=" + data.postId;
      });
    },

    renderPosts = function(response) {
      response = JSON.parse(response.target.responseText).data;

      var list = document.getElementById("search-results-posts");
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
            postId: d.post_id,
            timestamp: d.post_timestamp,
            content: d.post_content,
            latitude: d.post_latitude,
            longitude: d.post_longitude,
          };
          renderPost(list, data);
        }
      } else {
        window.eventNet.ui.hide(container);
      }
      document.dispatchEvent(new CustomEvent("contentUpdated"));
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

    renderComment = function(list, data) {
      var comment = window.eventNet.util.append(list, "li");

      //Network distance
      var content = window.eventNet.util.append(post, "p");
      content.innerHTML = data.content;

      var timeStamp = data.timestamp;
      if (data.edited) {
        timeStamp = data.editedTimestamp;
        timeContainer.innerHTML = "Edited&nbsp";
      }
      var timeInfo = window.eventNet.util.append(comment, "time");
      timeInfo.setAttribute("datetime", timeStamp);

      var spacer = window.eventNet.util.append(comment, "span");
      spacer.innerHTML = "&nbspago,&nbsp";

      var distanceInfo = window.eventNet.util.append(comment, "span", ["distanceInfo"]);
      distanceInfo.setAttribute("data-latitude", data.latitude);
      distanceInfo.setAttribute("data-longitude", data.longitude);

      comment.addEventListener("click", function() {
        window.location.href = "/?post=" + data.postId;
      });
    },

    renderComments = function(response) {
      response = JSON.parse(response.target.responseText).data;

      var list = document.getElementById("search-results-comments");
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
            postId: d.post_id,
            commentId: d.comment_id,
            timestamp: d.comment_timestamp,
            content: d.comment_content,
            latitude: d.comment_latitude,
            longitude: d.comment_longitude,
          };
          renderPost(list, data);
        }
      } else {
        window.eventNet.ui.hide(container);
      }
      document.dispatchEvent(new CustomEvent("contentUpdated"));
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
        var archived = window.eventNet.util.append(eventElement, "h6");
        archived.innerHTML = "Archived";
        eventElement.classList.add("archived");
      }

      //Network name
      var eventName = window.eventNet.util.append(eventElement, "p");
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

      //On click change event and reload
      eventElement.addEventListener("click", function(e) {
        document.dispatchEvent(new CustomEvent("eventSelected", {
          detail: data
        }));
        location.reload();
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

      var showMessage = "Show " + data.name;
      if (data.name.substring(data.name.length - 1).toLowerCase() != "s") {
        showMessage += "'s posts";
      }

      container.setAttribute("title", showMessage)

      var icon = window.eventNet.util.append(container, "img");
      icon.src = data.icon;
      icon.alt = data.name + " user icon";

      var name = window.eventNet.util.append(container, "h4");
      name.innerHTML = data.name;

      container.addEventListener("click", function() {
        window.location.href = "/?user=" + data.id;
      });
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
            icon: response[i].user_icon,
            id: response[i].id
          };
          renderUser(list, data);
        }
      } else {
        window.eventNet.ui.hide(container);
      }
    },

    searchUsers = function(phrase) {
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
      var searchBox = document.getElementById("search");
      searchBox.addEventListener("keyup", function() {
        search(this.value);
      });

      var results = document.getElementById("search-results-container");
      searchBox.addEventListener("focus", function() {
        search(this.value);
        window.eventNet.ui.show(results);
      });
      searchBox.addEventListener("blur", function() {
        setTimeout(function() {
          window.eventNet.ui.hide(results);
        }, 10);
      });
    };

  return {
    "setUp": setUp
  }

}());

window.eventNet.searchBar.setUp();
