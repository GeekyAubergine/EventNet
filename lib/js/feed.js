window.eventNet = window.eventNet || {};
window.eventNet.feed = (function() {
  "use strict";
  var
    COMMENT_SECTION_NAME = "comments",
    COMMENT_BUTTON_NAME = "comment-button",
    COMMENT_VISIBILITY_TOGGLE_BUTTON = "view-comments-button",

    toggleCommentSectionVisibilty = function (commentSection) {
        window.eventNet.ui.toggleDivVisibility(commentSection);
    },

    showHideComments = function(event) {
      event.preventDefault();
      var parent = event.target.parentNode.parentNode.parentNode.parentNode;
      var commentSections = parent.getElementsByClassName(COMMENT_SECTION_NAME);

      if (commentSections.length > 0) {
        toggleCommentSectionVisibilty(commentSections[0]);
        if (event.target.innerHTML == "View Comments") {
          event.target.innerHTML = "Hide Comments";
        } else {
          event.target.innerHTML = "View Comments";
        }
      }
    },

    setUp = function() {
      window.eventNet.ui.addEventListenerToClassName(COMMENT_VISIBILITY_TOGGLE_BUTTON, "click", showHideComments);
      window.eventNet.ui.addEventListenerToClassName(COMMENT_BUTTON_NAME, "click", toggleCommentSectionVisibilty);
    };

    return {
        "setUp": setUp
    };
}());

window.addEventListener("load", window.eventNet.feed.setUp);
