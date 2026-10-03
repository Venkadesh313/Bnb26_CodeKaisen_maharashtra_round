import { CheckCircle2, Clock3, Radio } from 'lucide-react'
import type { Caption } from '../lib/types'
import { formatTime } from '../lib/captions'

type CaptionTimelineProps = {
  captions: Caption[]
  timelineOpen: boolean
}

const speakerClass = (speakerId: string) => `speaker-tag speaker-tag--${speakerId}`
const speakerInitials = (speakerId: string, speakerName: string) => {
  if (speakerId === 'maya') return 'M'
  if (speakerId === 'jon') return 'A'
  if (speakerId === 'ravi') return 'S'
  return speakerName.slice(0, 1).toUpperCase()
}

export function CaptionTimeline({ captions, timelineOpen }: CaptionTimelineProps) {
  return (
    <section className={`caption-card ${timelineOpen ? '' : 'caption-card--focus'}`}>
      <div className="caption-card__header">
        <div>
          <div className="section-kicker section-kicker--lime"><Radio size={12} /> Conversation</div>
          <h2>Live words. More understanding.</h2>
        </div>
        <div className="caption-sync"><span className="sync-dot" /><span>Ready to listen</span><span className="caption-sync__latency">~180 ms</span></div>
      </div>
      <div className="timeline" aria-live="polite" aria-label="Live caption timeline" tabIndex={0}>
        {captions.map((caption) => (
          <article className={`caption-entry ${caption.status === 'live' ? 'caption-entry--live' : ''}`} key={caption.id}>
            <div className={`caption-avatar caption-avatar--${caption.speakerId}`} aria-hidden="true">{speakerInitials(caption.speakerId, caption.speakerName)}</div>
            <div className="caption-entry__body">
              <div className="caption-entry__speaker-row">
                <span className={speakerClass(caption.speakerId)}>{caption.speakerName}</span>
                <span className="caption-entry__time"><Clock3 size={12} /> {formatTime(caption.timestamp)}</span>
                {caption.status === 'live' ? <span className="caption-status caption-status--live"><span /> Listening…</span> : <span className="caption-status"><CheckCircle2 size={12} /> Confirmed</span>}
                {caption.isCorrection && <span className="correction-badge">Corrected</span>}
              </div>
              <p>{caption.text}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="caption-card__footer">
        <span><span className="live-wave live-wave--small"><i /><i /><i /><i /></span> New captions appear as the conversation moves</span>
        <span className="caption-card__footer-note">Google Speech pipeline ready</span>
      </div>
    </section>
  )
}
