
## Node.js + Socket.io genuine shared sessions

- Run a Node.js backend with Socket.io room coordination for shared session codes.
- Let participants join the same room code with a display name and receive participant presence updates.
- Broadcast caption events, microphone mute state, and speaking state to every participant in the room.
- Preserve recent captions in room memory and expose them in the room state for reconnecting clients.
- Expose an unauthenticated `/health` endpoint and a room inspection endpoint for operational checks.
- Proxy `/socket.io`, `/health`, and `/api` from the Vite preview to the backend service.
