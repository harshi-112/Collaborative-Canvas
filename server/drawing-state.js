// operation-based state: ops[] where each op is {id,color,width,points,removed}
module.exports = class DrawingState {
  constructor(){ this.ops = []; this._opMap = new Map(); this.redoStack = []; }

  startOp(id, meta){ if(this._opMap.has(id)) return; const op = { id, color: meta.color, width: meta.width, points: [], removed:false }; this._opMap.set(id, op); this.ops.push(op); }

  appendPoints(id, pts, color, width){
    let op = this._opMap.get(id);
    if(!op){ op = { id, color: color||'#000', width: width||2, points: [], removed:false }; this._opMap.set(id, op); this.ops.push(op); }
    for(const p of pts) op.points.push(p);
  }

  finishOp(id){ return this._opMap.get(id); }

  getFullState(){ return { ops: this.ops.slice() }; }

  undo(){
    for(let i=this.ops.length-1;i>=0;i--){ const op=this.ops[i]; if(!op.removed){ op.removed = true; this.redoStack.push(op); return op.id; } }
    return null;
  }

  redo(){ const op = this.redoStack.pop(); if(op){ op.removed = false; return op; } return null; }
};

