

## WebRTC media signaling integrated with the Roundtable interface

- Request microphone access with echo cancellation, noise suppression, and auto gain control, then attach the live stream to a browser peer mesh.
- Relay WebRTC offers, answers, and ICE candidates through Socket.io only between participants in the same room.
- Create and remove peer connections as participants join or disconnect, play remote audio streams automatically, and surface WebRTC connection state in the interface.

## Ashna AI UX review applied without copying gated content

- Review the publicly visible Ashna shell for reusable patterns and document the limitation that the linked chat requires permission.
- Apply the useful patterns to Roundtable as a focused conversation workspace with compact navigation, clear state messaging, one primary room action, and accessible content hierarchy.

## Deployment and setup artifacts generated

- Provide `.env.example`, `scripts/setup.sh`, `scripts/healthcheck.sh`, and `scripts/deploy-docker.sh`.
- Provide a production `Dockerfile` and `.dockerignore` for the combined Vite frontend and Node.js + Socket.io backend.
- Document local setup, Docker deployment, Node/VM deployment, reverse-proxy WebSocket requirements, HTTPS microphone requirements, CORS configuration, and multi-instance scaling considerations in `README.md`.
