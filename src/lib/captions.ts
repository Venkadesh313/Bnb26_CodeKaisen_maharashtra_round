import type { Caption } from './types'

export const INITIAL_CAPTIONS: Caption[] = [
  { id: 'c1', speakerId: 'maya', speakerName: 'Maya Chen', text: 'Thanks for joining. Let’s use this room to pressure-test the handoff.', timestamp: Date.now() - 150000, status: 'confirmed', confidence: 0.99 },
  { id: 'c2', speakerId: 'jon', speakerName: 'Jon Bell', text: 'I’ve got the new flow open. The main thing I’m watching is the first ten seconds.', timestamp: Date.now() - 112000, status: 'confirmed', confidence: 0.97 },
  { id: 'c3', speakerId: 'ravi', speakerName: 'Ravi Patel', text: 'Same here. The shared context feels much clearer when every voice lands in one timeline.', timestamp: Date.now() - 79000, status: 'confirmed', confidence: 0.96 },
  { id: 'c4', speakerId: 'maya', speakerName: 'Maya Chen', text: 'Exactly. And if someone talks over me, the room should still keep both threads visible.', timestamp: Date.now() - 42000, status: 'confirmed', confidence: 0.98 },
  { id: 'c5', speakerId: 'jon', speakerName: 'Jon Bell', text: 'Let’s run the noisy-room test once more before we call it.', timestamp: Date.now() - 12000, status: 'confirmed', confidence: 0.95 },
]

export const DEMO_SCRIPT = [
  { speakerId: 'maya', speakerName: 'Maya Chen', text: 'We can keep the conversation moving while the transcript catches up.', confidence: 0.98 },
  { speakerId: 'jon', speakerName: 'Jon Bell', text: 'The live label makes it obvious which words are still settling.', confidence: 0.97 },
  { speakerId: 'ravi', speakerName: 'Ravi Patel', text: 'And the shared timeline gives us a reliable record of the handoff.', confidence: 0.99 },
  { speakerId: 'maya', speakerName: 'Maya Chen', text: 'That is the moment where a group conversation starts to feel understood.', confidence: 0.96 },
]

export const formatTime = (timestamp: number) =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(timestamp)

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export const toVttTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}.000`
}

export const exportTranscript = (captions: Caption[], format: 'txt' | 'vtt') => {
  const content = format === 'txt'
    ? captions.map((caption) => `[${formatTime(caption.timestamp)}] ${caption.speakerName}: ${caption.text}`).join('\n')
    : ['WEBVTT', '', ...captions.map((caption, index) => `${index + 1}\n${toVttTime(caption.timestamp)} --> ${toVttTime(caption.timestamp + 4500)}\n${caption.speakerName}: ${caption.text}\n`)].join('\n')
  const blob = new Blob([content], { type: format === 'txt' ? 'text/plain' : 'text/vtt' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `roundtable-transcript.${format}`
  anchor.click()
  URL.revokeObjectURL(url)
}
