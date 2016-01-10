window.eventNet = window.eventNet || {};
window.eventNet.feed = (function() {
  "use strict";
  var
    COMMENT_SECTION_NAME = "comments",
    COMMENT_BUTTON_NAME = "comment-button",
    COMMENT_VISIBILITY_TOGGLE_BUTTON = "view-comments-button",

    postsNewestDate,
    postsOldestDate,

    toggleCommentSectionVisibilty = function(commentSection) {
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

    toggleNewPostSection = function(event) {
      var clickedOnNewPost = event.target.id.indexOf("new-post") > -1;
      var postHasContent = document.getElementById("new-post-textarea").value.length > 0;

      if (clickedOnNewPost || postHasContent) {
        document.getElementById("new-post").classList.remove("collapsed");
      } else {
        document.getElementById("new-post").classList.add("collapsed");
      }
    },

    addPost = function(postList, postData, appendToEnd) {
      var post;

      if (appendToEnd) {
        post = window.eventNet.util.append(postList, "li");
      } else {
        post = document.createElement("li");
        postList.insertBefore(post, postList.firstChild);
      }
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

      //Buttons
      var buttons = window.eventNet.util.append(contentContainer, "div");
      buttons.classList.add("button-container");

      var commentButton = window.eventNet.util.append(buttons, "a");
      commentButton.classList.add("button");
      commentButton.classList.add("comment-button");
      commentButton.innerHTML = "Comment";

      var reportButton = window.eventNet.util.append(buttons, "a");
      reportButton.classList.add("button");
      reportButton.classList.add("report-button");
      reportButton.innerHTML = "Report";
    },

    listPosts = function(data) {
      data = JSON.parse(data.target.responseText).data;

      if (data.length == 0) {
        return;
      }

      var postList = document.getElementById("posts");

      for (var i in data) {
        var d = data[i];

        //Update newest post time
        if (postsNewestDate == undefined || postsOldestDate == undefined) {
          postsNewestDate = postsOldestDate = d.post_timestamp;
          addPost(postList, data[i], false);
        } else if (Date.parse(postsNewestDate) < Date.parse(d.post_timestamp)) {
          postsNewestDate = d.post_timestamp;
          addPost(postList, data[i], false);
        }
        //Update oldest post time
        else if (postsOldestDate == undefined || Date.parse(postsOldestDate) > Date.parse(d.post_timestamp)) {
          postsOldestDate = d.post_timestamp;
          addPost(postList, data[i], true);
        }
      }

      document.dispatchEvent(new CustomEvent("contentUpdated"));
    },

    loadPosts = function(loadNew) {
      var networkId = window.eventNet.core.getSelectedNetwork();

      var url = "api/v1/networks/" + networkId + "/posts?limit=100";

      if (postsNewestDate != undefined && postsOldestDate != undefined) {
        if (loadNew) {
          url += "&before=" + postsNewestDate;
        } else {
          url += "&after=" + postsOldestDate;
        }
      }

      window.eventNet.xhr.load({
        url: url,
        callBacks: {
          load: listPosts,
          error: function(e) {
            console.log("Error loading posts");
            console.log(e);
          }
        }
      });
    },

    createPost = function(event) {
      console.log("Creating post");
      var textArea = document.getElementById("new-post-textarea");
      var content = textArea.value;
      var userId = 2;
      var networkId = window.eventNet.core.getSelectedNetwork();
      var userLocation = window.eventNet.core.getLocation();

      var url = "api/v1/networks/" + networkId + "/posts";

      window.eventNet.xhr.load({
        method: "POST",
        url: url,
        payload: {
          userId: userId,
          postContent: content,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        callBacks: {
          load: function(e) {
            loadPosts(true);
          },
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });

      textArea.value = "";
      document.getElementById("new-post").classList.add("collapsed");
    },

    setUp = function() {
      loadPosts(true);
      window.eventNet.ui.addEventListenerToClassName(COMMENT_VISIBILITY_TOGGLE_BUTTON, "click", showHideComments);
      window.eventNet.ui.addEventListenerToClassName(COMMENT_BUTTON_NAME, "click", toggleCommentSectionVisibilty);
      document.addEventListener("click", toggleNewPostSection);
      document.getElementById("new-post-post-button").addEventListener("click", createPost);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.feed.setUp);
