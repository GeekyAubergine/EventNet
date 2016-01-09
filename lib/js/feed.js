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

    addPost = function(postList, postData) {
      var post = window.eventNet.util.append(postList, "li");
      post.classList.add("post");
      post.id = "post-" + postData.post_id;

      //User container
      var userIconContainer = window.eventNet.util.append(post, "div");
      userIconContainer.classList.add("user-icon-container");

      var userIcon = window.eventNet.util.append(userIconContainer, "img");
      userIcon.src = "res/icons/default_user.svg";

      var contentContainer = window.eventNet.util.append(post, "div");
      contentContainer.classList.add("content-container");

      //Post info
      var postInfo = window.eventNet.util.append(contentContainer, "div");
      postInfo.classList.add("post-information")

      var userName = window.eventNet.util.append(postInfo, "h3");
      userName.classList.add("user-name")
      userName.innerHTML = postData.user_display_name;

      var date = window.eventNet.util.append(postInfo, "time");
      date.setAttribute("datetime", postData.post_timestamp);

      //Content
      var content = window.eventNet.util.append(contentContainer, "div");
      content.classList.add("content")
      var text = window.eventNet.util.append(content, "p");
      text.innerHTML = postData.post_content;

      //Controls
      var controls = window.eventNet.util.append(contentContainer, "div");
      controls.classList.add("controls");
      var controlsList = window.eventNet.util.append(controls, "ul");

      var commentButtonContainer = window.eventNet.util.append(controlsList, "li");
      var commentButton = window.eventNet.util.append(commentButtonContainer, "a");
      commentButton.classList.add("comment-button");
      commentButton.innerHTML = "Comment";

      var reportButtonContainer = window.eventNet.util.append(controlsList, "li");
      var reportButton = window.eventNet.util.append(reportButtonContainer, "a");
      reportButton.classList.add("report-button");
      reportButton.innerHTML = "Report";

    },

    listPosts = function(data) {
      data = JSON.parse(data.target.responseText).data;

      var postList = document.getElementById("posts-list");

      for (var i in data) {
        addPost(postList, data[i]);
      }

      document.dispatchEvent(new CustomEvent("contentUpdated"));
    },

    loadPosts = function() {
      var networkId = window.eventNet.core.getSelectedNetwork();
      window.eventNet.xhr.load({
        url: "api/v1/networks/" + networkId + "/posts?limit=1000",
        callBacks: {
          load: listPosts,
          error: function(e) {
            console.log("Error loading posts");
            console.log(e);
          }
        }
      });
    },

    setUp = function() {
      loadPosts();
      window.eventNet.ui.addEventListenerToClassName(COMMENT_VISIBILITY_TOGGLE_BUTTON, "click", showHideComments);
      window.eventNet.ui.addEventListenerToClassName(COMMENT_BUTTON_NAME, "click", toggleCommentSectionVisibilty);
    };

    return {
        "setUp": setUp
    };
}());

window.addEventListener("load", window.eventNet.feed.setUp);
