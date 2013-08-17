#
# Websocket implementation of the WebRTC signaling
# channel for coordinating the exchange of 
# WebRTCOffers and WebRTCAnswers
#

WebsocketServer = require('./lib/wsserver')

server = new WebsocketServer()
logger = require('./lib/logger')

# Generic Events
# ~~~~~~~~~~~~~~

# User joins a room

server.on 'join', (room, ws) ->
  if not ws.room.courierClients?
    ws.room.courierClients = {}
  logger.log("a user joined #{room}")

# User disconnects

server.on 'disconnect', (ws) ->
  logger.log("a user left: #{ws.room.name}")
  if ws.room.clients.length == 0
    logger.log("closing room: #{ws.room.name}")
    delete server.rooms[ws.room.name]

# Courier Events
# ~~~~~~~~~~~~~~

# client#id
#   - Client joins

server.on 'client#id', (data, ws) ->
  ws.room.courierClients[data] = ws
  if ws.room.host
    ws.room.host.send('client#new', data)
  logger.log("new client: (#{data}, #{ws.room.name})")

# client#close
#   - Client disconnects

server.on 'client#close', (data, ws) ->
  delete ws.room.courierClients[data]
  logger.log("closing client: (#{data}, #{ws.room.name})")

# client#answer
#   - Client responds to host offer

server.on 'client#answer', (data, ws) ->
  logger.log("received answer from: (#{data.client}, #{ws.room.name})")
  if ws.room.host
    ws.room.host.send('client#answer', data)

# host#id
#   - Host joins

server.on 'host#id', (data, ws) ->
  if ws.room.name == data
    ws.room.host = ws
    logger.log("new host: (#{data}, #{ws.room.name})")

# host#offer
#   - Host sends offer

server.on 'host#offer', (data, ws) ->
  logger.log("new host offer for: #{data.client}")
  if data.client of ws.room.courierClients
    ws.room.courierClients[data.client].send('host#offer', data.offer)
    logger.log("sent '#{data.client}' offer")

# WebRTC Events
# ~~~~~~~~~~~~~

server.on 'icecandidate', (data, ws) ->
  logger.log("icecandidate: #{data}")
  ws.broadcast('icecandidate', data)

module.exports = server


