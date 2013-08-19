(function() {
  var CHUNK_SIZE, ChunkedFile, Client, Host, P2PClientConnection, P2PConnection, P2PHostConnection, P2PMember, TIMEOUT, logger,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CHUNK_SIZE = 1048576 * 2;

  TIMEOUT = 6000;

  logger = new Logger('P2P');

  ChunkedFile = (function() {
    function ChunkedFile(f, chunk_size) {
      this.f = f;
      this.chunk_size = chunk_size;
      this.name = this.f.name;
      this.type = !!this.f.type ? this.f.type : 'unknown';
      this.size = this.f.size;
      this.read = 0;
      this.chunks = parseInt(Math.ceil(this.f.size / this.chunk_size));
    }

    ChunkedFile.prototype.slice = function(start, end) {
      return this.f.slice(start, end);
    };

    ChunkedFile.prototype.getChunk = function(num) {
      return this.slice(num * CHUNK_SIZE, (num + 1) * CHUNK_SIZE);
    };

    ChunkedFile.prototype.end = function() {
      return this.read === this.chunks;
    };

    return ChunkedFile;

  })();

  P2PMember = (function(_super) {
    __extends(P2PMember, _super);

    function P2PMember() {
      var _this = this;
      FileStorage.onready = function() {
        return _this.trigger('storageReady');
      };
      P2PMember.__super__.constructor.apply(this, arguments);
    }

    P2PMember.prototype.__trigger__ = P2PMember.prototype.trigger;

    P2PMember.prototype.trigger = function(e) {
      logger.log("Triggered " + e + "!");
      return this.__trigger__.apply(this, arguments);
    };

    return P2PMember;

  })(EventEmitter);

  /*
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    HOST              |                 PEER
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  0 INITIALIZING
  1 SENDING OFFER     |        WAITING OFFER
  2 WAITING ANSWER    |       RECEIVED OFFER
  3 RECEIVED ANSWER   |       SENDING ANSWER 
  4 OPENED CHANNEL    |       OPENED CHANNEL
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  */


  P2PConnection = (function(_super) {
    __extends(P2PConnection, _super);

    SignalingChannel.on('client#answer', function(d) {
      return SignalingChannel.trigger("client[" + d.client + "]#answer", d);
    });

    SignalingChannel.on('client#icecandidate', function(d) {
      return SignalingChannel.trigger("client[" + d.client + "]#icecandidate", d.candidate);
    });

    function P2PConnection(channel_name) {
      this.channel_name = channel_name;
      P2PConnection.__super__.constructor.apply(this, arguments);
      this.peer = null;
      this.channel = null;
      this.status = 0;
    }

    P2PConnection.prototype.setChannelEvents = function(channel) {
      var _this = this;
      if (!this.channel && channel) {
        this.channel = channel;
      }
      this.channel.onopen = function() {
        return _this.changeStatus(4) && _this.trigger('channelOpen');
      };
      this.channel.onmessage = function() {
        return _this.trigger('channelMessage');
      };
      this.channel.onclose = function() {
        return _this.trigger('channelClose');
      };
      return this.channel.onerror = function() {
        return _this.trigger('channelError');
      };
    };

    P2PConnection.prototype.changeStatus = function(s, d) {
      this.status = s;
      return this.trigger("statusChange#" + s, d);
    };

    P2PConnection.prototype.send = function(d) {
      if (this.channel && this.status === 4) {
        return this.channel.send(d);
      }
    };

    P2PConnection.prototype.__trigger__ = P2PConnection.prototype.trigger;

    P2PConnection.prototype.trigger = function(e) {
      logger.log("Triggered " + e + "!");
      return this.__trigger__.apply(this, arguments);
    };

    return P2PConnection;

  })(EventEmitter);

  P2PClientConnection = (function(_super) {
    __extends(P2PClientConnection, _super);

    function P2PClientConnection(channel_name) {
      this.channel_name = channel_name;
      P2PClientConnection.__super__.constructor.apply(this, arguments);
      this.peer = WebRTCImplementation.createPeer();
      this.channel = WebRTCImplementation.createChannel(this.peer, this.channel_name);
      this.setChannelEvents();
      this.setPeerEvents();
      this.sendOffer();
      this.prepareForAnswer();
      this.prepareForIceCandidate();
    }

    P2PClientConnection.prototype.sendOffer = function() {
      var _this = this;
      if (this.peer) {
        return WebRTCImplementation.createOffer(this.peer, function(o) {
          SignalingChannel.send('host#offer', {
            client: _this.channel_name,
            offer: o
          });
          return _this.changeStatus(1, o);
        });
      }
    };

    P2PClientConnection.prototype.setPeerEvents = function(peer) {
      var _this = this;
      if (this.peer) {
        return this.peer.onicecandidate = function(c) {
          return SignalingChannel.send('host#icecandidate', {
            client: _this.channel_name,
            candidate: c
          });
        };
      }
    };

    P2PClientConnection.prototype.prepareForAnswer = function() {
      var _this = this;
      if (this.peer) {
        return SignalingChannel.once("client[" + this.channel_name + "]#answer", function(d) {
          return _this.receivedAnswer(d.answer);
        });
      }
    };

    P2PClientConnection.prototype.prepareForIceCandidate = function() {
      var _this = this;
      if (this.peer) {
        return SignalingChannel.on("client[" + this.channel_name + "]#icecandidate", function(d) {
          if (d.candidate) {
            return WebRTCImplementation.addIceCandidate(_this.peer, d.candidate);
          }
        });
      }
    };

    P2PClientConnection.prototype.receivedAnswer = function(answer) {
      if (this.peer) {
        WebRTCImplementation.handleAnswer(this.peer, answer);
        return this.changeStatus(3);
      }
    };

    return P2PClientConnection;

  })(P2PConnection);

  P2PHostConnection = (function(_super) {
    __extends(P2PHostConnection, _super);

    function P2PHostConnection(channel_name) {
      var _this = this;
      this.channel_name = channel_name;
      P2PHostConnection.__super__.constructor.apply(this, arguments);
      SignalingChannel.on('open', function() {
        _this.changeStatus(1);
        return SignalingChannel.send('client#id', _this.channel_name);
      });
      SignalingChannel.once('host#offer', function(offer) {
        return _this.receivedOffer(offer) && _this.changeStatus(2);
      });
    }

    P2PHostConnection.prototype.sendAnswer = function() {
      var _this = this;
      return WebRTCImplementation.createAnswer(this.peer, function(answer) {
        SignalingChannel.send('client#answer', {
          client: _this.channel_name,
          answer: answer
        });
        return _this.changeStatus(3);
      });
    };

    P2PHostConnection.prototype.setPeerEvents = function(peer) {
      var _this = this;
      if (this.peer) {
        return this.peer.onicecandidate = function(c) {
          return SignalingChannel.send('client#icecandidate', {
            client: _this.channel_name,
            candidate: c
          });
        };
      }
    };

    P2PHostConnection.prototype.prepareForIceCandidate = function() {
      var _this = this;
      if (this.peer) {
        return SignalingChannel.on('host#icecandidate', function(d) {
          if (d.candidate) {
            return WebRTCImplementation.addIceCandidate(_this.peer, d.candidate);
          }
        });
      }
    };

    P2PHostConnection.prototype.receivedOffer = function(offer) {
      var _this = this;
      this.peer = WebRTCImplementation.handleOffer(offer, function(channel) {
        return _this.setChannelEvents(channel);
      });
      this.setPeerEvents();
      this.prepareForIceCandidate();
      this.changeStatus(2);
      return this.sendAnswer();
    };

    return P2PHostConnection;

  })(P2PConnection);

  Host = (function(_super) {
    __extends(Host, _super);

    function Host() {
      var _this = this;
      this.clients = {};
      this.reader = new FileReader();
      this.readChunk = function(start, end) {
        return this.reader.readAsArrayBuffer(this.file.slice(start, end));
      };
      this.reader.onloadend = function(event) {
        var token;
        _this.file.read++;
        _this.trigger('readProgress', _this.file.read, _this.file.chunks);
        if (_this.file.end()) {
          token = Token.generate();
          SignalingChannel.join(token);
          _this.__set_event_handlers__();
          _this.trigger('channelJoin', token);
          return _this.trigger('fileEnd', _this.file, token);
        } else {
          return _this.readChunk(_this.file.read * CHUNK_SIZE, CHUNK_SIZE * (_this.file.read + 1));
        }
      };
      Host.__super__.constructor.apply(this, arguments);
    }

    Host.prototype.host = function(file) {
      this.file = new ChunkedFile(file, CHUNK_SIZE);
      this.readChunk(0, CHUNK_SIZE);
      return this.file;
    };

    Host.prototype.__set_event_handlers__ = function() {
      var _this = this;
      this.on('channelJoin', function(token) {
        return SignalingChannel.send('host#id', token);
      });
      return SignalingChannel.on('client#new', function(c) {
        return _this.clients[c] = new P2PClientConnection(c);
      });
    };

    return Host;

  })(P2PMember);

  Client = (function(_super) {
    __extends(Client, _super);

    function Client() {
      this.id = Token.generate();
      this.chunks_remaining = [];
      this.chunks_downloaded = [];
      this.chunks_active = [];
      Client.__super__.constructor.apply(this, arguments);
    }

    Client.prototype.connect = function(token) {
      this.connection = new P2PHostConnection(this.id);
      return this.__set_event_handlers__(token);
    };

    Client.prototype.__set_event_handlers__ = function(token) {
      var _this = this;
      this.connection.once('statusChange#1', function() {
        return SignalingChannel.join(token);
      });
      this.connection.once('statusChange#4', function() {
        return logger.log('Channel Open!');
      });
      return this.connection.once('channelMessage', function(msg) {
        return logger.log("Received payload: " + msg);
      });
    };

    return Client;

  })(P2PMember);

  window.Host = Host;

  window.Client = Client;

}).call(this);
