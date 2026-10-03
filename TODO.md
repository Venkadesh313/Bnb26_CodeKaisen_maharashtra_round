# Roundtable MVP Outcomes

## Live room supports 2–5 participants

- Show a live room for 2–5 participants with participant cards, connection state, and speaking indicators.
- Support the interaction model for joining a common room and identifying the current user as a speaker.
- Represent WebRTC/audio coordination states: connected, reconnecting, microphone active/muted, and healthy audio capture.

## Real-time speaker-attributed captions

- Show speaker-attributed real-time captions with readable text, timestamps, and low-latency status.
- Provide a demo-safe simulated caption stream so the product can be pitched without external API credentials.
- Keep Google Speech-to-Text as the intended integration boundary, but do not block the UI when that service is unavailable.
- Handle draft-to-confirmed caption updates to communicate low-latency correction behavior.

## Audio health and session continuity signals

- Show latency and audio-quality signals to support the Phase 5 polish/demo narrative.
- Show microphone active/muted state, reconnecting state, and an explicit demo mode fallback when live browser audio or external services are unavailable.
- Keep the room usable when microphone permission is denied or unavailable.

## Transcript timeline and export

- Provide a caption timeline view with newest captions arriving at the bottom and historical entries retained above.
- Export the current transcript as `.txt` and `.vtt` from the browser.
- Include a timestamp for each caption and preserve the current in-memory session transcript for export.

## Phase 5 polish and demo prep

- Apply font sizes, spacing, color contrast, responsive layout, keyboard focus states, semantic labels, `aria-live`, and reduced-motion behavior for two-person readability.
- Make the pitch flow legible as problem → solution → live demo through the room header and visible product state.
- Keep the live demo reliable with realistic initial content and a controllable simulation fallback.
