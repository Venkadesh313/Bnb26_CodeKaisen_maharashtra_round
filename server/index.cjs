const path = require('node:path')
const fs = require('node:fs')
const http = require('node:http')
const express = require('express')
const { Server } = require('socket.io')

const PORT = Number(process.env.PORT || 3001)
const app = express()
const httpServer = http.createServer(app)
const corsOrigins = String(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean)
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || !corsOrigins.length || corsOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('Origin is not allowed by CORS'))
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

const rooms = new Map()
const accents = ['lime', 'coral', 'blue', 'lavender']

app.use(express.json())
app.get('/health', (_req, res) => res.json({ ok: true, service: 'roundtable-socket', rooms: rooms.size }))
app.get('/api/rooms/:roomCode', (req, res) => {
  const room = rooms.get(req.params.roomCode.toUpperCase())
  res.json({ roomCode: req.params.roomCode.toUpperCase(), hostId: room?.hostId || null, participants: room ? [...room.participants.values()] : [], captions: room ? room.captions.slice(-50) : [] })
})

function getRoom(roomCode) {
  const normalized = String(roomCode || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20) || 'OPEN'
  if (!rooms.has(normalized)) rooms.set(normalized, { hostId: null, participants: new Map(), captions: [] })
  return { code: normalized, room: rooms.get(normalized) }
}

function updateHostMetadata(room) {
  if (!room) return
  room.participants.forEach((participant) => {
    const isHost = participant.id === room.hostId
    participant.isHost = isHost
    participant.role = isHost ? 'Host · meeting owner' : 'Guest · live participant'
  })
}

function broadcastParticipants(roomCode) {
  const room = rooms.get(roomCode)
  if (room) {
    updateHostMetadata(room)
    io.to(roomCode).emit('participants:update', [...room.participants.values()])
  }
}

function removeSocketFromRoom(socket, { announce = true } = {}) {
  const roomCode = socket.data.roomCode
  if (!roomCode) return
  const room = rooms.get(roomCode)
  socket.leave(roomCode)
  socket.data.roomCode = undefined
  if (!room) return
  room.participants.delete(socket.id)
  if (room.hostId === socket.id) {
    room.hostId = room.participants.keys().next().value || null
  }
  if (announce) {
    io.to(roomCode).emit('webrtc:peer-left', { peerId: socket.id })
    broadcastParticipants(roomCode)
  }
  if (!room.participants.size && !room.captions.length) rooms.delete(roomCode)
}

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomCode, name }) => {
    const previousRoomCode = socket.data.roomCode
    const previousRoom = previousRoomCode ? rooms.get(previousRoomCode) : null
    const wasHost = Boolean(previousRoom && previousRoom.hostId === socket.id)
    if (socket.data.roomCode) removeSocketFromRoom(socket)
    const next = getRoom(roomCode)
    const existingPeers = [...next.room.participants.values()]
    if (wasHost && previousRoomCode === next.code) next.room.hostId = socket.id
    if (!next.room.hostId) next.room.hostId = socket.id

    const safeName = String(name || 'Guest').trim().slice(0, 40) || 'Guest'
    const isHost = next.room.hostId === socket.id
    const participant = {
      id: socket.id,
      name: safeName,
      role: isHost ? 'Host · meeting owner' : 'Guest · live participant',
      initials: safeName.slice(0, 2).toUpperCase(),
      accent: accents[next.room.participants.size % accents.length],
      mic: 'on',
      video: 'off',
      handRaised: false,
      state: 'listening',
      isHost,
    }
    socket.data.roomCode = next.code
    socket.join(next.code)
    next.room.participants.set(socket.id, participant)
    updateHostMetadata(next.room)
    socket.emit('room:state', { roomCode: next.code, hostId: next.room.hostId, participants: [...next.room.participants.values()], captions: next.room.captions.slice(-50) })
    socket.emit('webrtc:peers', existingPeers)
    socket.to(next.code).emit('participant:joined', participant)
    broadcastParticipants(next.code)
  })

  socket.on('leave-room', () => removeSocketFromRoom(socket))

  socket.on('end-meeting', () => {
    const roomCode = socket.data.roomCode
    const room = rooms.get(roomCode)
    if (!room || room.hostId !== socket.id) return
    io.to(roomCode).emit('meeting:ended', { endedBy: socket.id })
    rooms.delete(roomCode)
  })

  socket.on('webrtc:signal', ({ to, signal }) => {
    if (!socket.data.roomCode || typeof to !== 'string' || !signal?.type) return
    const target = io.sockets.sockets.get(to)
    if (!target || target.data.roomCode !== socket.data.roomCode) return
    target.emit('webrtc:signal', { from: socket.id, signal })
  })

  socket.on('caption:send', (caption) => {
    const roomCode = socket.data.roomCode
    const room = rooms.get(roomCode)
    if (!room || !caption || typeof caption.text !== 'string') return
    const safeCaption = {
      ...caption,
      text: caption.text.slice(0, 2000),
      speakerId: socket.id,
      id: caption.id || `${socket.id}-${Date.now()}`,
      timestamp: caption.timestamp || Date.now(),
      status: caption.status || 'confirmed',
    }
    room.captions.push(safeCaption)
    room.captions = room.captions.slice(-100)
    io.to(roomCode).emit('caption:new', safeCaption)
  })

  socket.on('participant:mute', ({ muted }) => {
    const room = rooms.get(socket.data.roomCode)
    const participant = room?.participants.get(socket.id)
    if (!participant) return
    participant.mic = muted ? 'muted' : 'on'
    broadcastParticipants(socket.data.roomCode)
  })

  socket.on('participant:video', ({ video }) => {
    const room = rooms.get(socket.data.roomCode)
    const participant = room?.participants.get(socket.id)
    if (!participant) return
    participant.video = video ? 'on' : 'off'
    broadcastParticipants(socket.data.roomCode)
  })

  socket.on('participant:speaking', ({ speaking }) => {
    const room = rooms.get(socket.data.roomCode)
    const participant = room?.participants.get(socket.id)
    if (!participant) return
    participant.state = speaking ? 'speaking' : 'listening'
    broadcastParticipants(socket.data.roomCode)
  })

  socket.on('participant:hand', ({ raised }) => {
    const room = rooms.get(socket.data.roomCode)
    const participant = room?.participants.get(socket.id)
    if (!participant) return
    participant.handRaised = Boolean(raised)
    broadcastParticipants(socket.data.roomCode)
  })

  socket.on('disconnect', () => removeSocketFromRoom(socket))
})

const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/.*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Roundtable Socket.io server listening on ${PORT}`)
})
