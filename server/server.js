log("EventNet Server starting");

var
  webPort = 8081,
  server = require("http").createServer(serverHandler).listen(webPort),
  io = require("socket.io").listen(server);

function log(string) {
  console.log("NodeJS: " + string);
}

function serverHandler(request, response) {
  response.writeHead(401, {
    'Content-Type': 'text/html'
  });
  response.end();
}

function emit(messageHeader, messageBody) {
  io.emit(messageHeader, messageBody);
}

function onUserPosted(data) {
  log("User posted");
  emit("newPost");
}

function onUserCommented(data) {
  log("User commented");
  emit("newComment", data);
}

io.on('connection', function(client) {
  log('Client connected from: ' + client.handshake.address);

  client.on("userPosted", onUserPosted);
  client.on("userCommented", onUserCommented);

  client.on('disconnect', function() {
    log('Client disconnected from: ' + client.handshake.address);
  });
});
