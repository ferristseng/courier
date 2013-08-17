Signaling Channel
-----------------

A signaling channel is an abstraction of the channel used to communicate between
peers before the P2P connection is made. It is used to exchange a WebRTC offer and
answer.

    logger = new Logger('SignalingChannel')

    class SignalingChannel extends EventEmitter
      
      constructor: () ->
        super

These should be exist, but do not have to be implemented.

      join: () ->
      send: () ->

Rewrite the trigger method to use the logger

      __trigger__: SignalingChannel.prototype.trigger

      trigger: (e) ->
        logger.log("Triggered #{e}!")
        @__trigger__(e)

WebsocketChannel
================

Signaling channel implemented with Websockets.

    class WebsocketChannel extends SignalingChannel
    
      constructor: () ->
        @ws = new WebSocket('ws://localhost:8000')
        @ws.onopen = () => @__onopen__()
        @ws.onmessage = (e) => @__onmessage__(e)
        @ws.onclose = () => @__onclose__()
        super
   
      __send__: (event, data, callback) ->
        logger.log("Sending [event] #{event}!")
        @ws.send(JSON.stringify({ type: event, data: data}), callback)

      __onopen__: () ->
        @trigger('open')

      __onmessage__: (event) ->
        e = JSON.parse(event.data)
        logger.log("Received [event] #{e.type}!")
        @trigger('message', e)
        @trigger(e.type, e.data)

      __onclose__: () ->
        @trigger('close')

      join: (room) ->
        @__send__('join', room)

      send: (event, data, callback) ->
        @__send__(event, data, callback)

PrivateChannel
===============

Signaling channel implemented without the use of a 'connected' medium. The data 
is distributed through a private method that is not determined by the application (this could be with instant messaging, email...etc).

    class PrivateChannel extends SignalingChannel

*Set WebsocketChannel as the global signaling channel*

    window.SignalingChannel = new WebsocketChannel()
