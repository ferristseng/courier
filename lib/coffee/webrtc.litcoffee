WebRTCImplementation
--------------------

An interface for the browser specific implementations of the WebRTC spec.

*Currently, Firefox and Chrome and not interoperable!*

    class WebRTCImplementation

      @handleSession = (peer, session, callback) ->
        peer.setLocalDescription(session)
        callback(session)

      constructor: () ->
        @servers = {
          iceServers: [
            { url: 'stun:stun.l.google.com:19302' }
          ]
        }
        @onicecandidate = null
 
Create a RTCPeerConnection. Returns the created RTCPeerConnection.

      createPeer:         () ->

Create a DataChannel from a RTCPeerConnection. Returns the create DataChannel, or null if no peer is specified.

      createChannel:      () ->

Creates an offer for another peer given a peer. A callback can be specified after the offer is created (this should probably be a way to send the offer to the other peer).

      createOffer:        () ->

Handles an offer from another peer. Returns a new peer object using the implementation's createPeer() method.

      handleOffer:        () ->

Creates an answer to respond to an offer. Needs a peer object and an can have a callback after the answer is created (probably involving sending the answer to respond the the offer).

      createAnswer:       () ->

Handles an answer from another peer.

      handleAnswer:       () ->

Add an ice candidate

      addIceCandidate:    () ->

FirefoxRTCImplementation
========================

Tested with 22.0

  * A fake video / audio channel needs to be created in order to create the connection

    class FirefoxRTCImplementation extends WebRTCImplementation

      @mediaConstraints:
        optional: [],
        mandatory:
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
        
      createPeer: () ->
        new mozRTCPeerConnection(@servers)

      createChannel: (peer, channel, options) ->
        peer.createDataChannel(channel, options) if peer else null

      createOffer: (peer, callback) ->
        callback = (session) -> WebRTCImplementation.handleSession(peer, session, callback)
        navigator.mozGetUserMedia({
            audio: true,
            fake: true
          },
          (stream) ->
            peer.addStream(stream)
            peer.createOffer(callback, null, FirefoxRTCImplementation.mediaConstraints)
        )

      handleOffer: (offer, callback) ->
        peer = createPeer()
        peer.ondatachannel = (e) -> peer.channel = e.channel
        peer

      createAnswer: (peer, callback) ->
        callback = (session) -> WebRTCImplementation.handleSession(peer, session, callback)
        navigator.mozGetUserMedia({
            audio: true,
            fake: true
          },
          (stream) ->
            peer.addStream(stream)
            peer.createAnswer(callback, null, FirefoxRTCImplementation.mediaConstraints)
        )

      handleAnswer: (peer, answer) ->
        peer.setRemoteDescription(new mozRTCSessionDescription())

      addIceCandidate: (peer, candidate) ->
        peer.addIceCandidate(new mozRTCIceCandidate(candidate))

ChromeRTCImplementation
=======================

Tested with 28.0.1500.71

  * Reliable channel is not yet implemented
  * A flag must be set in config for RtpDataChannels

    class ChromeRTCImplementation extends WebRTCImplementation

      @config:
        optional: [{ RtpDataChannels: true }]

      @mediaConstraints:
        optional: [],
        mandatory:
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: false

      createPeer: () ->
        peer = new webkitRTCPeerConnection(@servers, ChromeRTCImplementation.config)
        peer.onicecandidate = @onicecandidate

      createChannel: (peer, channel, options) ->
        options = { reliable: false } if not options
        peer.createDataChannel(channel, options)

      createOffer: (peer, callback) ->
        callback = (session) -> WebRTCImplementation.handleOffer(peer, session, callback)
        peer.createOffer(callback, null, ChromeRTCImplementation.mediaConstraints)

      handleOffer: (offer) ->
        peer = @createPeer()
        peer

      createAnswer: (peer, callback) ->
        callback = (session) -> WebRTCImplementation.handleOffer(peer, session, callback)
        peer.createAnswer(callback, null, ChromeRTCImplementation.mediaConstraints)

      handleAnswer: (peer, answer) ->
        peer.setRemoteDescription(new RTCSessionDescription(answer))

      addIceCandidate: (peer, candidate) ->
        peer.addIceCandidate(new RTCIceCandidate(candidate))

*An Empty Function that does nothing!*

    emptyFunction: () ->

*Globally set the implementation based on the detected browser.* 

    if isChrome
      window.WebRTCImplementation = new ChromeRTCImplementation()
    else if isFirefox
      window.WebRTCImplementation = new FirefoxRTCImplementation()
    else
      window.WebRTCImplementation = undefined
