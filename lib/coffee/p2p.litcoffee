
    CHUNK_SIZE = 1048576 * 2
    TIMEOUT = 6000

    logger = new Logger('P2P')

ChunkedFile
-----------

Stores information about a file

    class ChunkedFile

      constructor: (@f, @chunk_size) ->
        @name   = @f.name
        @type   = if not not @f.type then @f.type else 'unknown'
        @size   = @f.size
        @read   = 0
        @chunks = parseInt(Math.ceil(@f.size / @chunk_size))

      slice: (start, end) ->
        @f.slice(start, end)

      getChunk: (num) ->
        @slice(num * CHUNK_SIZE, (num + 1) * CHUNK_SIZE)

      end: () ->
        @read is @chunks

P2PMember
---------

An abstraction for a member of a P2P connection.

P2PMember should be either a Host or Client.

Events:

  * storageReady
 
    class P2PMember extends EventEmitter

      constructor: () ->
        FileStorage.onready = () => @trigger('storageReady')
        super
      
Rewrite the trigger method to use a logger

      __trigger__: P2PMember.prototype.trigger

      trigger: (e) ->
        logger.log("Triggered #{e}!")
        @__trigger__(e)

P2PConnection
-------------

Any P2P connections established through WebRTC.

A P2P connection undergoes a number of statuses:

The statuses differ based on the vantage point of the user

These DO have knowledge of the PROTOCOL used on the SignalingChannel!

Events

  * statusChange#[0-4]
  * channelOpen
  * channelMessage
  * channelClose
  * channelError

    ###
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      HOST              |                 PEER
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    0 INITIALIZING
    1 SENDING OFFER     |        WAITING OFFER
    2 WAITING ANSWER    |       RECEIVED OFFER
    3 RECEIVED ANSWER   |       SENDING ANSWER 
    4 OPENED CHANNEL    |       OPENED CHANNEL
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    ###

    class P2PConnection extends EventEmitter

Setup signaling channel to emit event names for specific client ids. DO ONCE!

      constructor: (@channel_name) ->
        super
        @peer = null
        @channel = null
        @status = 0

      setChannelEvents: () ->
        @channel.onopen    = () => @changeStatus(4) && @trigger('channelOpen')
        @channel.onmessage = () => @trigger('channelMessage')
        @channel.onclose   = () => @trigger('channelClose')
        @channel.onerror   = () => @trigger('channelError')

      changeStatus: (s, d) ->
        @status = s
        @trigger("statusChange##{s}", d)

      send: (d) ->
        if @channel && @status == 4
          @channel.send(d)

      __trigger__: P2PConnection.prototype.trigger

      trigger: (e) ->
        logger.log("Triggered #{e}!")
        @__trigger__(e)

Used to create a new connection to send data to

    class P2PClientConnection extends P2PConnection

      constructor: (@channel_name) ->
        super
        @peer     = WebRTCImplementation.createPeer()
        @channel  = WebRTCImplementation.createChannel(@peer, @channel_name)
        @setChannelEvents
        WebRTCImplementation.createOffer(@peer, (o) => @changeStatus(1, o))

      receivedAnswer: (answer) ->
        WebRTCImplementation.handleAnswer(answer)
        @changeStatus(3)

Used to create a new connection to receive data from

    class P2PHostConnection extends P2PConnection

      constructor: (@channel_name) ->
        super
        SignalingChannel.on('open', () =>
          @changeStatus(1)
          SignalingChannel.send('client#id', @channel_name))
        SignalingChannel.once('host#offer', (offer) => @receivedOffer(offer) && @changeStatus(2))

      receivedOffer: (offer) ->
        @peer = WebRTCImplementation.handleOffer(offer)
        WebRTCImplementation.createAnswer(@peer, (answer) => @changeStatus(3, answer))

Host
====

Events:

  * channelJoin
  * fileEnd

    class Host extends P2PMember

      constructor: () ->
        @clients = {}
        @reader = new FileReader()
        @readChunk = (start, end) -> @reader.readAsArrayBuffer(@file.slice(start, end))
        @reader.onloadend = (event) =>
          @file.read++
          @trigger('readProgress', @file.read, @file.chunks)
          if @file.end()
            token = Token.generate()
            SignalingChannel.join(token)
            @__set_event_handlers__()
            @trigger('channelJoin', token)
            @trigger('fileEnd', @file, token)
          else
            #FileStorage.storeChunk(event.target.result, @file.read - 1, @file.name, @file.type)
            @readChunk(@file.read * CHUNK_SIZE, CHUNK_SIZE * (@file.read + 1))
        super

Read in the file as a bunch of chunks. Store the chunks in local storage. The way the chunks are stored is determined by the storage method.

      host: (file) ->
        @file = new ChunkedFile(file, CHUNK_SIZE)
        @readChunk(0, CHUNK_SIZE)
        @file

Set the handling of certain events that are expected to be received by the host

  * channelJoin: When the host joins the channel, send the token of the host to initialize the user as the host on the server.
  * client#new:  When the host is notified of a new client, send that specific client an offer via the SignalingChannel
  * client#answer: When the host is notified that the client has responded, process the answer according to the protocol (done in P2PClientConnection)

      __set_event_handlers__: () ->
        @on('channelJoin', (token) -> SignalingChannel.send('host#id', token))
        SignalingChannel.on('client#new', (c) =>
          @clients[c] = new P2PClientConnection(c)
          @clients[c].on('statusChange#1', (o) -> SignalingChannel.send('host#offer', { client: c, offer: o })))
        SignalingChannel.once('client#answer', (data) => @clients[data.client].receivedAnswer(data.answer))

Handle the client#new event received by the SignalingChannel

Client
======

    class Client extends P2PMember

      constructor: () ->
        @id = Token.generate()
        @chunks_remaining = []
        @chunks_downloaded = []
        @chunks_active = []
        super

      connect: (token) ->
        @connection = new P2PHostConnection(@id)
        @__set_event_handlers__(token)

Set the channel event handlers 

  * open: send the client id to the SignalingChannel to tell the host that the client wishes to communicate with the host
  * statusChange#1: accept the offer
  * statusChange#2: send the answer over the channel

      __set_event_handlers__: (token) ->
        @connection.once('statusChange#1', () => SignalingChannel.join(token))
        @connection.once('statusChange#3', (answer) => SignalingChannel.send('client#answer', { client: @id, answer: answer }))
      
    window.Host = Host
    window.Client = Client
