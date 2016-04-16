window.eventNet = window.eventNet || {};
window.eventNet.signin = (function() {
  var

    saveUserData = function(data) {
      document.dispatchEvent(new CustomEvent("userInfomationUpdated", {
        detail: data
      }));
    },

    createAccountForGoogle = function(googleUser) {
      var userIcon = googleUser.getImageUrl();
      if (userIcon == undefined) {
        userIcon = "/res/icons/default_user.svg";
      }

      window.eventNet.xhr.load({
        method: "POST",
        url: "api/v1/users",
        payload: {
          googleId: googleUser.getId(),
          displayName: googleUser.getName(),
          icon: googleUser.getImageUrl()
        },
        callBacks: {
          load: function(response) {
            response = JSON.parse(response.target.responseText).data;
            saveUserData({
              icon: userIcon,
              accessToken: response.accessToken,
              renewToken: response.renewToken,
              tokenExpire: response.tokenExpire
            });
            window.location.href ="/settings.html";
          }
        }
      });
    },

    attachGoogleSignin = function(element) {
      auth2.attachClickHandler(element, {},
        function(googleUser) {
          createAccountForGoogle(googleUser.getBasicProfile());
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
        attachGoogleSignin(document.getElementById("google-login-button"));
      });
    },

    setUp = function() {
      initGoogleAuth();
    };

  return {
    "setUp": setUp
  }
}());

window.addEventListener("load", window.eventNet.signin.setUp);
