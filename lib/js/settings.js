window.eventNet = window.eventNet || {};
window.eventNet.settings = (function() {
  var

    signOut = function() {
      var data = {
        icon: "res/icons/default_user.svg",
        accessToken: 1,
        renewToken: 1,
        tokenExpire: "9999-12-31T23.59.59"
      };

      document.dispatchEvent(new CustomEvent("userInfomationUpdated", {
        detail: data
      }));
    },

    showLoginMessage = function() {
      window.eventNet.ui.show(document.getElementById("sign-in"));
    },

    showLogoutMessage = function() {
      window.eventNet.ui.show(document.getElementById("signed-in"));
    },

    determineIfLoggedIn = function() {
      if (window.eventNet.core.isUserLoggedIn() && window.eventNet.core.getAccessToken() != "1") {
        showLogoutMessage();
      } else {
        showLoginMessage();
      }
    },

    setUp = function() {
      determineIfLoggedIn();
      document.getElementById("signout-button").addEventListener("click", signOut);
    };

  return {
    "setUp": setUp
  }
}());

window.addEventListener("load", window.eventNet.settings.setUp);
