import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowUpRight, Check, ChevronDown, Clipboard, Command, Info, Layers3, MessageSquareText, Network, Settings2, ShieldCheck, Sparkles, UsersRound, Volume2 } from 'lucide-react'
import { io } from 'socket.io-client'
import { AudioHealthPanel } from './components/AudioHealthPanel'
import { CaptionTimeline } from './components/CaptionTimeline'
import { DemoControls } from './components/DemoControls'
import { ParticipantPanel } from './components/ParticipantPanel'
import { RoomHeader } from './components/RoomHeader'
import { RoundtableMark } from './components/RoundtableMark'
import { requestMicrophone } from './lib/audio'
import { DEMO_SCRIPT, exportTranscript, INITIAL_CAPTIONS } from './lib/captions'
import { PARTICIPANTS, ROOM } from './lib/room'
import type { AudioState, Caption, Participant } from './lib/types'
import type { RoomSocket } from './lib/socket'
import { WebRtcMesh } from './lib/webrtc'

function App() {
  const [captions, setCaptions] = useState<Caption[]>(INITIAL_CAPTIONS)
  const [participants, setParticipants] = useState<Participant[]>(PARTICIPANTS)
  const [isRunning, setIsRunning] = useState(true)
  const [timelineOpen, setTimelineOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'connected' | 'fallback'>('connecting')
  const [rtcStatus, setRtcStatus] = useState<'idle' | 'ready' | 'connecting' | 'connected' | 'error'>('idle')
  const [roomCode, setRoomCode] = useState(ROOM.code)
  const [displayName, setDisplayName] = useState('Maya Chen')
  const [audio, setAudio] = useState<AudioState>({ micReady: false, micMuted: false, connection: 'connected', latency: 180, packetLoss: 0.4, source: 'demo' })
  const socketRef = useRef<RoomSocket | null>(null)
  const meshRef = useRef<WebRtcMesh | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const sessionDuration = useMemo(() => `${String(Math.floor(captions.length * 1.7)).padStart(2, '0')}:42`, [captions.length])

  useEffect(() => {
    const socket = io('/', { autoConnect: false, transports: ['websocket', 'polling'] }) as RoomSocket
    socketRef.current = socket
    const mesh = new WebRtcMesh(socket, { onStatus: setRtcStatus })
    meshRef.current = mesh

    socket.on('connect', () => {
      setBackendStatus('connected')
      setAudio((current) => ({ ...current, connection: 'connected' }))
      socket.emit('join-room', { roomCode, name: displayName })
    })
    socket.on('connect_error', () => {
      setBackendStatus('fallback')
      setAudio((current) => ({ ...current, connection: 'reconnecting' }))
    })
    socket.on('room:state', (state) => {
      setRoomCode(state.roomCode)
      if (state.participants.length) setParticipants(state.participants)
      if (state.captions.length) setCaptions(state.captions)
    })
    socket.on('participants:update', (nextParticipants) => {
      if (nextParticipants.length) setParticipants(nextParticipants)
    })
    socket.on('caption:new', (caption) => {
      setCaptions((current) => current.some((item) => item.id === caption.id) ? current : [...current.slice(-7), caption])
    })
    socket.connect()

    return () => {
      mesh.close()
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      meshRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isRunning) return
    const interval = window.setInterval(() => {
      const next = DEMO_SCRIPT[captions.length % DEMO_SCRIPT.length]
      const captionId = `live-${Date.now()}`
      const draft: Caption = { ...next, id: captionId, timestamp: Date.now(), status: 'live' }
      setCaptions((current) => [...current.slice(-7), draft])
      setParticipants((current) => current.map((person) => ({ ...person, state: person.id === next.speakerId ? 'speaking' : 'listening' })))
      socketRef.current?.emit('caption:send', draft)
      socketRef.current?.emit('participant:speaking', { speaking: true })
      window.setTimeout(() => setCaptions((current) => current.map((caption) => caption.id === captionId ? { ...caption, status: 'confirmed', isCorrection: true } : caption)), 1400)
    }, 5600)
    return () => window.clearInterval(interval)
  }, [isRunning, captions.length])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' && event.target instanceof HTMLElement && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)) {
        event.preventDefault()
        setIsRunning((value) => !value)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const flashToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600) }
  const copyRoom = async () => {
    try { await navigator.clipboard.writeText(roomCode) } catch { /* Clipboard is optional in demo preview. */ }
    setCopied(true)
    flashToast(`Room code ${roomCode} copied`)
    window.setTimeout(() => setCopied(false), 2200)
  }
  const joinRoom = () => {
    const nextName = window.prompt('Your display name', displayName)?.trim()
    if (!nextName) return
    const nextCode = window.prompt('Workspace code', roomCode)?.trim().toUpperCase()
    if (!nextCode) return
    setDisplayName(nextName)
    setRoomCode(nextCode)
    socketRef.current?.emit('join-room', { roomCode: nextCode, name: nextName })
    flashToast(`Joined shared room ${nextCode}`)
  }
  const checkMic = async () => {
    const result = await requestMicrophone()
    if (result.stream) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = result.stream
      result.stream.getAudioTracks().forEach((track) => { track.enabled = !audio.micMuted })
      meshRef.current?.setLocalStream(result.stream)
    }
    setAudio((current) => ({ ...current, micReady: result.micReady, source: result.micReady ? 'microphone' : 'demo' }))
    flashToast(result.micReady ? 'Microphone is live on the WebRTC path' : 'Demo audio kept the room running')
  }
  const toggleMute = () => {
    setAudio((current) => {
      const nextMuted = !current.micMuted
      streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted })
      socketRef.current?.emit('participant:mute', { muted: nextMuted })
      return { ...current, micMuted: nextMuted }
    })
  }
  const exportFile = (format: 'txt' | 'vtt') => { exportTranscript(captions, format); flashToast(`Transcript exported as .${format}`) }
  const liveConnectionLabel = backendStatus === 'connected' ? 'Socket room connected' : backendStatus === 'connecting' ? 'Connecting shared room…' : 'Demo fallback active'
  const rtcLabel = rtcStatus === 'connected' ? 'WebRTC audio connected' : rtcStatus === 'connecting' ? 'WebRTC negotiating…' : rtcStatus === 'ready' ? 'WebRTC microphone ready' : rtcStatus === 'error' ? 'WebRTC needs retry' : 'WebRTC mic not started'

  return (
    <div className="app-shell">
      <aside className="command-rail">
        <div className="rail-top"><RoundtableMark /><div className="workspace-name">YOUR WORKSPACE<strong><span className="workspace-dot">◉</span> Conversation</strong></div></div>
        <nav className="rail-nav" aria-label="Roundtable navigation">
          <button className="rail-nav__item rail-nav__item--active" type="button"><MessageSquareText size={16} /><span>Conversation</span></button>
          <button className="rail-nav__item" type="button"><Layers3 size={16} /><span>Past sessions</span></button>
          <button className="rail-nav__item" type="button"><UsersRound size={16} /><span>People</span></button>
        </nav>
        <div className="rail-foot"><strong>Every voice, included.</strong><span>Local prototype · v0.3</span></div>
        <div className="rail-bottom"><button className="rail-nav__item" type="button"><Settings2 size={16} /><span>Settings</span></button><div className="rail-profile"><div className="avatar avatar--lime avatar--small">MC</div><div><strong>{displayName}</strong><span>Live participant</span></div><ChevronDown size={14} /></div></div>
      </aside>

      <main className="main-canvas">
        <div className="mobile-topbar"><RoundtableMark /><span className="rail-status"><span /> Live</span><button className="icon-button" type="button" aria-label="Open settings"><Settings2 size={16} /></button></div>
        <RoomHeader isRunning={isRunning} captionCount={captions.length} copied={copied} onCopyRoom={copyRoom} onJoinRoom={joinRoom}>
          <span className={`header-proof ${backendStatus === 'connected' ? 'header-proof--connected' : ''}`}><Network size={14} /> {liveConnectionLabel}</span>
        </RoomHeader>
        <section className="story-strip" aria-label="Roundtable product story">
          <div className="story-strip__intro"><span className="story-strip__index">LIVE ROOM</span><div><span>SHARED SESSION</span><strong>{roomCode} · {participants.length} voice{participants.length === 1 ? '' : 's'} in the room</strong></div></div>
          <ArrowUpRight size={16} className="story-strip__arrow" />
          <div className="story-strip__solution"><span className="story-strip__index">WHY IT HELPS</span><div><span>MORE CONTEXT</span><strong>See who is speaking, without losing the thread.</strong></div></div>
          <div className="story-strip__proof"><span className="proof-orb"><Activity size={15} /></span><div><span>PROOF, LIVE NOW</span><strong>{audio.latency} ms caption latency</strong></div></div>
        </section>
        <div className="workspace-grid">
          <div className="conversation-column">
            <CaptionTimeline captions={captions} timelineOpen={timelineOpen} />
            <div className="conversation-footer"><span><Volume2 size={14} /> Listening for overlapping speech</span><span><Info size={14} /> <button type="button" onClick={() => flashToast('Speaker labels are assigned per room audio stream')}>How speaker labels work</button></span></div>
          </div>
          <aside className="telemetry-column">
            <ParticipantPanel participants={participants} onInvite={copyRoom} />
            <AudioHealthPanel audio={audio} onRequestMic={checkMic} onToggleMute={toggleMute} />
            <DemoControls isRunning={isRunning} timelineOpen={timelineOpen} onToggleRunning={() => setIsRunning((value) => !value)} onToggleTimeline={() => setTimelineOpen((value) => !value)} onExport={exportFile} />
            <div className="session-footnote"><span className="footnote-icon"><Clipboard size={14} /></span><span><strong>Session continuity on</strong><br />History remains available if someone reconnects.</span><button type="button" aria-label="More about session continuity"><ArrowUpRight size={14} /></button></div>
          </aside>
        </div>
        <div className="status-line" role="status" aria-live="polite"><Sparkles size={13} /> {backendStatus === 'connected' ? `Genuine shared room active. ${rtcLabel}.` : backendStatus === 'fallback' ? 'Backend not available — demo mode keeps captions usable.' : 'Connecting to the shared room backend…'}</div>
        <footer className="page-footer"><span><Command size={13} /> Roundtable / build 1.0.0-demo</span><span><span className="footer-dot" /> {sessionDuration} session time</span><span><ShieldCheck size={13} /> {backendStatus === 'connected' ? 'Socket.io ready' : 'Speech API ready'}</span><span className="footer-spacer" /><span>Designed for 2–5 people</span></footer>
      </main>
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
    </div>
  )
}

export default App
