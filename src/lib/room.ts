import type { Participant } from './types'

export const ROOM = {
  name: 'Design review · Thursday',
  code: 'RT-4829',
  startedAt: '10:14 AM',
  capacity: '3 / 5',
}

export const PARTICIPANTS: Participant[] = [
  {
    id: 'maya',
    name: 'Maya Chen',
    role: 'Host · You',
    initials: 'MC',
    accent: 'lime',
    mic: 'on',
    state: 'speaking',
  },
  {
    id: 'jon',
    name: 'Jon Bell',
    role: 'Remote · joined 2m ago',
    initials: 'JB',
    accent: 'coral',
    mic: 'on',
    state: 'listening',
  },
  {
    id: 'ravi',
    name: 'Ravi Patel',
    role: 'Remote · joined 1m ago',
    initials: 'RP',
    accent: 'blue',
    mic: 'on',
    state: 'listening',
  },
]
