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

    /* ---- Message creation ---- */

    createMessage = function(content) {
      var textArea = document.getElementById(MESSAGE_CREATOR_TEXTAREA_ID);
      var eventId = window.eventNet.core.getSelectedEvent();
      var userLocation = window.eventNet.core.getLocation();

      if (content.length == 0) {
        return;
      }

      window.eventNet.xhr.load({
        method: "POST",
        url: "api/v1/messages",
        payload: {
          accessToken: window.eventNet.core.getAccessToken(),
          eventId: eventId,
          messageContent: content,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        },
      });

      textArea.value = "";

      window.eventNet.core.emitToSocket("userMessaged", {
        eventId: window.eventNet.core.getSelectedEvent()
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

    /* ---- Rendering ---- */

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
    },

    renderMessage = function(parent, data) {
      var message;

      message = document.createElement("article");
      parent.insertBefore(message, parent.lastsChild);
      message.classList.add(MESSAGE_CLASS);

      renderHead(message, data);
      renderMeta(message, data);
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
          content: d.message_content,
          latitude: d.message_latitude,
          longitude: d.message_longitude
        };

        renderMessage(messageList, data);
      }

      setTimeout(function() {
        window.scrollTo(0, document.body.scrollHeight)
      }, 0);

      document.dispatchEvent(new CustomEvent("contentUpdated"));
    },

    /* ---- Message loading ---- */

    loadMessages = function(numberToLoad) {
      var eventId = window.eventNet.core.getSelectedEvent();

      if (eventId == undefined) {
        return;
      }

      var url = "api/v1/messages?eventId=" + eventId + "&accessToken=" + window.eventNet.core.getAccessToken() + "&limit=" + numberToLoad;

      window.eventNet.xhr.load({
        url: url,
        callBacks: {
          load: renderMessages
        }
      });
    },

    //Shows archieved notice or message creator depending on whether or not the event is archieved
    showNotifcationOrMessageCreator = function() {
      window.eventNet.core.isEventArchived(function(archived) {
        if (archived) {
          window.eventNet.ui.show(document.getElementById("archived-notification"));
        } else {
          window.eventNet.ui.show(document.getElementById("message-creator"));
        }
      });
    },

    //Resises the message creator as screen risizes
    resizeMessageCreator = function() {
      var creator = document.getElementById("message-creator");
      var width = creator.parentElement.offsetWidth;
      creator.style.left = "calc(50% - " + (width / 2) + "px)";
      creator.style.width = width + "px";
    },

    //Sets the user icon
    setUserIcon = function() {
      var icon = document.getElementById(USER_ICON_ID);
      icon.src = window.eventNet.core.getUserImage();
    },

    addSocketListeners = function() {
      window.eventNet.core.addSocketListener("newMessage", function(data) {
        if (data.eventId == window.eventNet.core.getSelectedEvent()) {
          loadMessages(1);
        }
      });
    },

    setUp = function() {
      resizeMessageCreator();
      setUserIcon();
      addSocketListeners();
      showNotifcationOrMessageCreator();
      loadMessages(25);
      window.addEventListener("resize", resizeMessageCreator);
      document.getElementById(MESSAGE_CREATOR_TEXTAREA_ID).addEventListener("keypress", function(event) {
        typedInCommentCreator(event, event.target);
      });
    };

  return {
    "setUp": setUp
  };
}());

window.addEventListener("load", window.eventNet.chat.setUp);
