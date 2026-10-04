import { Captions, Hand, Mic, MicOff, PhoneOff, Settings2, UsersRound, Video, VideoOff } from 'lucide-react'

type MeetingControlsProps = {
  muted: boolean
  cameraOn: boolean
  captionsOn: boolean
  participantsOpen: boolean
  handRaised: boolean
  isHost: boolean
  onToggleMute: () => void
  onToggleCamera: () => void
  onToggleCaptions: () => void
  onToggleParticipants: () => void
  onToggleHand: () => void
  onOpenSettings: () => void
  onLeave: () => void
}

export function MeetingControls({ muted, cameraOn, captionsOn, participantsOpen, handRaised, isHost, onToggleMute, onToggleCamera, onToggleCaptions, onToggleParticipants, onToggleHand, onOpenSettings, onLeave }: MeetingControlsProps) {
  return (
    <div className="meeting-controls" aria-label="Meeting controls">
      <div className="meeting-controls__group">
        <button className={`meeting-control ${muted ? 'meeting-control--off' : ''}`} type="button" onClick={onToggleMute} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'} title={muted ? 'Unmute microphone' : 'Mute microphone'}>
          {muted ? <MicOff size={17} /> : <Mic size={17} />}
          <span>{muted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button className={`meeting-control ${!cameraOn ? 'meeting-control--off' : ''}`} type="button" onClick={onToggleCamera} aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'} title={cameraOn ? 'Turn camera off' : 'Turn camera on'}>
          {cameraOn ? <Video size={17} /> : <VideoOff size={17} />}
          <span>{cameraOn ? 'Camera' : 'Start video'}</span>
        </button>
        <button className={`meeting-control ${!captionsOn ? 'meeting-control--active' : ''}`} type="button" onClick={onToggleCaptions} aria-label={captionsOn ? 'Hide live captions' : 'Show live captions'} title={captionsOn ? 'Hide live captions' : 'Show live captions'}>
          <Captions size={17} />
          <span>{captionsOn ? 'Captions' : 'Show captions'}</span>
        </button>
        <button className={`meeting-control ${participantsOpen ? 'meeting-control--active' : ''}`} type="button" onClick={onToggleParticipants} aria-label="Toggle participants panel" title="Toggle participants panel">
          <UsersRound size={17} />
          <span>People</span>
        </button>
        <button className={`meeting-control ${handRaised ? 'meeting-control--raised' : ''}`} type="button" onClick={onToggleHand} aria-label={handRaised ? 'Lower hand' : 'Raise hand'} title={handRaised ? 'Lower hand' : 'Raise hand'}>
          <Hand size={17} />
          <span>{handRaised ? 'Lower hand' : 'Raise hand'}</span>
        </button>
        <button className="meeting-control" type="button" onClick={onOpenSettings} aria-label="Open meeting settings" title="Open meeting settings">
          <Settings2 size={17} />
          <span>Settings</span>
        </button>
      </div>
      <button className="meeting-control meeting-control--leave" type="button" onClick={onLeave} aria-label={isHost ? 'End meeting for everyone' : 'Leave meeting'} title={isHost ? 'End meeting for everyone' : 'Leave meeting'}>
        <PhoneOff size={17} />
        <span>{isHost ? 'End meeting' : 'Leave'}</span>
      </button>
    </div>
  )
}
