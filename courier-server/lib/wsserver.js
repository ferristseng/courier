var events    = require('events'),
    util      = require('util'),
    ws        = require('ws'),
    WSServer  = ws.Server,
    Options   = require('options'),
    logger    = require('./logger');

function Room (name) {

  var clients = [],
      name    = name,
      self    = this;

  this.add = function (socket) {  
    clients.push(socket);  
    socket.join(self, function () {
      self.remove(socket);  
    });
  }

  this.emit = function (e, value, callback) {
    for (var u in clients) {
      clients[u].send(e, value, callback);
    }
  }

  this.remove = function (socket) {
    var index = clients.indexOf(socket);
    if (index != -1) {
      clients.splice(index, 1);
    }
  }

  this.clients  = clients;
  this.name     = name;
  this.size     = function () {
    return clients.length;
  };

}

function WebSocketServer (options) {

  options = new Options({
    'port': 8000  
  }).merge(options);

  var server  = new WSServer(options.value),
      rooms   = {},
      self    = this;

  server.on('connection', function (ws) {
    self.emit('connection', ws);
    ws.on('message', function (message) {
      json = JSON.parse(message);
      self.emit('message', message);
      self.emit(json.type, json.data, ws);
    });
  });

  self.on('join', function (data, ws) {
    if (!(data in rooms)) {
      rooms[data] = new Room(data);
    }
    rooms[data].add(ws);
    ws.on('close', function () {
      self.emit('disconnect', this);
      if (this.room.size() === 0) delete rooms[this.room.name];
    });
  });

  this.room = function (name) {
    if (name in rooms) return rooms[name];
    logger.warn('Room %s does not exist!', name);
  }

  this.close = function () {
    server._closeServer();
    self.emit('close', this);
  }

  this.rooms = rooms;
  this._server = server;

}

util.inherits(WebSocketServer, events.EventEmitter);

ws.prototype.join = function (room, handleleave) {
  this.room = room;
  if (!handleleave) throw new Error('Must define a way to handle closed WebSocket connections if Socket leaves.');
  this.on('close', handleleave);
}

ws.prototype.broadcast = function (e, message, callback) {
  if (this.room) {
    for (var u in this.room.clients) {
      var user = this.room.clients[u];
      if (user != this) user.send(e, message, callback);
    }
  }
}

ws.prototype._send = ws.prototype.send;

ws.prototype.send = function (e, message, callback) {
  this._send(JSON.stringify({ 'type': e, 'data': message }), callback);
}

module.exports = WebSocketServer;
