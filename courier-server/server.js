//
// Websocket implementation of the WebRTC
// signaling channel to coordinate the exchange 
// of RTCOffers and RTCAnswers
//

var WebSocketServer = require('./lib/wsserver')
  , logger = require('./lib/logger');

var server = new WebSocketServer();

// ==========================================
// Generic Events 
// ==========================================

server.on('join', function (room, ws) {
  logger.log('a user joined: %s', room);
  ws.broadcast('new user', 'a new user joined!');
});

server.on('disconnect', function (ws) {
  logger.log('a user left: %s', ws.room.name);
});

// ==========================================
// Courier Service Events 
// ==========================================

server.on('clientId', function (data, ws) {
  logger.log('new client: %s', data)
});

// ==========================================
// WebRTC Events
// ==========================================

server.on('offer', function (data, ws) {
  logger.log('offer: %s', data);
  ws.broadcast('offer', data);
});

server.on('answer', function (data, ws) {
  logger.log('answer: %s', data);
  ws.broadcast('answer', data);
});

server.on('icecandidate', function (data, ws) {
  logger.log('icecandidate: %s', data);
  ws.broadcast('icecandidate', data);
});

module.exports = server;


