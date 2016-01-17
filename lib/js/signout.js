window.eventNet = window.eventNet || {};
window.eventNet.signout = (function() {
  var

    loggedInWithFacebook = false,

    initFacebookAuth = function() {
      FB.init({
        appId: '1142571789087495',
        xfbml: true,
        version: 'v2.5'
      });
      updateFacebookLoginStatus();
    },

    updateFacebookLoginStatus = function() {
      FB.getLoginStatus(function(response) {
        loggedInWithFacebook = response.status == "connected";
        document.dispatchEvent(new CustomEvent("facebook-login-status-updated"));
      });
    },

    logoutOfFacebook = function() {
      FB.logout(function(response) {
        console.log(response);
        document.dispatchEvent(new CustomEvent("userInfomationUpdated", {
          detail: {
            userId: undefined,
            userIcon: undefined
          }
        }));
      });
    },

    setUp = function() {
      document.getElementById("fb-logout-button").addEventListener("click", logoutOfFacebook);
      initFacebookAuth();
    };

  return {
    "setUp": setUp
  }
}());

window.addEventListener("load", window.eventNet.signout.setUp);
