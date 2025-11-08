// Handles drawing and replaying operations
(function(){
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0;
  let drawing = false;
  let currentStroke = null; // {id, color, width, points:[]}
  const ops = []; // local copy of operations (replayed)

  function resize(){
    const dpr = window.devicePixelRatio || 1;
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    redraw();
  }

  window.addEventListener('resize', resize);
  resize();

  function clear(){ ctx.clearRect(0,0,canvas.width,canvas.height); }

  function drawStrokeOnCtx(stroke){
    if(!stroke || !stroke.points || stroke.points.length===0) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    if(stroke.points.length === 1 || (stroke.points.length === 2 && stroke.points[0].x === stroke.points[1].x && stroke.points[0].y === stroke.points[1].y)){
      const p = stroke.points[stroke.points.length - 1];
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, stroke.width / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.color;
      ctx.fill();
      return;
    }
    ctx.beginPath();
    const p0 = stroke.points[0];
    ctx.moveTo(p0.x * w, p0.y * h);
    for(let i=1;i<stroke.points.length;i++){
      const p = stroke.points[i];
      ctx.lineTo(p.x * w, p.y * h);
    }
    ctx.stroke();
  }

  function redraw(){
    clear();
    for(const op of ops){ if(!op.removed) drawStrokeOnCtx(op); }
  }

  // Public API used by main.js and websocket handlers
  window.CanvasAPI = {
    startStroke(meta){
      drawing = true;
      currentStroke = { id: meta.id, color: meta.color, width: meta.width, points: [] };
    },
    pushPoint(pt){ if(!currentStroke) return; currentStroke.points.push(pt); const prev = currentStroke.points[currentStroke.points.length-2] || pt; drawStrokeOnCtx({ ...currentStroke, points: [prev, pt] }); },
    endStroke(){ if(!currentStroke) return; ops.push(currentStroke); window.dispatchEvent(new CustomEvent('local_op', { detail: currentStroke })); currentStroke = null; drawing=false; },
    applyRemoteChunk(id, chunk){
      // find op by id or create
      let op = ops.find(o=>o.id===id);
      if(!op){
        const color = chunk.color ?? '#000000';
        const width = chunk.width ?? 2;
        op = { id, color, width, points: [], removed: false };
        ops.push(op);
      } else {
        if(chunk.color && !op.color) op.color = chunk.color;
        if(chunk.width && !op.width) op.width = chunk.width;
      }

      const prevPoint = op.points.length ? op.points[op.points.length - 1] : null;
      op.points.push(...chunk.points);

      const drawPoints = [];
      if(prevPoint) drawPoints.push(prevPoint);
      for(const p of chunk.points) drawPoints.push(p);

      if(drawPoints.length === 1){
        // duplicate the point so drawStrokeOnCtx renders a dot
        drawPoints.push(drawPoints[0]);
      }

      if(drawPoints.length > 0){
        drawStrokeOnCtx({ color: op.color, width: op.width, points: drawPoints });
      }
    },
    setFullState(fullOps){
      // fullOps is array of {id,color,width,points,removed}
      ops.length = 0; for(const o of fullOps) ops.push(o);
      redraw();
    },
    applyRemove(opId){
      const op = ops.find(o=>o.id===opId);
      if(op) op.removed = true;
      redraw();
    },
    applyRestore(op){
      const existing = ops.find(o=>o.id===op.id);
      if(existing){ existing.removed = false; } else ops.push(op);
      redraw();
    }
  };
})();

