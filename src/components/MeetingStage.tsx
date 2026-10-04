import type { Participant } from '../lib/types'

export type MeetingStageProps = {
  participants: Participant[]
  localParticipantId: string
  localStream: MediaStream | null
  remoteStreams: Record<string, MediaStream>
  cameraOn: boolean
}

function VideoFeed({ stream, muted, label }: { stream: MediaStream; muted: boolean; label: string }) {
  return (
    <video
      className="meeting-tile__video"
      ref={(node) => {
        if (node && node.srcObject !== stream) node.srcObject = stream
      }}
      autoPlay
      playsInline
      muted={muted}
      aria-label={`${label} camera`}
    />
  )
}

export function MeetingStage({ participants, localParticipantId, localStream, remoteStreams, cameraOn }: MeetingStageProps) {
  return (
    <section className="meeting-stage" aria-label="Meeting video stage">
      <div className="meeting-stage__topline">
        <div>
          <span className="section-kicker section-kicker--lime">LIVE MEETING</span>
          <h2>{participants.length ? `${participants.length} participant${participants.length === 1 ? '' : 's'} joined` : 'Waiting for participants'}</h2>
        </div>
        <span className="meeting-stage__secure"><span className="meeting-stage__secure-dot" /> Encrypted room</span>
      </div>
      <div className={`meeting-stage__grid meeting-stage__grid--${Math.min(Math.max(participants.length, 1), 4)}`}>
        {participants.length === 0 && (
          <div className="meeting-stage__empty">
            <div className="meeting-stage__empty-orb">+</div>
            <strong>Share the room code to invite someone</strong>
            <span>Your meeting is ready when they join.</span>
          </div>
        )}
        {participants.map((participant) => {
          const isLocal = participant.id === localParticipantId
          const stream = isLocal ? localStream : remoteStreams[participant.id]
          const showVideo = Boolean(stream && participant.video === 'on' && (!isLocal || cameraOn))
          return (
            <article className={`meeting-tile meeting-tile--${participant.accent} ${participant.state === 'speaking' ? 'meeting-tile--speaking' : ''}`} key={participant.id}>
              {showVideo && stream ? <VideoFeed stream={stream} muted={isLocal} label={participant.name} /> : <div className="meeting-tile__avatar" aria-hidden="true">{participant.initials}</div>}
              <div className="meeting-tile__shade" />
              <div className="meeting-tile__meta">
                <span className="meeting-tile__name">{participant.name}{isLocal ? ' (You)' : ''}{participant.isHost && <span className="meeting-tile__host">Host</span>}</span>
                <span className="meeting-tile__signals">
                  {participant.handRaised && <span className="meeting-tile__hand" title="Hand raised">Hand raised</span>}
                  <span className={`meeting-tile__mic ${participant.mic === 'muted' ? 'meeting-tile__mic--muted' : ''}`}>{participant.mic === 'muted' ? 'Muted' : 'Mic on'}</span>
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
