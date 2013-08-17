(function() {
  var ChromeRTCImplementation, FirefoxRTCImplementation, WebRTCImplementation, emptyFunction, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  emptyFunction = function() {};

  WebRTCImplementation = (function() {
    WebRTCImplementation.handleSession = function(peer, session, callback) {
      peer.setLocalDescription(session);
      return callback(session);
    };

    function WebRTCImplementation() {
      this.servers = {
        iceServers: [
          {
            url: 'stun:stun.l.google.com:19302'
          }
        ]
      };
      this.onicecandidate = null;
    }

    WebRTCImplementation.prototype.createPeer = function() {};

    WebRTCImplementation.prototype.createChannel = function() {};

    WebRTCImplementation.prototype.createOffer = function() {};

    WebRTCImplementation.prototype.handleOffer = function() {};

    WebRTCImplementation.prototype.createAnswer = function() {};

    WebRTCImplementation.prototype.handleAnswer = function() {};

    WebRTCImplementation.prototype.addIceCandidate = function() {};

    return WebRTCImplementation;

  })();

  FirefoxRTCImplementation = (function(_super) {
    __extends(FirefoxRTCImplementation, _super);

    function FirefoxRTCImplementation() {
      _ref = FirefoxRTCImplementation.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    FirefoxRTCImplementation.mediaConstraints = {
      optional: [],
      mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
      }
    };

    FirefoxRTCImplementation.prototype.createPeer = function() {
      return new mozRTCPeerConnection(this.servers);
    };

    FirefoxRTCImplementation.prototype.createChannel = function(peer, channel, options) {
      return peer.createDataChannel(channel, options);
    };

    FirefoxRTCImplementation.prototype.createOffer = function(peer, callback) {
      var success;
      success = function(stream) {
        var offerCallback;
        offerCallback = function(session) {
          return WebRTCImplementation.handleSession(peer, session, callback);
        };
        return peer.createOffer(offerCallback, null, FirefoxRTCImplementation.mediaConstraints);
      };
      return navigator.mozGetUserMedia({
        audio: true,
        fake: true
      }, success, emptyFunction);
    };

    FirefoxRTCImplementation.prototype.handleOffer = function(offer, callback) {
      var peer;
      peer = createPeer();
      peer.ondatachannel = function(e) {
        return peer.channel = e.channel;
      };
      return peer;
    };

    FirefoxRTCImplementation.prototype.createAnswer = function(peer, callback) {
      var success;
      success = function(stream) {
        var offerCallback;
        offerCallback = function(session) {
          return WebRTCImplementation.handleSession(peer, session, callback);
        };
        return peer.createAnswer(offerCallback, null, FirefoxRTCImplementation.mediaConstraints);
      };
      return navigator.mozGetUserMedia({
        audio: true,
        fake: true
      }, success, emptyFunction);
    };

    FirefoxRTCImplementation.prototype.handleAnswer = function(peer, answer) {
      return peer.setRemoteDescription(new mozRTCSessionDescription());
    };

    FirefoxRTCImplementation.prototype.addIceCandidate = function(peer, candidate) {
      return peer.addIceCandidate(new mozRTCIceCandidate(candidate));
    };

    return FirefoxRTCImplementation;

  })(WebRTCImplementation);

  ChromeRTCImplementation = (function(_super) {
    __extends(ChromeRTCImplementation, _super);

    function ChromeRTCImplementation() {
      _ref1 = ChromeRTCImplementation.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    ChromeRTCImplementation.config = {
      optional: [
        {
          RtpDataChannels: true
        }
      ]
    };

    ChromeRTCImplementation.mediaConstraints = {
      optional: [],
      mandatory: {
        OfferToReceiveAudio: false,
        OfferToReceiveVideo: false
      }
    };

    ChromeRTCImplementation.prototype.createPeer = function() {
      var peer;
      peer = new webkitRTCPeerConnection(this.servers, ChromeRTCImplementation.config);
      peer.onicecandidate = this.onicecandidate;
      return peer;
    };

    ChromeRTCImplementation.prototype.createChannel = function(peer, channel, options) {
      if (!options) {
        options = {
          reliable: false
        };
      }
      return peer.createDataChannel(channel, options);
    };

    ChromeRTCImplementation.prototype.createOffer = function(peer, callback) {
      callback = function(session) {
        return WebRTCImplementation.handleSession(peer, session, callback);
      };
      return peer.createOffer(callback, null, ChromeRTCImplementation.mediaConstraints);
    };

    ChromeRTCImplementation.prototype.handleOffer = function(offer) {
      var peer;
      peer = this.createPeer();
      return peer;
    };

    ChromeRTCImplementation.prototype.createAnswer = function(peer, callback) {
      callback = function(session) {
        return WebRTCImplementation.handleSession(peer, session, callback);
      };
      return peer.createAnswer(callback, null, ChromeRTCImplementation.mediaConstraints);
    };

    ChromeRTCImplementation.prototype.handleAnswer = function(peer, answer) {
      return peer.setRemoteDescription(new RTCSessionDescription(answer));
    };

    ChromeRTCImplementation.prototype.addIceCandidate = function(peer, candidate) {
      return peer.addIceCandidate(new RTCIceCandidate(candidate));
    };

    return ChromeRTCImplementation;

  })(WebRTCImplementation);

  if (isChrome) {
    window.WebRTCImplementation = new ChromeRTCImplementation();
  } else if (isFirefox) {
    window.WebRTCImplementation = new FirefoxRTCImplementation();
  } else {
    window.WebRTCImplementation = void 0;
  }

}).call(this);
