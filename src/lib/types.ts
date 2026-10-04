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

// SpeechRecognition Types
export interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechRecognitionAlternative
}

export interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message?: string
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

export interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}
