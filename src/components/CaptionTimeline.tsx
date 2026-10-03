import { CheckCircle2, Clock3, Radio } from 'lucide-react'
import type { Caption } from '../lib/types'
import { formatTime } from '../lib/captions'

type CaptionTimelineProps = {
  captions: Caption[]
  timelineOpen: boolean
}

const speakerClass = (speakerId: string) => `speaker-tag speaker-tag--${speakerId}`

export function CaptionTimeline({ captions, timelineOpen }: CaptionTimelineProps) {
  return (
    <section className={`caption-card ${timelineOpen ? '' : 'caption-card--focus'}`}>
      <div className="caption-card__header">
        <div>
          <div className="section-kicker section-kicker--lime"><Radio size={12} /> Live transcript</div>
          <h2>Every voice, in context.</h2>
        </div>
        <div className="caption-sync">
          <span className="sync-dot" />
          <span>Syncing across 3 devices</span>
          <span className="caption-sync__latency">~180 ms</span>
        </div>
      </div>
      <div className="caption-card__legend">
        <span><span className="legend-dot legend-dot--lime" /> Maya Chen</span>
        <span><span className="legend-dot legend-dot--coral" /> Jon Bell</span>
        <span><span className="legend-dot legend-dot--blue" /> Ravi Patel</span>
      </div>
      <div className="timeline" aria-live="polite" aria-label="Live caption timeline">
        {captions.map((caption) => (
          <article className={`caption-entry ${caption.status === 'live' ? 'caption-entry--live' : ''}`} key={caption.id}>
            <div className="caption-entry__time"><Clock3 size={12} /> {formatTime(caption.timestamp)}</div>
            <div className="caption-entry__rail" aria-hidden="true"><span className="caption-entry__dot" /></div>
            <div className="caption-entry__body">
              <div className="caption-entry__speaker-row">
                <span className={speakerClass(caption.speakerId)}>{caption.speakerName}</span>
                {caption.status === 'live' ? (
                  <span className="caption-status caption-status--live"><span /> Listening now</span>
                ) : (
                  <span className="caption-status"><CheckCircle2 size={12} /> Confirmed</span>
                )}
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
