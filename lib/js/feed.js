window.eventNet = window.eventNet || {};
window.eventNet.feed = (function() {
  "use strict";
  var
    POSTS_ID = "posts",
    POST_CLASS = "post",
    META_CLASS = "meta",
    USER_ICON_CLASS = "user-icon",
    INFO_CLASS = "info",
    CONTENT_CLASS = "content",
    CONTROLS_CLASS = "controls",
    COMMENTS_CLASS = "comments",
    COMMENT_CLASS = "comment",
    COMMENT_CREATOR_CLASS = "comment-creator",
    LOAD_MORE_COMMENTS_BUTTON_CLASS = "load-more-comments-button",
    POST_BUTTON_ID = "post-creator-post-button",
    POST_TEXTAREA_ID = "post-creator-textarea",
    USER_ICON_ID = "user-icon",
    COMMENTS_ID_PREFIX = "comments-",

    DEFAULT_NUMBER_OF_COMMENTS_TO_LOAD = 2,
    COMMENTS_TO_LOAD_PER_LOAD_MORE_CALL = 5,

    postsNewestDate,
    postsOldestDate,

    getCommentsListForPostId = function(postId) {
      return document.getElementById(COMMENTS_ID_PREFIX + postId);
    },

    createPost = function(event) {
      event.preventDefault();
      var textArea = document.getElementById(POST_TEXTAREA_ID);
      var content = textArea.value;
      var userId = window.eventNet.core.getUserId();
      var eventId = window.eventNet.core.getSelectedEvent();
      var userLocation = window.eventNet.core.getLocation();

      if (content.length == 0) {
        return;
      }

      var url = "api/v1/posts";

      window.eventNet.xhr.load({
        method: "POST",
        url: url,
        payload: {
          eventId: eventId,
          userId: userId,
          postContent: content,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        callBacks: {
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });

      textArea.value = "";

      window.eventNet.core.emitToSocket("userPosted");
    },

    createComment = function(postId, commentContent, commentList) {
      var eventId = window.eventNet.core.getSelectedEvent();
      var userLocation = window.eventNet.core.getLocation();
      var userId = window.eventNet.core.getUserId();

      if (commentContent.length == 0) {
        return;
      }

      var url = "api/v1/comments";

      //Minus one to account for load more button
      var numberOfCommentsLoaded = commentList.childNodes.length - 1;

      window.eventNet.xhr.load({
        method: "POST",
        url: url,
        payload: {
          postId: postId,
          userId: userId,
          commentContent: commentContent,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        callBacks: {
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });

      window.eventNet.core.emitToSocket("userCommented", {
        postId: postId,
        userId: window.eventNet.core.getUserId()
      });
    },

    loadCommentsOnUpdate = function(postId, userId) {
      var commentsList = getCommentsListForPostId(postId);
      var numberOfCommentsLoaded = commentsList.childNodes.length - 1;

      if (userId == window.eventNet.core.getUserId()) {
        loadComments(postId, commentsList, 1E12,
          numberOfCommentsLoaded);
      } else {
        if (numberOfCommentsLoaded < DEFAULT_NUMBER_OF_COMMENTS_TO_LOAD) {
          loadComments(postId, commentsList, 1,
            numberOfCommentsLoaded);
        } else {
          var loadMoreCommentsButton = commentsList.getElementsByClassName(LOAD_MORE_COMMENTS_BUTTON_CLASS)[0];
          window.eventNet.ui.show(loadMoreCommentsButton);
        }
      }
    },

    loadMoreComments = function(postId, commentList) {
      //Minus one to account for load more button
      var numberOfCommentsLoaded = commentList.childNodes.length - 1;
      loadComments(postId, commentList, COMMENTS_TO_LOAD_PER_LOAD_MORE_CALL,
        numberOfCommentsLoaded);
    },

    typedInCommentCreator = function(event, postId, textArea, commentsList) {
      var typedLetter = event.keyIdentifier;
      var commentContent = textArea.value;
      if (typedLetter == "Enter") {
        event.preventDefault();
        textArea.value = "";
        createComment(postId, commentContent, commentsList);
      }
    },

    renderUserIcon = function(parent, data) {
      var container = window.eventNet.util.append(parent, "div", [USER_ICON_CLASS]);
      var image = window.eventNet.util.append(container, "img");
      if (data.userIcon == "undefined") {
        data.userIcon = "/res/icons/default_user.svg";
      }
      image.src = data.userIcon;
    },

    renderContent = function(parent, data) {
      var container = window.eventNet.util.append(parent, "div", [CONTENT_CLASS]);

      var userName = window.eventNet.util.append(container, "h3");
      userName.innerHTML = data.userName;

      var content = window.eventNet.util.append(container, "p");
      content.innerHTML = data.content;
    },

    renderHead = function(parent, data) {
      var container = window.eventNet.util.append(parent, "div", ["container"]);

      renderUserIcon(container, data);
      renderContent(container, data);
    },

    renderMeta = function(parent, data) {
      var container = window.eventNet.util.append(parent, "ul", [META_CLASS]);

      var timeContainer = window.eventNet.util.append(container, "li");

      var timeInfo = window.eventNet.util.append(timeContainer, "time");
      timeInfo.setAttribute("datetime", data.timestamp);

      var distanceContainer = window.eventNet.util.append(container, "li");

      var distanceInfo = window.eventNet.util.append(distanceContainer, "span", ["distanceInfo"]);
      distanceInfo.setAttribute("data-latitude", data.latitude);
      distanceInfo.setAttribute("data-longitude", data.longitude);

      if (!data.commentId) {
        var comments = window.eventNet.util.append(container, "li", ["clickable"]);
        var numberOfComments = data.numberOfComments;
        if (numberOfComments == undefined) {
          numberOfComments = 0;
        }
        comments.innerHTML = numberOfComments + " comment";

        if (numberOfComments != 1) {
          comments.innerHTML += "s";
        }

        comments.addEventListener("click", function() {
          window.eventNet.ui.toggleVisibility(getCommentsListForPostId(data.postId));
        });
      }

      var userId = window.eventNet.core.getUserId();
      if (data.userId == userId) {
        var edit = window.eventNet.util.append(container, "li", ["clickable"]);
        comments.innerHTML = "Edit";
      }

      var report = window.eventNet.util.append(container, "li", ["clickable"]);
      report.innerHTML = "Report";
    },

    renderComment = function(parent, data) {
      var comment = document.createElement("li");
      comment.classList.add(COMMENT_CLASS);
      parent.insertBefore(comment, parent.lastChild);

      renderHead(comment, data);
      renderMeta(comment, data);
    },

    renderComments = function(commentList, response) {
      response = JSON.parse(response.target.responseText).data;
      if (response.length == 0) {
        return;
      }

      for (var i in response) {
        var d = response[i];
        var data = {
          userName: d.user_display_name,
          userIcon: d.user_icon,
          timestamp: d.comment_timestamp,
          postId: d.post_id,
          commentId: d.comment_id,
          content: d.comment_content,
          numberOfComments: d.number_of_comments,
          latitude: d.comment_latitude,
          longitude: d.comment_longitude
        };
        renderComment(commentList, data);
      }

      var numberOfComments = response[0].number_of_comments;
      var numberOfCommentsLoaded = commentList.childNodes.length - 1;

      if (numberOfCommentsLoaded >= numberOfComments) {
        window.eventNet.ui.hide(commentList.lastChild);
      }

      document.dispatchEvent(new CustomEvent("contentUpdated"));
    },

    loadComments = function(postId, commentList, limit, offset) {
      offset = offset == undefined ? 0 : offset;

      var url = "api/v1/comments?postId=" + postId + "&offset=" + offset;

      if (limit != undefined) {
        url += "&limit=" + limit;
      }

      window.eventNet.xhr.load({
        url: url,
        callBacks: {
          load: function(response) {
            renderComments(commentList, response);
          },
          error: function(e) {
            console.log("Error loading posts");
            console.log(e);
          }
        }
      });
    },

    renderPost = function(postList, data, appendToEnd) {
      var post;
      var numberOfComments = parseInt(data.numberOfComments);

      //Determine where to append
      if (appendToEnd) {
        post = window.eventNet.util.append(postList, "article");
      } else {
        post = document.createElement("article");
        postList.insertBefore(post, postList.firstChild);
      }
      post.classList.add(POST_CLASS);

      renderHead(post, data);
      renderMeta(post, data);

      //Comments
      var comments = window.eventNet.util.append(post, "ul", [COMMENTS_CLASS]);
      comments.id = COMMENTS_ID_PREFIX + data.postId;

      var loadMoreCommentsButton = window.eventNet.util.append(comments, "li", [LOAD_MORE_COMMENTS_BUTTON_CLASS]);
      loadMoreCommentsButton.innerHTML = "Load More Comments";
      window.eventNet.ui.hide(comments);

      if (numberOfComments > 0) {
        loadComments(data.postId, comments, DEFAULT_NUMBER_OF_COMMENTS_TO_LOAD);
      }

      loadMoreCommentsButton.addEventListener("click", function(event) {
        loadMoreComments(data.postId, comments);
      });

      //Comment creator
      var commentCreator = window.eventNet.util.append(post, "div", [COMMENT_CREATOR_CLASS]);
      var commenterIconContainer = window.eventNet.util.append(commentCreator, "div", [USER_ICON_CLASS]);
      var commenterIcon = window.eventNet.util.append(commenterIconContainer, "img");
      commenterIcon.src = window.eventNet.core.getUserImage();

      var commentCreatorTextarea = window.eventNet.util.append(commentCreator, "textarea");
      commentCreatorTextarea.setAttribute("placeholder", "Write a comment");

      commentCreatorTextarea.addEventListener("keypress", function(event) {
        typedInCommentCreator(event, data.postId, commentCreatorTextarea, comments);
      });
    },

    renderPosts = function(response) {
      response = JSON.parse(response.target.responseText).data;
      if (response == undefined || response.length == 0) {
        return;
      }

      var postList = document.getElementById(POSTS_ID);

      for (var i in response) {
        var d = response[i];
        var data = {
          userName: d.user_display_name,
          userIcon: d.user_icon,
          timestamp: d.post_timestamp,
          postId: d.post_id,
          content: d.post_content,
          numberOfComments: d.number_of_comments,
          latitude: d.post_latitude,
          longitude: d.post_longitude
        };

        //Update newest post time
        if (postsNewestDate == undefined || postsOldestDate == undefined) {
          postsNewestDate = postsOldestDate = data.timestamp;
          renderPost(postList, data, false);
        } else if (Date.parse(postsNewestDate) < Date.parse(data.timestamp)) {
          postsNewestDate = data.timestamp;
          renderPost(postList, data, false);
        }
        //Update oldest post time
        else if (postsOldestDate == undefined || Date.parse(postsOldestDate) > Date.parse(data.timestamp)) {
          postsOldestDate = data.timestamp;
          renderPost(postList, data, true);
        }
      }

      document.dispatchEvent(new CustomEvent("contentUpdated"));
    },

    loadPosts = function(loadNew) {
      var eventId = window.eventNet.core.getSelectedEvent();

      if (eventId == undefined) {
        return;
      }

      var url = "api/v1/posts?eventId=" + eventId + "&limit=100";

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

    setUserIcon = function() {
      var icon = document.getElementById(USER_ICON_ID);
      icon.src = window.eventNet.core.getUserImage();
    },

    addSocketListeners = function() {
      window.eventNet.core.addSocketListener("newPost", function(data) {
        console.log("New post");
        loadPosts(true);
      });

      window.eventNet.core.addSocketListener("newComment", function(data) {
        console.log("New comment for post " + data.postId);
        loadCommentsOnUpdate(data.postId, data.userId);
      });
    },

    setUp = function() {
      loadPosts(true);
      setUserIcon();
      addSocketListeners();
      document.getElementById(POST_BUTTON_ID).addEventListener("click", createPost);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.feed.setUp);
