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

server.on('join', (room, ws) ->
  if not ws.room.courierClients
    ws.room.courierClients = {}
  logger.log("a user joined #{room}"))

# User disconnects

server.on('disconnect', (ws) ->
  logger.log("a user left: #{ws.room.name}"))

# Courier Events
# ~~~~~~~~~~~~~~

# Client joins

server.on('client#id', (data, ws) ->
  ws.room.courierClients[data] = ws
  if ws.room.host
    ws.room.host.send('client#new', data)
  logger.log("new client: (#{data}, #{ws.room.name})"))

# Client disconnects

server.on('client#close', (data, ws) ->
  delete ws.room.courierClients[data]
  logger.log("closing client: (#{data}, #{ws.room.name})"))

# Host joins

server.on('host#id', (data, ws) ->
  if ws.room.name == data
    ws.room.host = ws
    logger.log("new host: (#{data}, #{ws.room.name})"))

# Host sends offer

server.on('host#offer', (data, ws) ->
  if data.client in ws.room.courierClients
    ws.room.courierClients[data.client].send('host#offer', data.offer)
  logger.log("new host offer: #{data.client}"))

# WebRTC Events
# ~~~~~~~~~~~~~

server.on('offer', (data, ws) ->
  logger.log("offer: #{data}")
  ws.broadcast('offer', data))

server.on('answer', (data, ws) ->
  logger.log("answer: #{data}")
  ws.broadcast('answer', data))

server.on('icecandidate', (data, ws) ->
  logger.log("icecandidate: #{data}")
  ws.broadcast('icecandidate', data))

module.exports = server


