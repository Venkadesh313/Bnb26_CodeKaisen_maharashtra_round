# Roundtable — Live captions for group conversations

Roundtable is a Vite + React interface for a 2–5 person shared conversation room. The browser connects to a Node.js + Socket.io server for room presence, caption fan-out, mute/speaking state, and WebRTC signaling. Media stays peer-to-peer after signaling; the server does not proxy microphone audio.

## UX direction

The linked Ashna AI page is permission-gated, so the review was limited to its public shell. The useful patterns were a compact product workspace, clear Chat/Agent/Build-level navigation, a focused conversation surface, and explicit permission/state messaging. Roundtable applies those principles to a softer, more accessible conversation workspace: a calm canvas, one primary room action, high-contrast caption cards, persistent connection state, and small operational status labels.

## Quick start

Requirements: Node.js 20 or newer and npm 10 or newer.

```bash
./scripts/setup.sh
npm run dev     # Vite frontend on http://localhost:3000
npm run server  # Socket.io backend on http://localhost:3001
```

Open `http://localhost:3000`. The Vite proxy forwards `/socket.io`, `/health`, and `/api` to port 3001. Open the URL in two browser tabs, use the same workspace code, and choose **Open workspace** to see presence and caption events shared between tabs.

To test the backend directly:

```bash
./scripts/healthcheck.sh
curl http://localhost:3001/api/rooms/RT-4829
```

## Environment

Copy `.env.example` to `.env` for local overrides. `PORT` controls the Node.js server port. `CORS_ORIGINS` is a comma-separated production allowlist; leave it empty for the local proxy. Do not put API keys or microphone data in the frontend bundle.

## Docker deployment

The included image builds the Vite app and serves it from the same Express + Socket.io process, which avoids cross-origin Socket.io configuration for a simple deployment.

```bash
docker build -t roundtable:latest .
docker run --rm --name roundtable \
  --env PORT=3001 \
  -p 3001:3001 \
  roundtable:latest

curl http://localhost:3001/health
```

For a repeatable local Docker deployment, use the helper script. It builds the image, replaces an existing container with the same name, and starts the health-checked service:

```bash
./scripts/deploy-docker.sh
```

Put HTTPS in front of the container with a reverse proxy or managed platform. WebSocket upgrade support is required for `/socket.io/`; if WebSockets are unavailable, Socket.io can fall back to polling. WebRTC microphone access requires HTTPS in production (localhost is allowed for development). The server is intentionally stateless beyond in-memory room state; use a Socket.io adapter and shared persistence before running multiple replicas.

## Node/VM deployment

```bash
npm ci
npm run build
NODE_ENV=production PORT=3001 npm run start
```

Run the process under a supervisor such as systemd, PM2, or the hosting provider's process manager. Configure the health check to `GET /health`, serve the container through HTTPS, and forward WebSocket upgrades. Use a single instance for the demo; for horizontal scaling, add the Socket.io Redis adapter and externalize recent room history.

## Backend contract

- `GET /health` returns `{ ok, service, rooms }`.
- `GET /api/rooms/:roomCode` returns current in-memory participants and the last 50 captions.
- `join-room` registers a display name and emits `room:state`, `participants:update`, and `webrtc:peers`.
- `caption:send` broadcasts `caption:new` to everyone in the room.
- `participant:mute` and `participant:speaking` update room presence.
- `webrtc:signal` relays offers, answers, and ICE candidates only to another socket in the same room.
- Disconnects emit `webrtc:peer-left` and remove the participant.

## Validation

```bash
npm run build
./scripts/healthcheck.sh
```

The interface keeps a safe demo-caption fallback when the backend or microphone is unavailable. Captions in the demo are simulated; browser speech recognition and peer audio need explicit microphone permission and a secure origin.
