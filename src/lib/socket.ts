import type { Socket } from 'socket.io-client'
import type { Caption, Participant } from './types'

export type RoomState = {
  roomCode: string
  participants: Participant[]
  captions: Caption[]
}

export type RoomEvents = {
  'room:state': (state: RoomState) => void
  'participants:update': (participants: Participant[]) => void
  'participant:joined': (participant: Participant) => void
  'caption:new': (caption: Caption) => void
}

export type RoomEmitEvents = {
  'join-room': (payload: { roomCode: string; name: string }) => void
  'caption:send': (caption: Caption) => void
  'participant:mute': (payload: { muted: boolean }) => void
  'participant:speaking': (payload: { speaking: boolean }) => void
}

export type RoomSocket = Socket<RoomEvents, RoomEmitEvents>
