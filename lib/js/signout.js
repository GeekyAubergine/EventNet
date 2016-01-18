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

    logOutOfGoogle = function() {
      var auth2 = gapi.auth2.getAuthInstance();
      auth2.signOut().then(function() {
        console.log('User signed out.');
      });
    },

    initGoogleAuth = function() {
      gapi.load('auth2', function() {
        // Retrieve the singleton for the GoogleAuth library and set up the client.
        auth2 = gapi.auth2.init({
          client_id: '742741150395-03gn9452camd85skn1rr310s8gnnulvr.apps.googleusercontent.com',
          cookiepolicy: 'single_host_origin',
          scope: 'profile'
        });
      });
    },

    setUp = function() {
      document.getElementById("fb-logout-button").addEventListener("click", logoutOfFacebook);
      document.getElementById("google-logout-button").addEventListener("click", logOutOfGoogle);
      initFacebookAuth();
      initGoogleAuth();
    };

  return {
    "setUp": setUp
  }
}());

window.addEventListener("load", window.eventNet.signout.setUp);
