const path = require('node:path')
const fs = require('node:fs')
const http = require('node:http')
const express = require('express')
const { Server } = require('socket.io')

const PORT = Number(process.env.PORT || 3001)
const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})

const rooms = new Map()
const accents = ['lime', 'coral', 'blue', 'lavender']

app.use(express.json())
app.get('/health', (_req, res) => res.json({ ok: true, service: 'roundtable-socket', rooms: rooms.size }))
app.get('/api/rooms/:roomCode', (req, res) => {
  const room = rooms.get(req.params.roomCode.toUpperCase())
  res.json({ roomCode: req.params.roomCode.toUpperCase(), participants: room ? [...room.participants.values()] : [], captions: room ? room.captions.slice(-50) : [] })
})

function getRoom(roomCode) {
  const normalized = roomCode.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20) || 'OPEN'
  if (!rooms.has(normalized)) rooms.set(normalized, { participants: new Map(), captions: [] })
  return { code: normalized, room: rooms.get(normalized) }
}

function broadcastParticipants(roomCode) {
  const room = rooms.get(roomCode)
  if (!room) return
  io.to(roomCode).emit('participants:update', [...room.participants.values()])
}

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomCode, name }) => {
    const next = getRoom(roomCode)
    if (socket.data.roomCode) {
      socket.leave(socket.data.roomCode)
      const previous = rooms.get(socket.data.roomCode)
      previous?.participants.delete(socket.id)
      broadcastParticipants(socket.data.roomCode)
    }

    const participant = {
      id: socket.id,
      name: String(name || 'Guest').trim().slice(0, 40) || 'Guest',
      role: 'Live participant',
      initials: String(name || 'G').trim().slice(0, 2).toUpperCase(),
      accent: accents[next.room.participants.size % accents.length],
      mic: 'on',
      state: 'listening',
    }
    socket.data.roomCode = next.code
    socket.data.participantId = socket.id
    socket.join(next.code)
    next.room.participants.set(socket.id, participant)
    socket.emit('room:state', { roomCode: next.code, participants: [...next.room.participants.values()], captions: next.room.captions.slice(-50) })
    socket.to(next.code).emit('participant:joined', participant)
    broadcastParticipants(next.code)
  })

  socket.on('caption:send', (caption) => {
    const roomCode = socket.data.roomCode
    const room = rooms.get(roomCode)
    if (!room || !caption || typeof caption.text !== 'string') return
    const safeCaption = { ...caption, id: caption.id || `${socket.id}-${Date.now()}`, timestamp: caption.timestamp || Date.now(), status: caption.status || 'confirmed' }
    room.captions.push(safeCaption)
    room.captions = room.captions.slice(-100)
    io.to(roomCode).emit('caption:new', safeCaption)
  })

  socket.on('participant:mute', ({ muted }) => {
    const roomCode = socket.data.roomCode
    const room = rooms.get(roomCode)
    const participant = room?.participants.get(socket.id)
    if (!participant) return
    participant.mic = muted ? 'muted' : 'on'
    broadcastParticipants(roomCode)
  })

  socket.on('participant:speaking', ({ speaking }) => {
    const roomCode = socket.data.roomCode
    const room = rooms.get(roomCode)
    const participant = room?.participants.get(socket.id)
    if (!participant) return
    participant.state = speaking ? 'speaking' : 'listening'
    broadcastParticipants(roomCode)
  })

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode
    const room = rooms.get(roomCode)
    if (!room) return
    room.participants.delete(socket.id)
    broadcastParticipants(roomCode)
    if (!room.participants.size && !room.captions.length) rooms.delete(roomCode)
  })
})

const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/.*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Roundtable Socket.io server listening on ${PORT}`)
})
