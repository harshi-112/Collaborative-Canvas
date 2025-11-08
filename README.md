# Collaborative Canvas — Real-Time Multi-User Drawing App

[Live demo (production)](https://collaborative-canvas-production-ba6b.up.railway.app) — open the demo to try a deployed instance

A real-time, collaborative drawing canvas built with Node.js, Express and Socket.io. Multiple participants can draw simultaneously and see each other's cursors, colors, and global undo/redo actions in real time.

Quick links
- Live demo: https://collaborative-canvas-production-ba6b.up.railway.app
- Local app (after start): http://localhost:3000

---

## Quick Start (minutes)

Requirements
- Node.js v16+ recommended
- npm (bundled with Node)

1. Clone and install
```bash
git clone <your-repo-url>
cd Collaborative-Canvas
npm install
```

2. Start (development / local)
- Windows (PowerShell / CMD):
```powershell
set PORT=3000 && npm start
```
- macOS / Linux:
```bash
PORT=3000 npm start
```

3. Open in browser
- Local: http://localhost:3000
- Or visit the production demo: https://collaborative-canvas-production-ba6b.up.railway.app

Notes
- If you omit PORT, the app defaults to 3000.
- The server prints both localhost and network URLs when it starts (useful for testing from other devices on your LAN).

---

## How to test with multiple users

Recommended quick tests to validate real-time sync and UX:

- Open multiple tabs:
  - Open http://localhost:3000 in two or more tabs in the same browser.
  - For isolated sessions, use incognito/private windows or different browsers.

- Cross-device / network:
  - From another device on the same network, visit http://<your-machine-ip>:3000 (the server logs this when started).
  - Or use the live demo URL above to test globally.

- Test checklist:
  - Draw simultaneously from multiple clients — strokes should appear live on all clients.
  - Verify per-user cursor labels and colors move in real time.
  - Change color and stroke width; verify updates propagate.
  - Use the eraser tool and confirm erasures sync.
  - Press Global Undo / Redo — these apply across all connected clients.
  - Reload a client tab — it should request and replay the full canvas state.

Debugging tips
- Open browser devtools Console to inspect Socket.io logs and debug events.
- If clients appear desynced, refresh the client to trigger a full state request.

---

## Features (high level)

- Smooth drawing with mouse & touch
- Adjustable color and stroke width
- Eraser tool
- Real-time synchronization via Socket.io
- Per-user cursor labels and colors
- Global undo / redo
- Dark-mode UI

---

## WebSocket & State (short summary)

- Real-time messages: stroke_start, stroke_chunk, stroke_end, cursor updates, undo, redo, request_state, full_state.
- Server holds an in-memory ordered operation list (ops). Completed strokes become ops that can be toggled removed/restored by global undo/redo.
- On reconnect or page load clients request full_state and replay ops.

---

## Known limitations / bugs

Please read before filing issues — this helps set expectations.

- Global-only Undo/Redo:
  - Undo/Redo is global (affects everyone) and operates on the server-side linear op history. There is no per-user local undo.
- No persistence:
  - State is memory-only. Restarting the server clears the canvas.
- Not optimized for extremely large histories:
  - Very long sessions may slow down reconnect replay and redraw performance.
- Mobile/touch UX:
  - Touch support exists, but gesture handling and UX may not be fully polished.
- High-latency artifacts:
  - Cursor jitter or delayed events possible under poor network conditions.
- Edge-case reconnection race:
  - In rare cases reconnecting clients may miss very recent transient updates between save and reconnect.

If you find a reproducible bug, include steps-to-reproduce, browser/OS, and server logs when filing an issue.

---

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
- ARCHITECTURE_DIAGRAM.png

---

## Time spent on the project

- Development & docs: approximately two days (estimate: ~16–24 hours).

---

## Demo / Try it now

- Production demo: https://collaborative-canvas-production-ba6b.up.railway.app
- Run locally and share your machine's LAN URL (the server prints it) to allow teammates/devices to join your local session.

---

## Contributing & development notes

- Want to improve features or fix issues?
  - Fork the repo, create a branch, make changes, open a PR.
- Tests:
  - This prototype currently has no automated test suite; add unit/integration tests as needed.
- Suggested improvements:
  - Add persistent storage/snapshots, per-user undo, performance tuning for long sessions, and better mobile UX.

---

## License & attribution

- Built with Node.js, Express, and Socket.io.
- Add a LICENSE file to declare terms for reuse.

---

