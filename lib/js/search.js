window.eventNet = window.eventNet || {};
window.eventNet.search = (function() {
  "use strict";

  var

    SEARCH_LIMIT = 5,

    // ---- Posts ---- //

    renderPosts = function(response) {
      response = JSON.parse(response.target.responseText).data;
      console.log(response);
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
      console.log(response);
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
      console.log(response);
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
          load: renderComments
        }
      })
    },

    // ---- Users ---- //

    renderUsers = function(response) {
      response = JSON.parse(response.target.responseText).data;
      console.log(response);
    },

    searchUsers = function(phrase) {
      var userLocation = window.eventNet.core.getLocation();

      window.eventNet.xhr.load({
        url: "api/v1/users?limit=" + SEARCH_LIMIT + "&searchTerm=" + phrase,
        callBacks: {
          load: renderComments
        }
      })
    },

    search = function(phrase) {
      searchPosts(phrase);
      searchComments(phrase);
      searchEvents(phrase);
      searchUsers(phrase);
    },

    setUp = function(data) {
      document.getElementById("search").addEventListener("keyup", function() {
        if (this.value.length > 2) {
          search(this.value);
        }
      });
    };

  return {
    "setUp": setUp
  }

}());

window.eventNet.search.setUp();
