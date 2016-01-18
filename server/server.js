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

io.on('connection', function(client) {
  log('Client connected from: ' + client.handshake.address);
  client.on('disconnect', function() {
    log('Client disconnected from: ' + client.handshake.address);
  });
});
