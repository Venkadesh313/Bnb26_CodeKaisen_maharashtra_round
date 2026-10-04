import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, ArrowUpRight, Check, ChevronDown, Clipboard, Command, Info, Layers3, MessageSquareText, Network, Settings2, ShieldCheck, Sparkles, UsersRound, Volume2, X } from 'lucide-react'
import { io } from 'socket.io-client'
import { AudioHealthPanel } from './components/AudioHealthPanel'
import { CaptionTimeline } from './components/CaptionTimeline'
import { DemoControls } from './components/DemoControls'
import { MeetingControls } from './components/MeetingControls'
import { MeetingStage } from './components/MeetingStage'
import { ParticipantPanel } from './components/ParticipantPanel'
import { RoomHeader } from './components/RoomHeader'
import { RoundtableMark } from './components/RoundtableMark'
import { requestCamera, requestMicrophone } from './lib/audio'
import { DEMO_SCRIPT, exportTranscript, INITIAL_CAPTIONS } from './lib/captions'
import { PARTICIPANTS, ROOM } from './lib/room'
import type { AudioState, Caption, Participant } from './lib/types'
import type { RoomSocket } from './lib/socket'
import { WebRtcMesh } from './lib/webrtc'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'

type MeetingState = 'live' | 'ended' | 'left'
type NavSection = 'conversation' | 'past' | 'people'

function App() {
  const [captions, setCaptions] = useState<Caption[]>(INITIAL_CAPTIONS)
  const [participants, setParticipants] = useState<Participant[]>(PARTICIPANTS)
  const [isRunning, setIsRunning] = useState(true)
  const [timelineOpen, setTimelineOpen] = useState(true)
  const [participantsOpen, setParticipantsOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'connected' | 'fallback'>('connecting')
  const [rtcStatus, setRtcStatus] = useState<'idle' | 'ready' | 'connecting' | 'connected' | 'error'>('idle')
  const [meetingState, setMeetingState] = useState<MeetingState>('live')
  const [meetingEndedBy, setMeetingEndedBy] = useState('')
  const [activeNav, setActiveNav] = useState<NavSection>('conversation')
  const [roomCode, setRoomCode] = useState(ROOM.code)
  const [displayName, setDisplayName] = useState('Maya Chen')
  const [hostId, setHostId] = useState<string | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [audio, setAudio] = useState<AudioState>({ micReady: false, micMuted: false, connection: 'connected', latency: 180, packetLoss: 0.4, source: 'demo' })
  const socketRef = useRef<RoomSocket | null>(null)
  const meshRef = useRef<WebRtcMesh | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const localIdRef = useRef('')

  const sessionDuration = useMemo(() => `${String(Math.floor(captions.length * 1.7)).padStart(2, '0')}:42`, [captions.length])
  const localParticipantId = localIdRef.current || participants.find((participant) => participant.isHost)?.id || participants[0]?.id || ''
  const localParticipant = participants.find((participant) => participant.id === localParticipantId)
  const isHost = Boolean(hostId && hostId === localParticipantId) || Boolean(localParticipant?.isHost)

  const flashToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const stopLocalMedia = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setLocalStream(null)
    setCameraOn(false)
    setAudio((current) => ({ ...current, micReady: false, source: 'demo' }))
  }

  useEffect(() => {
    const socket = io('/', { autoConnect: false, transports: ['websocket', 'polling'] }) as RoomSocket
    socketRef.current = socket
    const mesh = new WebRtcMesh(socket, {
      onStatus: setRtcStatus,
      onRemoteStream: (peerId, stream) => setRemoteStreams((current) => ({ ...current, [peerId]: stream })),
      onPeerLeft: (peerId) => setRemoteStreams((current) => {
        const next = { ...current }
        delete next[peerId]
        return next
      }),
    })
    meshRef.current = mesh

    socket.on('connect', () => {
      localIdRef.current = socket.id || ''
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
      setHostId(state.hostId)
      setParticipants(state.participants)
      if (state.captions.length) setCaptions(state.captions)
      setMeetingState('live')
    })
    socket.on('participants:update', (nextParticipants) => setParticipants(nextParticipants))
    socket.on('caption:new', (caption) => {
      setCaptions((current) => current.some((item) => item.id === caption.id) ? current : [...current.slice(-7), caption])
    })
    socket.on('meeting:ended', ({ endedBy }) => {
      setMeetingEndedBy(endedBy)
      setMeetingState('ended')
      setIsRunning(false)
      stopLocalMedia()
      flashToast('The host ended the meeting')
    })
    socket.connect()

    return () => {
      mesh.close()
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      meshRef.current = null
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const isMicRecording = audio.micReady && !audio.micMuted && isRunning && meetingState === 'live'
  useSpeechRecognition({
    socket: socketRef.current,
    isRecording: isMicRecording,
    speakerName: displayName,
    onError: (err) => flashToast(err),
  })

  useEffect(() => {
    if (!isRunning || audio.source === 'microphone' || meetingState !== 'live') return
    const interval = window.setInterval(() => {
      const next = DEMO_SCRIPT[captions.length % DEMO_SCRIPT.length]
      const captionId = `live-${Date.now()}`
      const draft: Caption = { ...next, id: captionId, timestamp: Date.now(), status: 'live' }
      setCaptions((current) => [...current.slice(-7), draft])
      socketRef.current?.emit('caption:send', draft)
      socketRef.current?.emit('participant:speaking', { speaking: true })
      window.setTimeout(() => setCaptions((current) => current.map((caption) => caption.id === captionId ? { ...caption, status: 'confirmed', isCorrection: true } : caption)), 1400)
    }, 5600)
    return () => window.clearInterval(interval)
  }, [isRunning, audio.source, captions.length, meetingState])

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

  const copyRoom = async () => {
    try { await navigator.clipboard.writeText(roomCode) } catch { /* Clipboard is optional in preview. */ }
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
    setMeetingState('live')
    setMeetingEndedBy('')
    setIsRunning(true)
    if (socketRef.current?.connected) socketRef.current.emit('join-room', { roomCode: nextCode, name: nextName })
    else socketRef.current?.connect()
    flashToast(`Joined meeting ${nextCode}`)
  }

  const checkMic = async () => {
    const result = await requestMicrophone()
    if (result.stream) {
      const existingVideo = streamRef.current?.getVideoTracks() || []
      streamRef.current?.getAudioTracks().forEach((track) => track.stop())
      existingVideo.forEach((track) => result.stream?.addTrack(track))
      streamRef.current = result.stream
      result.stream.getAudioTracks().forEach((track) => { track.enabled = !audio.micMuted })
      meshRef.current?.setLocalStream(result.stream)
      setLocalStream(result.stream)
    }
    setAudio((current) => ({ ...current, micReady: result.micReady, source: result.micReady ? 'microphone' : 'demo' }))
    flashToast(result.micReady ? 'Microphone is live for everyone in the room' : 'Demo audio kept the meeting running')
  }

  const toggleMute = () => {
    setAudio((current) => {
      const nextMuted = !current.micMuted
      streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted })
      socketRef.current?.emit('participant:mute', { muted: nextMuted })
      return { ...current, micMuted: nextMuted }
    })
  }

  const toggleCamera = async () => {
    if (cameraOn) {
      streamRef.current?.getVideoTracks().forEach((track) => { track.enabled = false })
      setCameraOn(false)
      socketRef.current?.emit('participant:video', { video: false })
      flashToast('Camera off — your avatar stays visible')
      return
    }
    const result = await requestCamera()
    if (!result.stream) {
      flashToast(result.reason)
      return
    }
    if (streamRef.current) {
      result.stream.getVideoTracks().forEach((track) => streamRef.current?.addTrack(track))
    } else {
      streamRef.current = result.stream
    }
    const nextStream = streamRef.current
    if (nextStream) {
      meshRef.current?.setLocalStream(nextStream)
      setLocalStream(nextStream)
    }
    setCameraOn(true)
    socketRef.current?.emit('participant:video', { video: true })
    flashToast('Camera is live for everyone in the room')
  }

  const toggleHand = () => {
    const nextRaised = !handRaised
    setHandRaised(nextRaised)
    setParticipants((current) => current.map((participant) => participant.id === localParticipantId ? { ...participant, handRaised: nextRaised } : participant))
    socketRef.current?.emit('participant:hand', { raised: nextRaised })
    flashToast(nextRaised ? 'Hand raised for the room' : 'Hand lowered')
  }

  const leaveMeeting = () => {
    socketRef.current?.emit('leave-room')
    stopLocalMedia()
    setMeetingState('left')
    setIsRunning(false)
    flashToast('You left the meeting')
  }

  const endMeeting = () => {
    if (!isHost) {
      leaveMeeting()
      return
    }
    if (!window.confirm('End this meeting for everyone in the room?')) return
    if (backendStatus === 'connected') socketRef.current?.emit('end-meeting')
    else {
      setMeetingState('ended')
      setIsRunning(false)
      stopLocalMedia()
    }
  }

  const restartMeeting = () => {
    setMeetingState('live')
    setMeetingEndedBy('')
    setIsRunning(true)
    setCaptions(INITIAL_CAPTIONS)
    if (socketRef.current?.connected) socketRef.current.emit('join-room', { roomCode, name: displayName })
    else socketRef.current?.connect()
  }

  const exportFile = (format: 'txt' | 'vtt') => { exportTranscript(captions, format); flashToast(`Transcript exported as .${format}`) }
  const liveConnectionLabel = backendStatus === 'connected' ? 'Socket room connected' : backendStatus === 'connecting' ? 'Connecting shared room…' : 'Demo fallback active'
  const rtcLabel = rtcStatus === 'connected' ? 'WebRTC audio/video connected' : rtcStatus === 'connecting' ? 'WebRTC negotiating…' : rtcStatus === 'ready' ? 'WebRTC media ready' : rtcStatus === 'error' ? 'WebRTC needs retry' : 'Media not started'
  const selectNav = (section: NavSection) => {
    setActiveNav(section)
    const message = section === 'conversation' ? 'Live conversation is open' : section === 'past' ? 'Past sessions are available after this meeting' : 'People view is open in the participant panel'
    flashToast(message)
    if (section === 'people') setParticipantsOpen(true)
  }

  return (
    <div className={`app-shell meeting-app meeting-state--${meetingState}`}>
      <aside className="command-rail">
        <div className="rail-top"><RoundtableMark /><div className="workspace-name">YOUR WORKSPACE<strong><span className="workspace-dot">◉</span> Live meeting</strong></div></div>
        <nav className="rail-nav" aria-label="Roundtable navigation">
          <button className={`rail-nav__item ${activeNav === 'conversation' ? 'rail-nav__item--active' : ''}`} type="button" onClick={() => selectNav('conversation')}><MessageSquareText size={16} /><span>Conversation</span></button>
          <button className={`rail-nav__item ${activeNav === 'past' ? 'rail-nav__item--active' : ''}`} type="button" onClick={() => selectNav('past')}><Layers3 size={16} /><span>Past sessions</span></button>
          <button className={`rail-nav__item ${activeNav === 'people' ? 'rail-nav__item--active' : ''}`} type="button" onClick={() => selectNav('people')}><UsersRound size={16} /><span>People</span></button>
        </nav>
        <div className="rail-foot"><strong>Meet clearly. Leave nothing behind.</strong><span>Realtime prototype · v1.0</span></div>
        <div className="rail-bottom"><button className="rail-nav__item" type="button" onClick={() => setSettingsOpen(true)}><Settings2 size={16} /><span>Settings</span></button><div className="rail-profile"><div className="avatar avatar--lime avatar--small">{displayName.slice(0, 2).toUpperCase()}</div><div><strong>{displayName}</strong><span>{isHost ? 'Meeting host' : 'Live participant'}</span></div><ChevronDown size={14} /></div></div>
      </aside>

      <main className="main-canvas">
        <div className="mobile-topbar"><RoundtableMark /><span className="rail-status"><span /> {meetingState === 'live' ? 'Live' : 'Ended'}</span><button className="icon-button" type="button" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><Settings2 size={16} /></button></div>
        <RoomHeader roomCode={roomCode} roomName={ROOM.name} isRunning={isRunning} captionCount={captions.length} copied={copied} onCopyRoom={copyRoom} onJoinRoom={joinRoom}>
          <span className={`header-proof ${backendStatus === 'connected' ? 'header-proof--connected' : ''}`}><Network size={14} /> {liveConnectionLabel}</span>
          {meetingState === 'live' && <button className="danger-button danger-button--header" type="button" onClick={endMeeting}>{isHost ? 'End meeting' : 'Leave meeting'}</button>}
        </RoomHeader>

        <section className="meeting-room-strip" aria-label="Meeting status">
          <div><span className="meeting-room-strip__label">ROOM CODE</span><strong>{roomCode}</strong></div>
          <div><span className="meeting-room-strip__label">PEOPLE</span><strong>{participants.length} / 5 joined</strong></div>
          <div><span className="meeting-room-strip__label">MEDIA</span><strong>{rtcLabel}</strong></div>
          <div className="meeting-room-strip__hint"><Activity size={15} /> Changes sync instantly across tabs</div>
        </section>

        {meetingState === 'live' ? (
          <div className="meeting-layout">
            <div className="meeting-main-column">
              <MeetingStage participants={participants} localParticipantId={localParticipantId} localStream={localStream} remoteStreams={remoteStreams} cameraOn={cameraOn} />
              <MeetingControls muted={audio.micMuted} cameraOn={cameraOn} captionsOn={timelineOpen} participantsOpen={participantsOpen} handRaised={handRaised} isHost={isHost} onToggleMute={toggleMute} onToggleCamera={toggleCamera} onToggleCaptions={() => setTimelineOpen((value) => !value)} onToggleParticipants={() => setParticipantsOpen((value) => !value)} onToggleHand={toggleHand} onOpenSettings={() => setSettingsOpen(true)} onLeave={endMeeting} />
              {timelineOpen && <CaptionTimeline captions={captions} timelineOpen={timelineOpen} />}
              {!timelineOpen && <div className="captions-hidden-card"><Volume2 size={16} /><strong>Live captions are hidden</strong><span>Use the Captions control to show the transcript again.</span></div>}
              <div className="conversation-footer"><span><Volume2 size={14} /> Listening for overlapping speech</span><span><Info size={14} /> <button type="button" onClick={() => flashToast('Speaker labels follow the participant who sends each caption')}>How speaker labels work</button></span></div>
            </div>
            {participantsOpen && <aside className="meeting-sidebar">
              <ParticipantPanel participants={participants} onInvite={copyRoom} />
              <AudioHealthPanel audio={audio} onRequestMic={checkMic} onToggleMute={toggleMute} />
              <DemoControls isRunning={isRunning} timelineOpen={timelineOpen} onToggleRunning={() => setIsRunning((value) => !value)} onToggleTimeline={() => setTimelineOpen((value) => !value)} onExport={exportFile} />
              <div className="session-footnote"><span className="footnote-icon"><Clipboard size={14} /></span><span><strong>Meeting continuity on</strong><br />Captions remain available while people reconnect.</span><button type="button" aria-label="More about meeting continuity" onClick={() => flashToast('Room history stays in memory for this live meeting')}><ArrowUpRight size={14} /></button></div>
            </aside>}
          </div>
        ) : (
          <section className="meeting-ended-card">
            <div className="meeting-ended-card__orb"><X size={25} /></div>
            <span className="section-kicker section-kicker--lime">MEETING {meetingState === 'ended' ? 'ENDED' : 'LEFT'}</span>
            <h2>{meetingState === 'ended' ? 'This meeting has ended.' : 'You left the meeting.'}</h2>
            <p>{meetingState === 'ended' ? 'Everyone in the room has been notified. Start a fresh room when you are ready.' : 'Your microphone and camera are no longer shared with this room.'}</p>
            <div className="meeting-ended-card__actions"><button className="primary-button" type="button" onClick={restartMeeting}>Start again</button><button className="outline-button" type="button" onClick={joinRoom}>Join another room</button></div>
          </section>
        )}

        <div className="status-line" role="status" aria-live="polite"><Sparkles size={13} /> {meetingState === 'ended' ? `Meeting ended by ${meetingEndedBy ? 'the host' : 'you'}.` : meetingState === 'left' ? 'You are outside the live room.' : backendStatus === 'connected' ? `Shared meeting active. ${rtcLabel}.` : backendStatus === 'fallback' ? 'Backend not available — demo mode keeps the meeting usable.' : 'Connecting to the shared meeting backend…'}</div>
        <footer className="page-footer"><span><Command size={13} /> Roundtable / build 1.0.0-meet</span><span><span className="footer-dot" /> {sessionDuration} session time</span><span><ShieldCheck size={13} /> {backendStatus === 'connected' ? 'Room sync ready' : 'Demo fallback ready'}</span><span className="footer-spacer" /><span>Designed for 2–5 people</span></footer>
      </main>

      {settingsOpen && <div className="modal-backdrop" role="presentation" onClick={() => setSettingsOpen(false)}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={(event) => event.stopPropagation()}>
        <div className="settings-modal__header"><div><span className="section-kicker">MEETING SETTINGS</span><h2 id="settings-title">Make the room yours.</h2></div><button className="icon-button" type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X size={16} /></button></div>
        <label className="settings-field">Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} onBlur={() => socketRef.current?.emit('join-room', { roomCode, name: displayName.trim() || 'Guest' })} /></label>
        <div className="settings-row"><span><strong>Room code</strong><small>{roomCode}</small></span><button className="outline-button" type="button" onClick={copyRoom}>Copy code</button></div>
        <div className="settings-row"><span><strong>Audio feedback</strong><small>Echo cancellation and noise suppression are on.</small></span><button className="small-action small-action--active" type="button" onClick={() => flashToast('Audio processing is enabled')}>Enabled</button></div>
        <button className="primary-button settings-modal__done" type="button" onClick={() => { setSettingsOpen(false); flashToast('Meeting settings saved') }}>Done</button>
      </section></div>}
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
    </div>
  )
}

export default App
