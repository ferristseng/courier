(function() {
  var CHUNK_SIZE, ChunkedFile, Client, Host, P2PClientConnection, P2PConnection, P2PHostConnection, P2PMember, TIMEOUT, logger, _ref,
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

    ChunkedFile.prototype.end = function() {
      return this.read === this.chunks;
    };

    return ChunkedFile;

  })();

  P2PMember = (function(_super) {
    __extends(P2PMember, _super);

    function P2PMember() {
      var self;
      self = this;
      FileStorage.onready = function() {
        return self.trigger('storageReady');
      };
      P2PMember.__super__.constructor.apply(this, arguments);
    }

    return P2PMember;

  })(EventEmitter);

  /*
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    HOST              |                 PEER
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  0 INITIALIZING
  1 SENDING OFFER     |        WAITING OFFER
  2 WAITING ANSWER    |          SENT ANSWER
  3 RECEIVED ANSWER   |       
  4 OPENED CHANNEL    |       OPENED CHANNEL
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  */


  P2PConnection = (function(_super) {
    __extends(P2PConnection, _super);

    function P2PConnection() {
      this.peer = null;
      this.channel = null;
      this.status = 0;
      P2PConnection.__super__.constructor.apply(this, arguments);
    }

    P2PConnection.prototype.changeStatus = function(s) {
      this.status = s;
      return this.trigger('statusChange', s);
    };

    return P2PConnection;

  })(EventEmitter);

  P2PClientConnection = (function(_super) {
    __extends(P2PClientConnection, _super);

    function P2PClientConnection() {
      _ref = P2PClientConnection.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    P2PClientConnection.prototype.start = function() {
      this.peer = WebRTCImplementation.createPeer();
      this.channel = WebRTCImplementation.createChannel(this.peer);
      WebRTCImplementation.createAnswer(this.peer, function(o) {
        return SignalingChannel.send(o);
      });
      return this.changeStatus(1);
    };

    return P2PClientConnection;

  })(P2PConnection);

  P2PHostConnection = (function(_super) {
    __extends(P2PHostConnection, _super);

    function P2PHostConnection(token, id) {
      this.token = token;
      this.id = id;
      P2PHostConnection.__super__.constructor.apply(this, arguments);
      SignalingChannel.on('open', function() {
        this.join(token);
        return this.send('clientId', id);
      });
      this.changeStatus(1);
    }

    P2PHostConnection.prototype.start = function(offer) {
      this.peer = WebRTCImplementation.handleOffer(offer);
      WebRTCImplementation.createAnswer(this.peer, function(a) {
        return SignalingChannel.send(a);
      });
      return this.changeStatus(2);
    };

    return P2PHostConnection;

  })(P2PConnection);

  Host = (function(_super) {
    __extends(Host, _super);

    function Host() {
      var self;
      self = this;
      this.clients = [];
      this.reader = new FileReader();
      this.readChunk = function(start, end) {
        return this.reader.readAsArrayBuffer(this.file.slice(start, end));
      };
      this.reader.onloadend = function(event) {
        var token;
        self.file.read++;
        self.trigger('readProgress', self.file.read, self.file.chunks);
        if (self.file.end()) {
          token = Token.generate();
          SignalingChannel.join(token);
          self.trigger('channelJoin', token);
          return self.trigger('fileEnd', self.file, token);
        } else {
          return self.readChunk(self.file.read * CHUNK_SIZE, CHUNK_SIZE * (self.file.read + 1));
        }
      };
      Host.__super__.constructor.apply(this, arguments);
    }

    Host.prototype.host = function(file) {
      this.file = new ChunkedFile(file, CHUNK_SIZE);
      this.readChunk(0, CHUNK_SIZE);
      return this.file;
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
      return this.host = new P2PHostConnection(token, this.id);
    };

    return Client;

  })(P2PMember);

  window.Host = Host;

  window.Client = Client;

}).call(this);