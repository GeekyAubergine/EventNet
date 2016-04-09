window.eventNet = window.eventNet || {};
window.eventNet.search = (function() {
  "use strict";

  var

    SEARCH_LIMIT = 5,

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

    renderEvents = function(response) {
      response = JSON.parse(response.target.responseText).data;
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
      console.log(response.length);
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

    showHideSearchBox = function() {
      var search = document.getElementById("search");
      var results = document.getElementById("search-results-container");
      if (search == document.activeElement) {
        window.eventNet.ui.show(results);
      } else {
        window.eventNet.ui.hide(results);
      }
    },

    search = function(phrase) {
      if (phrase.length == 0) {
        phrase = "§±§";
      }
      showHideSearchBox();
      searchPosts(phrase);
      searchComments(phrase);
      searchEvents(phrase);
      searchUsers(phrase);
    },

    setUp = function(data) {
      document.getElementById("search").addEventListener("keyup", function() {
        search(this.value);
      });
    };

  return {
    "setUp": setUp
  }

}());

window.eventNet.search.setUp();
