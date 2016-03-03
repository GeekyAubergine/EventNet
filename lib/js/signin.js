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

    setUp = function() {
      initGoogleAuth();
    };

  return {
    "setUp": setUp
  }
}());

window.addEventListener("load", window.eventNet.signin.setUp);
