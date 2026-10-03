import { Check, Copy, LockKeyhole, Radio, Share2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { ROOM } from '../lib/room'

type RoomHeaderProps = {
  isRunning: boolean
  captionCount: number
  copied: boolean
  onCopyRoom: () => void
  children?: ReactNode
}

export function RoomHeader({ isRunning, captionCount, copied, onCopyRoom, children }: RoomHeaderProps) {
  return (
    <header className="room-header">
      <div className="room-header__intro">
        <div className="eyebrow-row">
          <span className={`live-chip ${isRunning ? 'live-chip--active' : 'live-chip--paused'}`}>
            <span className="live-chip__dot" />
            {isRunning ? 'Live session' : 'Session paused'}
          </span>
          <span className="eyebrow-muted"><LockKeyhole size={12} /> Private room</span>
        </div>
        <div className="room-header__title-row">
          <div>
            <p className="section-kicker">Roundtable / shared conversation</p>
            <h1>{ROOM.name}</h1>
          </div>
          <div className="room-header__actions">{children}</div>
        </div>
        <div className="room-meta">
          <span className="room-meta__code">{ROOM.code}</span>
          <span>Started {ROOM.startedAt}</span>
          <span className="room-meta__divider" />
          <span><Radio size={13} /> {captionCount} captions in this session</span>
        </div>
      </div>
      <button className="share-button" type="button" onClick={onCopyRoom}>
        {copied ? <Check size={16} /> : <Share2 size={16} />}
        <span>{copied ? 'Room code copied' : 'Invite someone'}</span>
        {!copied && <Copy size={13} className="share-button__copy" />}
      </button>
    </header>
  )
}
