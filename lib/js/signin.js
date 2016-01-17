window.eventNet = window.eventNet || {};
window.eventNet.signin = (function() {
  var

    showLoggedInMessage = function(data) {
      console.log(data);
    },

    creatAccountWithFacebook = function() {
      var userId = 0;
      var userDisplayName = "";
      var userIcon = "";
      FB.api("/me", function(response) {
        userDisplayName = response.name;
        userId = parseInt(response.id);
      });
      FB.api("/me/picture", function(response) {
        userIcon = response.data.url;
      });

      var loop = setInterval(function() {
        if (userDisplayName != "" && userIcon != "") {
          createAccount({
            displayName: userDisplayName,
            userIcon: userIcon,
            userId: userId
          });
          clearInterval(loop);
        }
      }, 10);
    },

    loginWithFacebook = function() {
      FB.login(function(response) {
        if (!response.error) {
          creatAccountWithFacebook();
        }
      }, {
        scope: 'public_profile,email'
      });
    },

    testLogins = function() {
      if (window.eventNet.user.isLoggedIntoFacebook()) {
        window.eventNet.ui.toggleDivVisibility(document.getElementById("signed-in"));
      } else {
        window.eventNet.ui.toggleDivVisibility(document.getElementById("sign-in"));
      }
    },

    setUp = function() {
      document.getElementById("fb-login-button").addEventListener("click", loginWithFacebook);
      document.addEventListener("fb-inited", testLogins);
    };

  return {
    "setUp": setUp
  }
}());

function onSignIn(googleUser) {
  var profile = googleUser.getBasicProfile();
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail());
}


window.addEventListener("load", window.eventNet.signin.setUp);
