import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowUpRight, Check, ChevronDown, Clipboard, Command, Info, Layers3, MessageSquareText, Settings2, ShieldCheck, Sparkles, UsersRound, Volume2 } from 'lucide-react'
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

function App() {
  const [captions, setCaptions] = useState<Caption[]>(INITIAL_CAPTIONS)
  const [participants, setParticipants] = useState<Participant[]>(PARTICIPANTS)
  const [isRunning, setIsRunning] = useState(true)
  const [timelineOpen, setTimelineOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')
  const [audio, setAudio] = useState<AudioState>({ micReady: false, micMuted: false, connection: 'connected', latency: 180, packetLoss: 0.4, source: 'demo' })

  const latestCaption = captions[captions.length - 1]
  const sessionDuration = useMemo(() => `${String(Math.floor(captions.length * 1.7)).padStart(2, '0')}:42`, [captions.length])

  useEffect(() => {
    if (!isRunning) return
    const interval = window.setInterval(() => {
      const next = DEMO_SCRIPT[captions.length % DEMO_SCRIPT.length]
      const captionId = `live-${Date.now()}`
      const draft: Caption = { ...next, id: captionId, timestamp: Date.now(), status: 'live' }
      setCaptions((current) => [...current.slice(-7), draft])
      setParticipants((current) => current.map((person) => ({ ...person, state: person.id === next.speakerId ? 'speaking' : 'listening' })))
      window.setTimeout(() => {
        setCaptions((current) => current.map((caption) => caption.id === captionId ? { ...caption, status: 'confirmed', isCorrection: true } : caption))
      }, 1400)
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

  const flashToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const copyRoom = async () => {
    try { await navigator.clipboard.writeText(`${ROOM.name} · ${ROOM.code}`) } catch { /* Clipboard is optional in demo preview. */ }
    setCopied(true)
    flashToast('Room invite copied to clipboard')
    window.setTimeout(() => setCopied(false), 2200)
  }

  const checkMic = async () => {
    const result = await requestMicrophone()
    setAudio((current) => ({ ...current, micReady: result.micReady, source: result.micReady ? 'microphone' : 'demo' }))
    flashToast(result.micReady ? 'Microphone is ready for live audio' : 'Demo audio kept the room running')
  }

  const toggleMute = () => setAudio((current) => ({ ...current, micMuted: !current.micMuted }))
  const invite = () => { copyRoom() }
  const exportFile = (format: 'txt' | 'vtt') => { exportTranscript(captions, format); flashToast(`Transcript exported as .${format}`) }

  return (
    <div className="app-shell">
      <aside className="command-rail">
        <div className="rail-top"><RoundtableMark compact /><span className="rail-status"><span /> Live</span></div>
        <nav className="rail-nav" aria-label="Roundtable navigation">
          <button className="rail-nav__item rail-nav__item--active" type="button"><MessageSquareText size={18} /><span>Live room</span></button>
          <button className="rail-nav__item" type="button"><Layers3 size={18} /><span>Past sessions</span></button>
          <button className="rail-nav__item" type="button"><UsersRound size={18} /><span>People</span></button>
        </nav>
        <div className="rail-bottom">
          <button className="rail-nav__item" type="button"><Settings2 size={18} /><span>Settings</span></button>
          <div className="rail-profile"><div className="avatar avatar--lime avatar--small">MC</div><div><strong>Maya Chen</strong><span>Workspace owner</span></div><ChevronDown size={14} /></div>
        </div>
      </aside>

      <main className="main-canvas">
        <div className="mobile-topbar"><RoundtableMark /><span className="rail-status"><span /> Live</span><button className="icon-button" type="button" aria-label="Open settings"><Settings2 size={16} /></button></div>
        <RoomHeader isRunning={isRunning} captionCount={captions.length} copied={copied} onCopyRoom={copyRoom}>
          <div className="header-proof"><ShieldCheck size={15} /> End-to-end room signal</div>
        </RoomHeader>
        <section className="story-strip" aria-label="Roundtable product story">
          <div className="story-strip__intro"><span className="story-strip__index">01</span><div><span>THE PROBLEM</span><strong>Conversations get messy when every device hears a different room.</strong></div></div>
          <ArrowUpRight size={16} className="story-strip__arrow" />
          <div className="story-strip__solution"><span className="story-strip__index">02</span><div><span>THE ROUNDTable SHIFT</span><strong>Coordinate nearby signals so every voice lands in context.</strong></div></div>
          <div className="story-strip__proof"><span className="proof-orb"><Activity size={15} /></span><div><span>PROOF, LIVE NOW</span><strong>{audio.latency} ms caption latency</strong></div></div>
        </section>
        <div className="workspace-grid">
          <div className="conversation-column">
            <CaptionTimeline captions={captions} timelineOpen={timelineOpen} />
            <div className="conversation-footer"><span><Volume2 size={14} /> Listening for overlapping speech</span><span><Info size={14} /> <button type="button" onClick={() => flashToast('Speaker labels are assigned per room audio stream')}>How speaker labels work</button></span></div>
          </div>
          <aside className="telemetry-column">
            <ParticipantPanel participants={participants} onInvite={invite} />
            <AudioHealthPanel audio={audio} onRequestMic={checkMic} onToggleMute={toggleMute} />
            <DemoControls isRunning={isRunning} timelineOpen={timelineOpen} onToggleRunning={() => setIsRunning((value) => !value)} onToggleTimeline={() => setTimelineOpen((value) => !value)} onExport={exportFile} />
            <div className="session-footnote"><span className="footnote-icon"><Clipboard size={14} /></span><span><strong>Session continuity on</strong><br />History remains available if someone reconnects.</span><button type="button" aria-label="More about session continuity"><ArrowUpRight size={14} /></button></div>
          </aside>
        </div>
        <footer className="page-footer"><span><Command size={13} /> Roundtable / build 0.8.2-demo</span><span><span className="footer-dot" /> {sessionDuration} session time</span><span>Speech API <span className="footer-state">ready</span></span><span className="footer-spacer" /><span>Designed for 2–5 people</span></footer>
      </main>
      {toast && <div className="toast" role="status"><Check size={15} /> {toast}</div>}
    </div>
  )
}

export default App
