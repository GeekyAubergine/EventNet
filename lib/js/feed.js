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

    DEFAULT_NUMBER_OF_COMMENTS_TO_LOAD = 2,
    COMMENTS_TO_LOAD_PER_LOAD_MORE_CALL = 5,

    postsNewestDate,
    postsOldestDate,

    createPost = function(event) {
      event.preventDefault();
      var textArea = document.getElementById(POST_TEXTAREA_ID);
      var content = textArea.value;
      var userId = window.eventNet.core.getUserId();
      var networkId = window.eventNet.core.getSelectedNetwork();
      var userLocation = window.eventNet.core.getLocation();

      if (content.length == 0) {
        return;
      }

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
    },

    createComment = function(postId, commentContent, commentList) {
      var networkId = window.eventNet.core.getSelectedNetwork();
      var userLocation = window.eventNet.core.getLocation();
      var userId = window.eventNet.core.getUserId();

      if (commentContent.length == 0) {
        return;
      }

      var url = "api/v1/networks/" + networkId + "/posts/" + postId + "/comments";

      //Minus one to account for load more button
      var numberOfCommentsLoaded = commentList.childNodes.length - 1;

      window.eventNet.xhr.load({
        method: "POST",
        url: url,
        payload: {
          userId: userId,
          commentContent: commentContent,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        callBacks: {
          load: function(response) {
            //Pass undefined to load remainder of comments
            loadComments(postId, commentList, undefined, numberOfCommentsLoaded);
          },
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
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

    renderMeta = function(parent, data) {
      var container = window.eventNet.util.append(parent, "div", [META_CLASS]);

      var userIconContainer = window.eventNet.util.append(container, "div", [USER_ICON_CLASS]);
      var image = window.eventNet.util.append(userIconContainer, "img");
      if (data.userIcon == "undefined") {
        data.userIcon = "/res/icons/default_user.svg";
      }
      image.src = data.userIcon;

      var infoContainer = window.eventNet.util.append(container, "div", [INFO_CLASS]);

      var userName = window.eventNet.util.append(infoContainer, "h3");
      userName.innerHTML = data.userName;

      // var timeInner = "<time datetime=" + data.timestamp + "></time>";

      var meta = window.eventNet.util.append(infoContainer, "p");

      var timeInfo = window.eventNet.util.append(meta, "time");
      timeInfo.setAttribute("datetime", data.timestamp);

      var distanceInfo = window.eventNet.util.append(meta, "span");
      distanceInfo.setAttribute("data-latitude", data.latitude);
      distanceInfo.setAttribute("data-longitude", data.longitude);
    },

    renderComment = function(parent, data) {
      var comment = document.createElement("li");
      comment.classList.add(COMMENT_CLASS);
      parent.insertBefore(comment, parent.lastChild);

      renderMeta(comment, data);

      var commentContainer = window.eventNet.util.append(comment, "div", [CONTENT_CLASS]);
      var content = window.eventNet.util.append(commentContainer, "p");
      content.innerHTML = data.content;
    },

    renderComments = function(commentList, response) {
      response = JSON.parse(response.target.responseText).data;
      if (response.length == 0) {
        return;
      }
      window.eventNet.ui.show(commentList);

      for (var i in response) {
        var d = response[i];
        var data = {
          userName: d.user_display_name,
          userIcon: d.user_icon,
          timestamp: d.comment_timestamp,
          postId: d.post_id,
          commentId: d.comment_id,
          content: d.comment_content,
          numberOfComments: d.number_of_comments
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

      var networkId = window.eventNet.core.getSelectedNetwork();

      var url = "api/v1/networks/" + networkId + "/posts/" + postId +
        "/comments?offset=" + offset;

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

      renderMeta(post, data);

      //Content
      var content = window.eventNet.util.append(post, "div", [CONTENT_CLASS]);
      var text = window.eventNet.util.append(content, "p");
      text.innerHTML = data.content;

      //Comments
      var comments = window.eventNet.util.append(post, "ul", [COMMENTS_CLASS]);
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
      if (response.length == 0) {
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
          numberOfComments: d.number_of_comments
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

    setUserIcon = function() {
      var icon = document.getElementById(USER_ICON_ID);
      icon.src = window.eventNet.core.getUserImage();
    },

    setUp = function() {
      loadPosts(true);
      setUserIcon();
      document.getElementById(POST_BUTTON_ID).addEventListener("click", createPost);
      //document.addEventListener("click", toggleNewPostSection);
      //document.getElementById("new-post-post-button").addEventListener("click", createPost);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.feed.setUp);
