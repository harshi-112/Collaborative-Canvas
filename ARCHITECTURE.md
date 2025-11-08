# ARCHITECTURE — Collaborative Canvas Prototype

This document describes the architecture decisions for the Collaborative Canvas prototype: how drawing events flow, the WebSocket protocol, undo/redo strategy, performance optimizations, and conflict resolution.

## 1) Data Flow Diagram — drawing events (high level)

Client (pointer) -> Client captures pointer events
  - stroke_start (new op id, color, width)
  - stroke_chunk (batched points)
  - stroke_end (finish op)

Client -> Server
  - Events are emitted to server via Socket.io

Server -> Other Clients
  - Server appends to in-memory ops list, broadcasts stroke_chunk (and start/end)
  - Other clients render incoming chunks immediately

Reconnect / load:
  - Client -> request_state
  - Server -> full_state (ops array)
  - Client replays ops to reconstruct canvas

Simple ASCII diagram:
Client A  --(stroke_start/chunk/end)-->  Server  --(broadcast chunks)-->  Client B/C
Client X  --(request_state)------------->  Server  --(full_state: ops)-->  Client X

## Architecture diagram

Embedded PNG (renders on GitHub/GitLab/Markdown viewers). Place the file `ARCHITECTURE_DIAGRAM.png` in the repository root (same folder as this markdown).

![Collaborative Canvas architecture diagram](./ARCHITECTURE_DIAGRAM.png)

Figure: Data flow — client stroke events -> server -> broadcast to peers. Also shows request_state/full_state flow for reconnects.

## 2) WebSocket Protocol (messages and payloads)

- join_room
  - client -> server: { room: string, name: string }
  - server validates and returns ack/join metadata

- request_state
  - client -> server: {}
  - server -> client: { ops: [ op ] }  (full replayable operation list)

- full_state
  - server -> client: { ops: [ op ] }

- stroke_start
  - client -> server: { id: string, color: string, width: number, tool?: 'pen'|'eraser' }

- stroke_chunk
  - client -> server: { id: string, points: [{x:number,y:number}], color?: string, width?: number }
  - server broadcasts same shape to other clients

- stroke_end
  - client -> server: { id: string } (marks op complete on server)

- undo
  - client -> server: {}
  - server -> all: { type: 'undo', opId: string }

- redo
  - client -> server: {}
  - server -> all: { type: 'redo', op: { id, points, color, width, removed:false } }

- cursor
  - client -> server: { x:number, y:number, id?:string }
  - server -> broadcast: { id, x, y, color, name }

Notes:
- Op shape: { id, points: [{x,y}], color, width, removed?: boolean, createdAt?: number }
- stroke_chunk may arrive multiple times per op; server buffers/appends until stroke_end.

## 3) Undo / Redo strategy (global operation-based)

- Model: server maintains a linear operation list (ops) and a redo stack.
- Each completed stroke (after stroke_end) becomes an op with id and accumulated points.
- Undo:
  - Server finds the last op where removed !== true, sets op.removed = true, pushes op onto redoStack.
  - Server broadcasts { type: 'undo', opId }.
  - Clients mark the op removed and trigger a redraw (or remove that op from visible render).
- Redo:
  - Server pops redoStack, sets op.removed = false, re-inserts/retains op, broadcasts { type: 'redo', op }.
  - Clients reapply the op (append to in-memory list if needed) and render.
- Rationale:
  - Global undo/redo keeps behavior consistent for all clients.
  - Simpler and deterministic compared to per-user undo (avoids ownership/CRDT complexity).

## 4) Performance decisions (why and what)

- Streamed point batches:
  - Send small batches of points (stroke_chunk) while drawing so remote clients see strokes in-progress.
  - Reduces latency and perceived responsiveness.

- Incremental rendering:
  - Clients render incoming chunks immediately, avoiding a full redraw on every chunk.
  - Full redraw is done only on resize, undo/redo, or when applying removals/restores.

- Batching & sizing:
  - Tune chunk size to balance network throughput and smoothness (e.g., 5–20 points per chunk depending on sampling rate).

- Memory-only state (prototype):
  - Ops are kept in memory for simplicity and replay speed.
  - For long sessions: recommend snapshots, periodic persistence, or truncation to limit replay cost.

- Minimizing work on hot path:
  - Keep server work per event small (append, mark removed, broadcast) to maintain low latency.

## 5) Conflict resolution (simultaneous drawing)

- Ordering strategy:
  - Server serializes events by arrival order (single authoritative source). Operations are ordered by server receipt and/or createdAt timestamp.
  - Last-write ordering per-server arrival time — deterministic and simple.

- Implications:
  - Concurrent strokes are interleaved by arrival order and both are preserved as separate ops.
  - No per-stroke merging or CRDT semantics; layering is canvas-order based.

- When this may fail:
  - If per-user local undo/ownership is required, this model is insufficient; consider:
    - CRDTs/OT for cooperative editing semantics, or
    - Per-user stacks with merge policies (more complex).

## 6) Improvements / future considerations

- Persistence & snapshots: store periodic snapshots and op deltas to speed reconnects and bound memory.
- Per-user undo: implement ownership metadata + CRDT/OT to support independent local undo.
- Reliability: acknowledgements for critical messages (start/end) to avoid lost op state.
- Compression: compress large point batches for lower bandwidth.
- Sharding/rooms: scale server state per room and add persistence for long-lived rooms.

## 7) Implementation notes (quick reminders)

- Keep ops immutable where practical (create new op objects when restoring).
- Use op.removed boolean to avoid reindexing; clients can filter during redraw.
- Ensure stroke ids are globally unique (UUIDs) to avoid id collisions across clients.
- Validate sizes/point ranges on server to avoid malformed data impacting replay.

