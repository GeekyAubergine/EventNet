window.eventNet = window.eventNet || {};
window.eventNet.feed = (function() {
  "use strict";
  var
    COMMENT_SECTION_NAME = "comments",
    COMMENT_BUTTON_NAME = "comment-button",
    COMMENT_VISIBILITY_TOGGLE_BUTTON = "view-comments-button",
    COMMENT_SECTION_ID_PREFIX = "comments-post-",

    postsNewestDate,
    postsOldestDate,

    toggleWriteCommentSection = function(event) {
      event.preventDefault();
      var parent = event.target.parentNode.parentNode;
      var writeCommentSection = parent.getElementsByClassName("comment-creator")[0];
      window.eventNet.ui.toggleVisibility(writeCommentSection);
    },

    showHideComments = function(button, commentsSection) {
      window.eventNet.ui.toggleVisibility(commentsSection);
      if (event.target.innerHTML == "View Comments") {
        event.target.innerHTML = "Hide Comments";
      } else {
        event.target.innerHTML = "View Comments";
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

    renderComment = function(parent, commentData) {
      var comment;

      comment = window.eventNet.util.append(parent, "li");
      comment.classList.add("post");
      comment.id = "comment-" + commentData.comment_id;

      //User container
      var userIconContainer = window.eventNet.util.append(comment, "div");
      userIconContainer.classList.add("user-icon-container");

      var userIcon = window.eventNet.util.append(userIconContainer, "img");
      userIcon.src = "res/icons/default_user.svg";

      var contentContainer = window.eventNet.util.append(comment, "div");
      contentContainer.classList.add("content-container");

      //Comment info
      var commentInfo = window.eventNet.util.append(contentContainer, "div");
      commentInfo.classList.add("post-information")

      var userName = window.eventNet.util.append(commentInfo, "h3", ["user-name"]);
      userName.innerHTML = commentData.user_display_name;

      var date = window.eventNet.util.append(commentInfo, "time");
      date.setAttribute("datetime", commentData.comment_timestamp);

      //Content
      var content = window.eventNet.util.append(contentContainer, "div", ["content"]);
      var text = window.eventNet.util.append(content, "p");
      text.innerHTML = commentData.comment_content;
    },

    renderComments = function(data) {
      data = JSON.parse(data.target.responseText).data;

      if (data.length < 1) {
        return;
      }

      var postId = data[0].post_id;
      var commentList = document.getElementById(COMMENT_SECTION_ID_PREFIX + postId);

      for (var i in data) {
        renderComment(commentList, data[i]);
      }

      document.dispatchEvent(new CustomEvent("contentUpdated"));
    },

    loadComments = function(postId, limit) {
      var offset = 0;

      var networkId = window.eventNet.core.getSelectedNetwork();

      var url = "api/v1/networks/" + networkId + "/posts/" + postId +
        "/comments?offset=" + offset;

      if (limit != undefined) {
        url += "&limit=" + limit;
      }

      window.eventNet.xhr.load({
        url: url,
        callBacks: {
          load: renderComments,
          error: function(e) {
            console.log("Error loading posts");
            console.log(e);
          }
        }
      });
    },

    renderPost = function(postList, data, appendToEnd) {
      var post;
      var numberOfComments = parseInt(data.number_of_comments);

      //Determine where to append
      if (appendToEnd) {
        post = window.eventNet.util.append(postList, "li");
      } else {
        post = document.createElement("li");
        postList.insertBefore(post, postList.firstChild);
      }
      post.classList.add("post");
      post.id = "post-" + data.post_id;

      //User container
      var userIconContainer = window.eventNet.util.append(post, "div", ["user-icon-container"]);

      var userIcon = window.eventNet.util.append(userIconContainer, "img");
      userIcon.src = "res/icons/default_user.svg";

      var contentContainer = window.eventNet.util.append(post, "div", ["content-container"]);

      //Post info
      var postInfo = window.eventNet.util.append(contentContainer, "div", ["post-information"]);

      var userName = window.eventNet.util.append(postInfo, "h3", ["user-name"]);
      userName.innerHTML = data.user_display_name;

      var date = window.eventNet.util.append(postInfo, "time");
      date.setAttribute("datetime", data.post_timestamp);

      //Content
      var content = window.eventNet.util.append(contentContainer, "div", ["content"]);
      var text = window.eventNet.util.append(content, "p");
      text.innerHTML = data.post_content;

      //Buttons
      var buttons = window.eventNet.util.append(contentContainer, "div", ["button-container"]);

      var viewCommentsButton;
      if (numberOfComments > 0) {
        viewCommentsButton = window.eventNet.util.append(buttons, "a", ["button", "view-comments-button"]);
        viewCommentsButton.innerHTML = "View Comments";
      }

      var commentButton = window.eventNet.util.append(buttons, "a", ["button", "comment-button"]);
      commentButton.innerHTML = "Comment";
      commentButton.addEventListener("click", toggleWriteCommentSection);

      var reportButton = window.eventNet.util.append(buttons, "a", ["button", "report-button"]);
      reportButton.innerHTML = "Report";

      //Comments section
      var commentsSection = window.eventNet.util.append(contentContainer, "ul", ["comments", "hidden"]);
      commentsSection.id = COMMENT_SECTION_ID_PREFIX + data.post_id;

      //Show hide comments
      if (numberOfComments > 0) {
        viewCommentsButton.addEventListener("click", function(e) {
          showHideComments(e.target, commentsSection);
        });

        loadComments(data.post_id);
      }

      //Comment Writing
      var writeCommentSection = window.eventNet.util.append(contentContainer, "div", ["post", "comment-creator", "hidden"]);

      var commentSectionUserIcon = window.eventNet.util.append(writeCommentSection, "div", ["user-icon-container"]);

      var userImage = window.eventNet.util.append(commentSectionUserIcon, "img");
      userImage.src = window.eventNet.core.getUserImage();

      var writeCommentSectionContainer = window.eventNet.util.append(writeCommentSection, "div", ["content-container"]);

      var writeCommentSectionTextArea = window.eventNet.util.append(writeCommentSectionContainer, "textArea");
      writeCommentSectionTextArea.setAttribute("placeholder", "Write a comment");

      var writeCommentSectionButtonContainer = window.eventNet.util.append(writeCommentSectionContainer, "div", ["button-container"]);

      var writeCommentSectionCommentButton = window.eventNet.util.append(writeCommentSectionButtonContainer, "a", ["button", "commentButton"]);
      writeCommentSectionCommentButton.innerHTML = "Comment";

      writeCommentSectionCommentButton.addEventListener("click", createComment);
    },

    renderPosts = function(data) {
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
          renderPost(postList, data[i], false);
        } else if (Date.parse(postsNewestDate) < Date.parse(d.post_timestamp)) {
          postsNewestDate = d.post_timestamp;
          renderPost(postList, data[i], false);
        }
        //Update oldest post time
        else if (postsOldestDate == undefined || Date.parse(postsOldestDate) > Date.parse(d.post_timestamp)) {
          postsOldestDate = d.post_timestamp;
          renderPost(postList, data[i], true);
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
          load: renderPosts,
          error: function(e) {
            console.log("Error loading posts");
            console.log(e);
          }
        }
      });
    },

    createComment = function(event) {
      console.log(event);

      var commentSectionContainer = event.target.parentNode.parentNode;

      console.log(commentSectionContainer);

      var textArea = commentSectionContainer.getElementsByTagName("textarea")[0];
      var content = textArea.value;

      console.log(content);

      console.log(commentSectionContainer.parentNode);

      console.log(commentSectionContainer.parentNode.parentNode);

      console.log(commentSectionContainer.parentNode.parentNode.parentNode);

      var userId = window.eventNet.core.getUserId();
      var post = commentSectionContainer.parentNode.parentNode.parentNode;
      var postId = post.id.split("-")[1];

      var networkId = window.eventNet.core.getSelectedNetwork();
      var userLocation = window.eventNet.core.getLocation();

      var url = "api/v1/networks/" + networkId + "/posts/" + postId + "/comments";

      window.eventNet.xhr.load({
        method: "POST",
        url: url,
        payload: {
          userId: userId,
          commentContent: content,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        callBacks: {
          load: function(e) {
            loadComments(post, {
              post_id: postId
            }, false);
          },
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });

      textArea.value = "";
    },

    createPost = function(event) {
      var textArea = document.getElementById("new-post-textarea");
      var content = textArea.value;
      var userId = window.eventNet.core.getUserId();
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
      document.addEventListener("click", toggleNewPostSection);
      document.getElementById("new-post-post-button").addEventListener("click", createPost);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.feed.setUp);
