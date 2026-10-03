import { Activity, Check, Headphones, Mic, MicOff, RefreshCw, SignalHigh } from 'lucide-react'
import type { AudioState } from '../lib/types'

type AudioHealthPanelProps = {
  audio: AudioState
  onRequestMic: () => void
  onToggleMute: () => void
}

export function AudioHealthPanel({ audio, onRequestMic, onToggleMute }: AudioHealthPanelProps) {
  return (
    <section className="telemetry-card audio-card">
      <div className="card-heading">
        <div>
          <span className="section-kicker">Audio coordination</span>
          <h3>Signal health</h3>
        </div>
        <span className={`health-pill ${audio.connection === 'connected' ? '' : 'health-pill--warning'}`}>
          <span className="health-pill__dot" /> {audio.connection === 'connected' ? 'Healthy' : 'Reconnecting'}
        </span>
      </div>
      <div className="signal-meter">
        <div className="signal-meter__top"><span>Shared audio signal</span><strong>{audio.latency} ms</strong></div>
        <div className="signal-meter__bars" aria-label={`Audio signal latency ${audio.latency} milliseconds`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bar) => <span className={bar < 11 ? 'is-on' : ''} key={bar} style={{ height: `${14 + ((bar * 13) % 28)}px` }} />)}
        </div>
        <div className="signal-meter__foot"><span><SignalHigh size={13} /> Packet loss {audio.packetLoss}%</span><span><Activity size={13} /> Multi-device merge</span></div>
      </div>
      <div className="mic-state">
        <div className={`mic-state__icon ${audio.micMuted ? 'mic-state__icon--muted' : ''}`}><Headphones size={18} /></div>
        <div className="mic-state__copy"><strong>{audio.micMuted ? 'Your mic is muted' : audio.micReady ? 'Your mic is live' : 'Demo audio is active'}</strong><span>{audio.micReady ? 'Ready for the live speech path' : 'Safe fallback while Google Speech connects'}</span></div>
        <button className="icon-button" type="button" onClick={onToggleMute} aria-label={audio.micMuted ? 'Unmute microphone' : 'Mute microphone'}>{audio.micMuted ? <MicOff size={16} /> : <Mic size={16} />}</button>
      </div>
      {!audio.micReady && <button className="text-button" type="button" onClick={onRequestMic}><RefreshCw size={13} /> Check microphone access <span>→</span></button>}
      {audio.micReady && <div className="mic-ready"><Check size={13} /> Microphone permission confirmed</div>}
    </section>
  )
}
