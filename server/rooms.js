// Simple in-memory rooms manager. Each room has: ops[], redoStack[], users:Map
const DrawingState = require('./drawing-state');

class Rooms {
  constructor(){ this._rooms = new Map(); }

  ensureRoom(name){
    if(!this._rooms.has(name)){
      this._rooms.set(name, {
        state: new DrawingState(),
        users: new Map()
      });
    }
  }

  startOp(room, id, meta){ this.ensureRoom(room); this._rooms.get(room).state.startOp(id, meta); }

  appendPoints(room, id, points, color, width){ this.ensureRoom(room); this._rooms.get(room).state.appendPoints(id, points, color, width); }

  finishOp(room, id){ return this._rooms.get(room).state.finishOp(id); }

  getState(room){ this.ensureRoom(room); return this._rooms.get(room).state.getFullState(); }

  undo(room){ return this._rooms.get(room).state.undo(); }

  redo(room){ return this._rooms.get(room).state.redo(); }

  addUser(room, id, requestedName){
    this.ensureRoom(room);
    const data = this._rooms.get(room);
    if(data.users.has(id)) return data.users.get(id);

    const label = this._assignName(data, requestedName);
    data.users.set(id, label);
    return label;
  }

  removeUser(room, id){
    this.ensureRoom(room);
    const data = this._rooms.get(room);
    data.users.delete(id);
  }

  getUsers(room){
    this.ensureRoom(room);
    return Array.from(this._rooms.get(room).users.values());
  }

  getUserLabel(room, id){
    this.ensureRoom(room);
    return this._rooms.get(room).users.get(id) || null;
  }

  _assignName(roomData, requested){
    const base = this._sanitizeName(requested) || 'Guest';
    const existing = new Set(Array.from(roomData.users.values()).map((name)=>name.toLowerCase()));
    if(!existing.has(base.toLowerCase())) return base;

    let counter = 2;
    let candidate = '';
    while(counter < 1000){
      candidate = `${base} (${counter++})`;
      if(!existing.has(candidate.toLowerCase())) return candidate;
    }

    return `${base} (${Date.now() % 1000})`;
  }

  _sanitizeName(value){
    if(!value) return '';
    return value.replace(/\s+/g, ' ').trim().slice(0, 32);
  }
}

module.exports = Rooms;

