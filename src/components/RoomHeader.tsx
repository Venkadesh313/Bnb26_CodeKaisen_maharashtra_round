import { Check, Copy, LockKeyhole, Radio, Share2 } from 'lucide-react'
import type { ReactNode } from 'react'

type RoomHeaderProps = {
  roomCode: string
  roomName: string
  isRunning: boolean
  captionCount: number
  copied: boolean
  onCopyRoom: () => void
  onJoinRoom: () => void
  children?: ReactNode
}

export function RoomHeader({ roomCode, roomName, isRunning, captionCount, copied, onCopyRoom, onJoinRoom, children }: RoomHeaderProps) {
  return (
    <header className="room-header">
      <div className="room-header__topbar">
        <span className="room-header__eyebrow">A little closer. A lot clearer.</span>
        <span className="prototype-pill">Live meeting workspace</span>
      </div>
      <div className="room-header__hero">
        <div className="room-header__intro">
          <div className="eyebrow-row">
            <span className="section-kicker">WORKSPACE / {roomCode}</span>
            <span className="eyebrow-muted"><LockKeyhole size={12} /> Private local room</span>
          </div>
          <h1>Good conversations include everyone.</h1>
          <p className="room-header__subcopy">A focused meeting room for video, voice, and every word in the room.</p>
          <div className="room-meta">
            <span className="room-meta__room"><Radio size={13} /> {roomName}</span>
            <span>{captionCount} captions</span>
            <span className="room-meta__divider" />
            <span>{isRunning ? 'Meeting live' : 'Captions paused'}</span>
          </div>
        </div>
        <div className="room-header__actions">
          <button className="outline-button" type="button" onClick={onCopyRoom}>
            {copied ? <Check size={15} /> : <Share2 size={15} />}
            {copied ? 'Code copied' : 'Share code'}
            {!copied && <Copy size={13} className="share-button__copy" />}
          </button>
          <button className="primary-button header-primary" type="button" onClick={onJoinRoom}>Switch room</button>
          {children}
        </div>
      </div>
    </header>
  )
}
