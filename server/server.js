console.log("EventNet Server starting");

var
  webPort = 8081,
  app = require("http").createServer(serverHandler),
  io = require("socket.io").listen(app);

function serverHandler(request, response) {
}

io.sockets.on('connection', function(client) {
  log('Client connected from: ' + client.handshake.address);
  client.on('disconnect', function() {
    serverStats.clients -= 1;
    log('Client disconnected from: ' + client.handshake.address);
  });
});
