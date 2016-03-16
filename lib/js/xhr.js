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
      var payload;

      //Default to GET
      if (!data.method) {
        data.method = "GET";
      }

      xhr.open(data.method, data.url, true);
      xhr.setRequestHeader("Accept", "application/json");

      if (data.method === "POST" || data.method === "PUT") {
        if (data.payload) {
          xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
          payload = encodePayload(data.payload);
        }
        if (data.formData) {
          payload = data.formData;
        }
      }

      for (var i in data.callBacks) {
        if (data.callBacks.hasOwnProperty(i)) {
          xhr.addEventListener(i, data.callBacks[i]);
        }
      }

      xhr.send(payload);
    };

  return {
    "load": load
  }

}());
