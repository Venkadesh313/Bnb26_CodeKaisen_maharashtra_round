export type CaptionStatus = 'live' | 'confirmed'

export type Participant = {
  id: string
  name: string
  role: string
  initials: string
  accent: 'lime' | 'coral' | 'blue' | 'lavender'
  mic: 'on' | 'muted'
  state: 'speaking' | 'listening' | 'joining'
}

export type Caption = {
  id: string
  speakerId: string
  speakerName: string
  text: string
  timestamp: number
  status: CaptionStatus
  confidence: number
  isCorrection?: boolean
}

export type AudioState = {
  micReady: boolean
  micMuted: boolean
  connection: 'connected' | 'reconnecting'
  latency: number
  packetLoss: number
  source: 'demo' | 'microphone'
}
