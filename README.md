# Collaborative Canvas — Real-Time Multi-User Drawing App

A real-time, multi-user drawing canvas built with Node.js, Express and Socket.io. Multiple participants can draw simultaneously and see each other's cursors, colors, and global undo/redo actions in real time.

## Quick Start (works with npm install && npm start)

Prerequisites
- Node.js (Recommended: v16+)
- npm

1. Install dependencies
```bash
npm install
```

2. Start the server
```bash
npm start
```

3. Open in browser
- http://localhost:3000

If you need a different port set the PORT environment variable:
```bash
set PORT=4000 && npm start
```

## How to test with multiple users

- Open http://localhost:3000 in two or more browser tabs.
- Use different browsers or incognito/private windows to simulate distinct users (prevents shared session data).
- To test across devices on the same network, open http://<your-machine-ip>:3000 from other devices.
- Test scenarios:
  - Draw simultaneously from multiple clients and observe live updates.
  - Move cursors and verify real-time cursor labels and colors.
  - Use the eraser and color/width controls and confirm updates propagate to all clients.
  - Use global Undo / Redo buttons to verify the latest global operations are undone/redone across all connected clients.

## Features (high level)
- Smooth drawing with mouse/touch
- Adjustable color and stroke width
- Eraser tool
- Real-time synchronization via Socket.io
- Per-user cursor labels and colors
- Global undo / redo
- Dark-mode UI

## Known limitations / bugs

- Global-only Undo/Redo: undo/redo operates on the global history (not per-user). This may be surprising for users expecting local undo.
- No persistence: canvas state is memory-only and will reset when the server restarts.
- Not optimized for very long sessions or extremely large histories — performance may degrade over time.
- Mobile touch support is present but not fully polished (gesture/UX inconsistencies possible).
- Possible cursor jitter or delayed events under high network latency.
- Concurrent large updates may cause temporary desynchronization; reconnecting a client currently reloads state but may miss very recent transient operations in edge cases.

If you encounter a reproducible bug, include steps-to-reproduce, browser/OS, and server logs when filing an issue.

## Project structure
collaborative-canvas/
- client/
  - index.html
  - style.css
  - main.js
  - canvas.js
  - websocket.js
- server/
  - server.js
  - rooms.js
  - drawing-state.js
- package.json
- README.md
- ARCHITECTURE.md

## Time spent on the project
- Time spent: approximately two days to finish the coding and documentation

## Testing notes & tips
- Open multiple windows and draw simultaneously to validate synchronization.
- Use browser devtools console to view Socket.io logs and troubleshoot event flow.
- For local network testing, ensure your firewall allows inbound connections for the port used.

## License & attribution
- Built with Node.js, Express, and Socket.io. Feel free to adapt for assignments or demos. Add license text as needed.
