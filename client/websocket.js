// Minimal socket wrapper
const socket = io(); // default connects to same host

function on(e, cb){ socket.on(e, cb); }

function emit(e, d){ socket.emit(e, d); }

window.ws = { on, emit, socket };

