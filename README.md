# Collaborative Canvas — Real-Time Multi-User Drawing App 🎨🕸️

A fast, lightweight collaborative drawing canvas built with Node.js, Express and Socket.io. Multiple participants can draw simultaneously and see each other's cursors, colors, and global undo/redo actions in real time.

Quick links
- Local app (after start): http://localhost:3000
- Repo: (this project)

---

## Demo / Try it now ▶️

Check the live production demo to try a deployed instance (recommended for quick sharing with collaborators):
🔗 https://collaborative-canvas-production-ba6b.up.railway.app

---

## Quick Start — run locally (minutes) 🚀

Requirements
- Node.js v16+ recommended
- npm (bundled with Node)

1) Clone & install
```bash
git clone <your-repo-url>
cd Collaborative-Canvas
npm install
```

2) Start the server
- Windows (PowerShell / CMD)
```powershell
set PORT=3000 && npm start
```
- macOS / Linux
```bash
PORT=3000 npm start
```

3) Open in browser
- Local: http://localhost:3000
- The server will also print a LAN URL (e.g. http://192.168.x.x:3000) — use that to let other devices on your network join.

Tip: to run on a different port, set PORT before starting.

---

## How to test with multiple users 👥

Quick ways to simulate multiple participants:

- Multiple tabs: open http://localhost:3000 in two or more tabs.
- Isolated sessions: use incognito/private windows or different browsers so each tab is a separate user.
- Cross-device: from another device on the same LAN, open the server's network URL printed at startup (http://<your-machine-ip>:<port>).
- Online: share the demo link above to test globally.

Checklist for testing
- Draw simultaneously from several clients — strokes should appear live on every client.
- Observe per-user cursor labels and colors move in real time.
- Change color / stroke width and ensure updates propagate.
- Use eraser — confirm erasures sync.
- Press Global Undo / Redo — confirm actions affect all connected clients.
- Reload a client — it should request and replay the full canvas state.

Debugging tips
- Open browser DevTools Console to inspect Socket.io events and logs.
- If clients look desynced, reload the page to trigger a full_state request.

---

## Features ✨

- Smooth drawing with mouse & touch
- Adjustable color and stroke width
- Eraser tool
- Real-time sync via Socket.io (live cursor + stroke streaming)
- Per-user cursor labels and colors
- Global undo / redo
- Dark-mode UI

---

## WebSocket & State (summary) 🔁

- Key messages: stroke_start, stroke_chunk, stroke_end, cursor, undo, redo, request_state, full_state.
- Server stores an in-memory ordered op list (ops). Completed strokes become ops; undo/redo toggles op.removed.
- Clients request full_state on connect/reconnect and replay ops to reconstruct the canvas.

---

## Known limitations / bugs ⚠️

Please read before filing issues.

- Global-only Undo/Redo — operations are global (server-side linear history). There is no per-user local undo.
- No persistence — state is memory-only. Restarting the server clears the canvas.
- Replay & large histories — very long sessions can slow down reconnect replay and redraw performance.
- Mobile UX — touch support exists but gestures and polish may be incomplete.
- High-latency artifacts — cursor jitter or delayed events under poor network conditions.
- Edge-case reconnection race — in rare cases very recent transient updates may be missed during reconnect.

When filing issues include steps-to-reproduce, browser/OS, and server logs.

---

## Project structure 🗂️

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

## Time spent on the project ⏱️

- Planning & Research: 6–8 hours

- Development (coding, debugging, feature implementation): 25–30 hours

- UI/UX Design: 4–5 hours

- Documentation & Testing: 5–7 hours

- Total Estimated Time: ~48 hours
---

## Contributing & development notes 🛠️

- Fork → branch → PR. Keep changes focused and include screenshots or short recordings for UI/UX changes.
- Suggested improvements: add persistence/snapshots, per-user undo, automated tests, mobile UX polish, and bandwidth optimizations.

---


