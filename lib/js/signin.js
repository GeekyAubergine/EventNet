window.eventNet = window.eventNet || {};
window.eventNet.signin = (function() {
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

    createAccountForFacebook = function() {
      var facebookId = 0;
      var userDisplayName = "";
      var userIcon = "";
      FB.api("/me", function(response) {
        userDisplayName = response.name;
        facebookId = parseInt(response.id);
      });
      FB.api("/me/picture", function(response) {
        userIcon = response.data.url;
      });

      var loop = setInterval(function() {
        if (userDisplayName != "" && userIcon != "") {
          clearInterval(loop);
          window.eventNet.xhr.load({
            method: "POST",
            url: "api/v1/users",
            payload: {
              facebookId: facebookId,
              displayName: userDisplayName,
              icon: userIcon
            },
            callBacks: {
              load: function(e) {
                accountExsistsForFacebookId(facebookId);
              },
              error: function(e) {
                console.log("Error");
                console.log(e);
              }
            }
          });
        }
      }, 10);
    },

    accountExsistsForFacebookId = function(facebookId) {
      var url = "api/v1/users/?facebookId=" + facebookId;
      window.eventNet.xhr.load({
        method: "GET",
        url: url,
        callBacks: {
          load: function(response) {
            response = JSON.parse(response.target.responseText).data;
            console.log(response);
            //If account doesn't exist
            if (response.length == 0) {
              createAccountForFacebook();
            } else {
              document.dispatchEvent(new CustomEvent("userInfomationUpdated", {
                detail: {
                  userId: response[0].user_id,
                  userIcon: response[0].user_icon
                }
              }));
            }
          },
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
    },

    loginWithFacebook = function() {
      FB.login(function(response) {
        var facebookId = response.authResponse.userID;
        accountExsistsForFacebookId(facebookId);
      }, {
        scope: 'public_profile,email'
      });
    },

    createAccountForGoogle = function(googleUser) {
      var userIcon  = googleUser.getImageUrl();
      if (userIcon == "undefined") {
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
          load: function(e) {
            accountExsistsForGoogleUser(googleUser);
          },
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
    },

    accountExsistsForGoogleUser = function(googleUser) {
      var url = "api/v1/users/?googleId=" + googleUser.getId();
      window.eventNet.xhr.load({
        method: "GET",
        url: url,
        callBacks: {
          load: function(response) {
            response = JSON.parse(response.target.responseText).data;
            console.log(response);
            //If account doesn't exist
            if (response.length == 0) {
              createAccountForGoogle(googleUser);
            } else {
              document.dispatchEvent(new CustomEvent("userInfomationUpdated", {
                detail: {
                  userId: response[0].user_id,
                  userIcon: response[0].user_icon
                }
              }));
            }
          },
          error: function(e) {
            console.log("Error");
            console.log(e);
          }
        }
      });
    },

    attachGoogleSignin = function(element) {
      auth2.attachClickHandler(element, {},
        function(googleUser) {
          accountExsistsForGoogleUser(googleUser.getBasicProfile());
        },
        function(error) {
          alert(JSON.stringify(error, undefined, 2));
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

    userLoggedIn = function() {
      return window.eventNet.core.getUserId() > 1;
    },

    setUp = function() {
      document.getElementById("fb-login-button").addEventListener("click", loginWithFacebook);
      initGoogleAuth();
      initFacebookAuth();
      console.log(window.eventNet.core.getUserId());
    };

  return {
    "setUp": setUp
  }
}());

window.addEventListener("load", window.eventNet.signin.setUp);
