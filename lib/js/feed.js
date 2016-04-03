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
    EDITABLE_AREA_CONTAINER_CLASS = "editable-area-container",

    DEFAULT_NUMBER_OF_COMMENTS_TO_LOAD = 0,
    COMMENTS_TO_LOAD_PER_LOAD_MORE_CALL = 5,

    postsNewestDate,
    postsOldestDate,
    filesToUpload = [],

    getCommentsListForPostId = function(postId) {
      return document.getElementById(COMMENTS_ID_PREFIX + postId);
    },

    postFilesChanged = function(event) {
      filesToUpload = this.files;
    },

    createPost = function(event) {
      event.preventDefault();
      var textArea = document.getElementById(POST_TEXTAREA_ID);
      var content = textArea.value;
      var eventId = window.eventNet.core.getSelectedEvent();
      var userLocation = window.eventNet.core.getLocation();

      if (content.length == 0) {
        return;
      }

      var formData = new FormData();
      for (var i = 0; i < filesToUpload.length; i++) {
        formData.append("files[]", filesToUpload[i]);
      }
      formData.append("eventId", eventId);
      formData.append("accessToken", window.eventNet.core.getAccessToken());
      formData.append("postContent", content);
      formData.append("latitude", userLocation.latitude);
      formData.append("longitude", userLocation.longitude);

      window.eventNet.xhr.load({
        method: "POST",
        url: "api/v1/posts",
        formData: formData,
        callBacks: {
          load: function() {
            window.eventNet.core.emitToSocket("userPosted");
          },
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });

      textArea.value = "";
    },

    createComment = function(postId, commentContent, commentsList) {
      var eventId = window.eventNet.core.getSelectedEvent();
      var userLocation = window.eventNet.core.getLocation();

      if (commentContent.length == 0) {
        return;
      }

      var url = "api/v1/comments";

      //Minus one to account for load more button
      var numberOfCommentsLoaded = commentsList.childNodes.length - 1;

      window.eventNet.xhr.load({
        method: "POST",
        url: url,
        payload: {
          postId: postId,
          accessToken: window.eventNet.core.getAccessToken(),
          commentContent: commentContent,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
        callBacks: {
          load: function(e) {
            window.eventNet.core.emitToSocket("userCommented", {
              postId: postId
            });
            loadComments(postId, commentsList, 10000);
          },
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });

      window.eventNet.ui.show(commentsList);
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

    reportPost = function(parent, postId) {
      window.eventNet.xhr.load({
        method: "POST",
        url: "/api/v1/reports",
        payload: {
          accessToken: window.eventNet.core.getAccessToken(),
          postId: postId
        },
        callBacks: {
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
      window.eventNet.ui.hide(parent);
    },

    reportComment = function(parent, commentId) {
      window.eventNet.xhr.load({
        method: "POST",
        url: "/api/v1/reports",
        payload: {
          accessToken: window.eventNet.core.getAccessToken(),
          commentId: commentId
        },
        callBacks: {
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
      window.eventNet.ui.hide(parent);
    },

    swapContent = function(parent, updatedContent) {
      var container = parent.getElementsByClassName(CONTENT_CLASS)[0];

      var con = document.createElement("p");
      container.insertBefore(con, container.childNodes[1]);
      con.innerHTML = updatedContent;

      window.eventNet.ui.hide(parent.getElementsByClassName(EDITABLE_AREA_CONTAINER_CLASS)[0]);
    },

    editPost = function(parent, data, content) {
      var url = "/api/v1/posts/" + data.postId;
      url += "?postContent=" + content;

      window.eventNet.xhr.load({
        method: "PUT",
        url: url,
        callBacks: {
          load: function(e) {
            swapContent(parent, content);
          },
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
    },

    editComment= function(parent, data, content) {
      var url = "/api/v1/comments/" + data.commentId;
      url += "?commentContent=" + content;

      window.eventNet.xhr.load({
        method: "PUT",
        url: url,
        callBacks: {
          load: function(e) {
            swapContent(parent, content);
          },
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
    },

    deletePost = function(parent, postId) {
      window.eventNet.xhr.load({
        method: "DELETE",
        url: "/api/v1/posts/" + postId,
        callBacks: {
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
      window.eventNet.ui.hide(parent);
    },

    deleteComment = function(parent, commentId) {
      window.eventNet.xhr.load({
        method: "DELETE",
        url: "/api/v1/comments/" + commentId,
        callBacks: {
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
      window.eventNet.ui.hide(parent);
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

      if (!data.commentId) {
        //Meida Container
        var mediaContainer = window.eventNet.util.append(container, "div", ["media-container"]);
        loadMediaItems(mediaContainer, data.postId);
      }

      var editableContainer = window.eventNet.util.append(container, "div", [EDITABLE_AREA_CONTAINER_CLASS]);

      var editable = window.eventNet.util.append(editableContainer, "textarea");

      var c = window.eventNet.util.append(editableContainer, "div", ["container"]);
      var editButton = window.eventNet.util.append(c, "button", ["button"]);
      editButton.innerHTML = "Done";

      editButton.addEventListener("click", function(e) {
        if (!data.commentId) {
          editPost(parent, data, editable.value);
        } else {
          editComment(parent, data, editable.value);
        }
      });

      window.eventNet.ui.hide(editableContainer);
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

      if (data.canEdit === "true" && !window.eventNet.core.isAnonymousUser()) {
        var edit = window.eventNet.util.append(container, "li", ["clickable"]);
        edit.innerHTML = "Edit";

        edit.addEventListener("click", function(e) {
          var content = parent.getElementsByClassName(CONTENT_CLASS)[0];
          var editableContainer = parent.getElementsByClassName(EDITABLE_AREA_CONTAINER_CLASS)[0];
          window.eventNet.ui.show(editableContainer);

          var area = editableContainer.getElementsByTagName("textarea")[0];

          var paragraphs = content.getElementsByTagName("p");

          for (var i = 0; i < paragraphs.length; i++) {
            area.value += paragraphs[i].innerHTML;
          }

          for (var i = 0; i < paragraphs.length; i++) {
            content.removeChild(paragraphs[i]);
          }
        });

        var remove = window.eventNet.util.append(container, "li", ["clickable"]);
        remove.innerHTML = "Delete";

        remove.addEventListener("click", function() {
          if (!data.commentId) {
            deletePost(parent, data.postId);
          } else {
            deleteComment(parent, data.commentId);
          }
        });
      } else if (!window.eventNet.core.isAnonymousUser()) {
        var report = window.eventNet.util.append(container, "li", ["clickable"]);
        report.innerHTML = "Report";
        report.addEventListener("click", function() {
          if (!data.commentId) {
            reportPost(parent, data.postId);
          } else {
            reportComment(parent, data.commentId);
          }
        });
      }
    },

    renderMediaItem = function(parent, src) {
      var imageRegex = /\.(png|jpg|jpeg|gif)$/i;
      var videoRegex = /\.(ogg|mp4|webm)$/i;
      if (src.match(imageRegex)) {
        var container = window.eventNet.util.append(parent, "div", ["media-img-container"]);

        var image = window.eventNet.util.append(container, "img");
        image.src = src;
      } else if (src.match(videoRegex)) {
        var container = window.eventNet.util.append(parent, "div", ["media-video-container"]);

        var video = window.eventNet.util.append(container, "video");
        video.innerHTML = "Video is not supported by your browser";
        video.setAttribute("controls", "");

        var videoSource = window.eventNet.util.append(video, "source");
        videoSource.src = src;
        var extension = src.match(videoRegex)[0].substring(1);
        videoSource.type = "video/" + extension;
      } else {
        console.log("Not supported media type: ", src);
      }
    },

    renderMediaItems = function(parent, response) {
      response = JSON.parse(response.target.responseText).data;
      if (response.length == 0) {
        return;
      }

      for (var i in response) {
        renderMediaItem(parent, response[i].media_name);
      }
    },

    loadMediaItems = function(post, postId) {
      window.eventNet.xhr.load({
        url: "api/v1/media?postId=" + postId,
        callBacks: {
          load: function(response) {
            renderMediaItems(post, response);
          },
          error: function(e) {
            console.log("Error loading posts");
            console.log(e);
          }
        }
      });
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
          longitude: d.comment_longitude,
          canEdit: d.commented_by_user
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

      var url = "api/v1/comments?postId=" + postId + "&accessToken=" + window.eventNet.core.getAccessToken() + "&offset=" + offset;

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

      for (var i = 0; i < response.length; i++) {
        var d = response[i];
        var data = {
          userName: d.user_display_name,
          userIcon: d.user_icon,
          timestamp: d.post_timestamp,
          postId: d.post_id,
          content: d.post_content,
          numberOfComments: d.number_of_comments,
          latitude: d.post_latitude,
          longitude: d.post_longitude,
          canEdit: d.posted_by_user
        };

        var timeStamp = window.eventNet.util.fixDateFormat(data.timestamp);
        //Update newest post time
        if (postsNewestDate == undefined || postsOldestDate == undefined) {
          postsNewestDate = postsOldestDate = timeStamp;
          renderPost(postList, data, false);
        } else if (Date.parse(postsOldestDate) < Date.parse(timeStamp)) {
          postsOldestDate = timeStamp;
          renderPost(postList, data, false);
        }
        //Update oldest post time
        else {
          postsNewestDate = data.timestamp;
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

      var url = "api/v1/posts?eventId=" + eventId + "&limit=10&accessToken=" + window.eventNet.core.getAccessToken();

      if (postsNewestDate != undefined && postsOldestDate != undefined) {
        if (loadNew) {
          url += "&after=" + postsNewestDate;
        } else {
          url += "&before=" + postsOldestDate;
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
    },

    setUp = function() {
      loadPosts(true);
      setUserIcon();
      addSocketListeners();
      document.getElementById(POST_BUTTON_ID).addEventListener("click", createPost);
      document.getElementById("post-creator-post-file-input").addEventListener("change", postFilesChanged);
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.feed.setUp);
