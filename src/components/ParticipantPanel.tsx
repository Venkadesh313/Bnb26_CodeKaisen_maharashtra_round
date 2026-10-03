import { Mic, MicOff, MoreHorizontal, Radio, UserRoundPlus, Wifi } from 'lucide-react'
import type { Participant } from '../lib/types'

type ParticipantPanelProps = {
  participants: Participant[]
  onInvite: () => void
}

export function ParticipantPanel({ participants, onInvite }: ParticipantPanelProps) {
  return (
    <section className="telemetry-card participant-card">
      <div className="card-heading">
        <div>
          <span className="section-kicker">Room participants</span>
          <h3>{participants.length} voices in the room</h3>
        </div>
        <span className="capacity-pill">2–5 target</span>
      </div>
      <div className="participant-list">
        {participants.map((participant) => (
          <div className="participant-row" key={participant.id}>
            <div className={`avatar avatar--${participant.accent}`}><span>{participant.initials}</span>{participant.state === 'speaking' && <i className="avatar__pulse" />}</div>
            <div className="participant-row__identity">
              <strong>{participant.name}</strong>
              <span>{participant.role}</span>
            </div>
            <div className="participant-row__state">
              {participant.state === 'speaking' && <span className="speaking-bars"><i /><i /><i /></span>}
              {participant.mic === 'on' ? <Mic size={15} /> : <MicOff size={15} />}
              <Wifi size={14} className="wifi-icon" />
            </div>
          </div>
        ))}
      </div>
      <button className="outline-button outline-button--wide" type="button" onClick={onInvite}>
        <UserRoundPlus size={15} /> Invite another voice
        <MoreHorizontal size={15} className="outline-button__end" />
      </button>
      <div className="participant-card__note"><Radio size={13} /> Auto-labeling is active for this room</div>
    </section>
  )
}
