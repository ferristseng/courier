
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
        self = @
        FileStorage.onready = () -> self.trigger('storageReady')
        super

P2PConnection
-------------

Any P2P connections established through WebRTC.

A P2P connection undergoes a number of statuses:

The statuses differ based on the vantage point of the user

Events

  * statusChange

    ###
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      HOST              |                 PEER
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    0 INITIALIZING
    1 SENDING OFFER     |        WAITING OFFER
    2 WAITING ANSWER    |          SENT ANSWER
    3 RECEIVED ANSWER   |       
    4 OPENED CHANNEL    |       OPENED CHANNEL
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    ###

    class P2PConnection extends EventEmitter
  
      constructor: () ->
        @peer = null
        @channel = null
        @status = 0
        super

      changeStatus: (s) ->
        @status = s
        @trigger('statusChange', s)

Used to create a new connection to send data to

    class P2PClientConnection extends P2PConnection

      start: () ->
        @peer = WebRTCImplementation.createPeer()
        @channel = WebRTCImplementation.createChannel(@peer)
        WebRTCImplementation.createAnswer(@peer, (o) -> SignalingChannel.send(o))
        @changeStatus(1)

Used to create a new connection to receive data from

    class P2PHostConnection extends P2PConnection

      constructor: (@token, @id) ->
        super
        SignalingChannel.on('open', () ->
          @join(token)
          @send('clientId', id))
        @changeStatus(1)

      start: (offer) ->
        @peer = WebRTCImplementation.handleOffer(offer)
        WebRTCImplementation.createAnswer(@peer, (a) -> SignalingChannel.send(a))
        @changeStatus(2)

Host
====

Events:

  * channelJoin
  * fileEnd

    class Host extends P2PMember

      constructor: () ->
        self = @
        @clients = []
        @reader = new FileReader()
        @readChunk = (start, end) -> @reader.readAsArrayBuffer(@file.slice(start, end))
        @reader.onloadend = (event) ->
          self.file.read++
          self.trigger('readProgress', self.file.read, self.file.chunks)
          if self.file.end()
            token = Token.generate()
            SignalingChannel.join(token)
            self.trigger('channelJoin', token)
            self.trigger('fileEnd', self.file, token)
          else
            #FileStorage.storeChunk(event.target.result, self.file.read - 1, self.file.name, self.file.type)
            self.readChunk(self.file.read * CHUNK_SIZE, CHUNK_SIZE * (self.file.read + 1))
        super

Read in the file as a bunch of chunks. Store the chunks in local storage. The way the chunks are stored is determined by the storage method.

      host: (file) ->
        @file = new ChunkedFile(file, CHUNK_SIZE)
        @readChunk(0, CHUNK_SIZE)
        @file

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
        @host = new P2PHostConnection(token, @id)
      
    window.Host = Host
    window.Client = Client