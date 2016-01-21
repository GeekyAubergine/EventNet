window.eventNet = window.eventNet || {};
window.eventNet.chat = (function() {
  "use strict";
  var
    MESSAGE_CREATOR_TEXTAREA_ID = "message-creator-textarea",
    MESSAGES_ID = "messages",
    MESSAGE_CLASS = "message",
    META_CLASS = "meta",
    USER_ICON_CLASS = "user-icon",
    USER_ICON_ID = "user-icon",
    INFO_CLASS = "info",
    CONTENT_CLASS = "content",

    createMessage = function(content) {
      var textArea = document.getElementById(MESSAGE_CREATOR_TEXTAREA_ID);
      var userId = window.eventNet.core.getUserId();
      var networkId = window.eventNet.core.getSelectedNetwork();
      var userLocation = window.eventNet.core.getLocation();

      if (content.length == 0) {
        return;
      }

      window.eventNet.xhr.load({
        method: "POST",
        url: "api/v1/messages",
        payload: {
          networkId: networkId,
          userId: userId,
          messageContent: content,
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

      window.eventNet.core.emitToSocket("userMessaged", {
        networkId: window.eventNet.core.getSelectedNetwork()
      });
    },

    typedInCommentCreator = function(event, textArea) {
      var typedLetter = event.keyIdentifier;
      var content = textArea.value;
      if (typedLetter == "Enter") {
        event.preventDefault();
        textArea.value = "";
        createMessage(content);
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

    renderMessage = function(parent, data) {
      var message;

      message = document.createElement("article");
      parent.insertBefore(message, parent.lastChild);
      message.classList.add(MESSAGE_CLASS);

      renderMeta(message, data);

      //Content
      var content = window.eventNet.util.append(message, "div", [CONTENT_CLASS]);
      var text = window.eventNet.util.append(content, "p");
      text.innerHTML = data.content;
    },

    renderMessages = function(response) {
      response = JSON.parse(response.target.responseText).data;
      if (response == null || response.length == 0) {
        return;
      }

      var messageList = document.getElementById(MESSAGES_ID);

      for (var i in response.reverse()) {
        var d = response[i];
        var data = {
          userName: d.user_display_name,
          userIcon: d.user_icon,
          timestamp: d.message_timestamp,
          messageId: d.message_id,
          content: d.message_content
        };

        renderMessage(messageList, data);
      }

      window.scrollTo(0,document.body.scrollHeight);
      document.dispatchEvent(new CustomEvent("contentUpdated"));
    },

    loadMessages = function(numberToLoad) {
      var networkId = window.eventNet.core.getSelectedNetwork();

      var url = "api/v1/messages?networkId=" + networkId + "&limit=" + numberToLoad;

      window.eventNet.xhr.load({
        url: url,
        callBacks: {
          load: renderMessages,
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
      window.eventNet.core.addSocketListener("newMessage", function(data) {
        if (data.networkId == window.eventNet.core.getSelectedNetwork()) {
          loadMessages(1);
        }
      });
    },

    setUp = function() {
      loadMessages(5);
      setUserIcon();
      addSocketListeners();
      document.getElementById(MESSAGE_CREATOR_TEXTAREA_ID).addEventListener("keypress", function(event) {
        typedInCommentCreator(event, event.target);
      });
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.chat.setUp);