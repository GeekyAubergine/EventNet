window.eventNet = window.eventNet || {};
window.eventNet.xhr = (function() {
  "use strict";

  var
    encodePayload = function(data) {
      var payload = "";
      for (var i in data) {
        if (data.hasOwnProperty(i)) {
          payload += i + "=" + encodeURIComponent(data[i]) + "&";
        }
      }
      payload = payload.replace("%20", "+");
      payload = payload.replace("%3D", "=");
      payload = payload.slice(0, -1); //Removes extra & from end
      return payload;
    },

    load = function(data) {
      var xhr = new XMLHttpRequest();
      var formData;

      //Default to GET
      if (!data.method) {
        data.method = "GET";
      }

      xhr.open(data.method, data.url, true);
      xhr.setRequestHeader("Accept", "application/json");

      //If POST of PUT adds the data to the request in the form of FormData
      if (data.method === "POST" || data.method === "PUT") {
        //Check if formdata exists
        if (data.formData) {
          formData = data.formData;
        } else {
          formData = new FormData();
        }
        //Add payload to formdata
        if (data.payload) {
          for (var i in data.payload) {
            if (data.payload.hasOwnProperty(i)) {
              formData.append(i, data.payload[i]);
            }
          }
        }
      }

      //If no error callback it is automatically added
      var hasErrorCallback = false;
      for (var i in data.callBacks) {
        if (data.callBacks.hasOwnProperty(i)) {
          if (i == "error") {
            hasErrorCallback = true;
          }
          xhr.addEventListener(i, data.callBacks[i]);
        }
      }
      if (!hasErrorCallback) {
        xhr.addEventListener("error", function(r) {
          window.eventNet.core.log("Error with XHR.\nResponse: " + r);
        });
      }
      xhr.send(formData);
    };

  return {
    "load": load
  }

}());
