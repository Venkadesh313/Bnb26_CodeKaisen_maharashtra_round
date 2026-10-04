import type { Socket } from 'socket.io-client'
import type { Caption, Participant } from './types'
import type { WebRtcSignal } from './webrtc'

export type RoomState = {
  roomCode: string
  hostId: string | null
  participants: Participant[]
  captions: Caption[]
}

export type RoomEvents = {
  'room:state': (state: RoomState) => void
  'participants:update': (participants: Participant[]) => void
  'participant:joined': (participant: Participant) => void
  'caption:new': (caption: Caption) => void
  'meeting:ended': (payload: { endedBy: string }) => void
  'webrtc:peers': (participants: Participant[]) => void
  'webrtc:signal': (payload: { from: string; signal: WebRtcSignal }) => void
  'webrtc:peer-left': (payload: { peerId: string }) => void
}

export type RoomEmitEvents = {
  'join-room': (payload: { roomCode: string; name: string }) => void
  'leave-room': () => void
  'end-meeting': () => void
  'caption:send': (caption: Caption) => void
  'participant:mute': (payload: { muted: boolean }) => void
  'participant:video': (payload: { video: boolean }) => void
  'participant:speaking': (payload: { speaking: boolean }) => void
  'participant:hand': (payload: { raised: boolean }) => void
  'webrtc:signal': (payload: { to: string; signal: WebRtcSignal }) => void
}

export type RoomSocket = Socket<RoomEvents, RoomEmitEvents>
