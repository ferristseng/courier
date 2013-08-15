(function() {
  var PrivateChannel, SignalingChannel, WebsocketChannel, logger, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  logger = new Logger('SignalingChannel');

  SignalingChannel = (function(_super) {
    __extends(SignalingChannel, _super);

    function SignalingChannel() {
      SignalingChannel.__super__.constructor.apply(this, arguments);
    }

    SignalingChannel.prototype.join = function() {};

    SignalingChannel.prototype.send = function() {};

    return SignalingChannel;

  })(EventEmitter);

  WebsocketChannel = (function(_super) {
    __extends(WebsocketChannel, _super);

    function WebsocketChannel() {
      var self;
      self = this;
      this.ws = new WebSocket('ws://localhost:8000');
      this.ws.onopen = function() {
        return self.__onopen__();
      };
      this.ws.onmessage = function(e) {
        return self.__onmessage__(e);
      };
      this.ws.onclose = function() {
        return self.__onclose__();
      };
      WebsocketChannel.__super__.constructor.apply(this, arguments);
    }

    WebsocketChannel.prototype.__send__ = function(event, data) {
      logger.log("Sending [event] " + event + "!");
      return this.ws.send(JSON.stringify({
        type: event,
        data: data
      }));
    };

    WebsocketChannel.prototype.__onopen__ = function() {
      return this.trigger('open');
    };

    WebsocketChannel.prototype.__onmessage__ = function(event) {
      var e;
      e = JSON.parse(event.data);
      logger.log("Received [event] " + e.type + "!");
      this.trigger('message', e);
      return this.trigger(e.type, e.data);
    };

    WebsocketChannel.prototype.__onclose__ = function() {
      return this.trigger('close');
    };

    WebsocketChannel.prototype.join = function(room) {
      return this.__send__('join', room);
    };

    WebsocketChannel.prototype.send = function(event, data) {
      return this.__send__(event, data);
    };

    return WebsocketChannel;

  })(SignalingChannel);

  PrivateChannel = (function(_super) {
    __extends(PrivateChannel, _super);

    function PrivateChannel() {
      _ref = PrivateChannel.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return PrivateChannel;

  })(SignalingChannel);

  window.SignalingChannel = new WebsocketChannel();

}).call(this);
