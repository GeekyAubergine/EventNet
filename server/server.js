log("EventNet Server starting");

var
  webPort = 8081,
  io = require("socket.io").listen(webPort);

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
  emit("newPost", data);
}

function onUserCommented(data) {
  log("User commented");
  emit("newComment", data);
}

function onUserMessage(data) {
  log("User messaged");
  emit("newMessage", data);
}

io.on('connection', function(client) {
  log('Client connected from: ' + client.handshake.address);

  client.on("userPosted", onUserPosted);
  client.on("userCommented", onUserCommented);
  client.on("userMessaged", onUserMessage);

  client.on('disconnect', function() {
    log('Client disconnected from: ' + client.handshake.address);
  });
});
