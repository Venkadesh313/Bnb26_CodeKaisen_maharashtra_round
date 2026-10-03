import { Download, FileText, Pause, Play, Radio, Rows3, Sparkles } from 'lucide-react'

type DemoControlsProps = {
  isRunning: boolean
  timelineOpen: boolean
  onToggleRunning: () => void
  onToggleTimeline: () => void
  onExport: (format: 'txt' | 'vtt') => void
}

export function DemoControls({ isRunning, timelineOpen, onToggleRunning, onToggleTimeline, onExport }: DemoControlsProps) {
  return (
    <section className="demo-card">
      <div className="demo-card__topline"><span className="demo-label"><Sparkles size={12} /> Demo mode</span><span className="demo-card__hint">API-safe fallback</span></div>
      <h3>Keep the conversation moving.</h3>
      <p>Use the simulated room to show live labels, low-latency updates, and transcript handoff without external credentials.</p>
      <button className="primary-button" type="button" onClick={onToggleRunning}>{isRunning ? <Pause size={16} /> : <Play size={16} />} {isRunning ? 'Pause live captions' : 'Resume live captions'}<span className="primary-button__key">Space</span></button>
      <div className="demo-card__actions">
        <button className={`small-action ${timelineOpen ? 'small-action--active' : ''}`} type="button" onClick={onToggleTimeline}><Rows3 size={14} /> {timelineOpen ? 'Timeline on' : 'Focus view'}</button>
        <div className="export-menu"><span><Download size={13} /> Export</span><button type="button" onClick={() => onExport('txt')}>.txt</button><button type="button" onClick={() => onExport('vtt')}>.vtt</button></div>
      </div>
      <div className="demo-card__status"><Radio size={13} /> <span>{isRunning ? 'Captions are being simulated in real time' : 'Simulation paused — history is preserved'}</span></div>
    </section>
  )
}
