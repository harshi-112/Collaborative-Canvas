// glue between UI, canvas and websocket
(function(){
  const colorInput = document.getElementById('color');
  const widthInput = document.getElementById('width');
  const eraserBtn = document.getElementById('eraser');
  const undoBtn = document.getElementById('undo');
  const redoBtn = document.getElementById('redo');
  const userListEl = document.getElementById('user-list');
  const userCountEl = document.getElementById('user-count');
  const selfLabelEl = document.getElementById('self-label');
  const roomNameEl = document.getElementById('room-name');
  const cursorLayer = document.getElementById('cursor-layer');
  const canvasEl = document.getElementById('canvas');
  const nameModal = document.getElementById('name-modal');
  const nameForm = document.getElementById('name-form');
  const nameInput = document.getElementById('name-input');

  let isEraser = false;
  let userId = null;
  let desiredName = null;
  let selfLabel = null;

  const cursorMap = new Map();
  let lastEmit = 0;
  const emitInterval = 16; // ms
  let lastCursorEmit = 0;
  const cursorEmitInterval = 50; // ms

  function sanitizeName(str){
    return (str || '').replace(/\s+/g, ' ').trim().slice(0, 32);
  }

  function showNameModal(){
    if(!nameModal) return;
    nameModal.classList.remove('hidden');
    if(nameInput){
      nameInput.value = desiredName || '';
      requestAnimationFrame(()=> nameInput.focus());
    }
  }

  function hideNameModal(){
    if(!nameModal) return;
    nameModal.classList.add('hidden');
  }

  nameForm?.addEventListener('submit', (event)=>{
    event.preventDefault();
    const value = sanitizeName(nameInput?.value);
    if(!value){
      if(nameInput){
        nameInput.focus();
        nameInput.classList.add('input-error');
      }
      return;
    }
    nameInput?.classList.remove('input-error');
    desiredName = value;
    hideNameModal();
    attemptJoin();
  });

  nameInput?.addEventListener('input', ()=> nameInput.classList.remove('input-error'));

  function attemptJoin(){
    const socketInstance = ws.socket;
    if(!desiredName || !socketInstance || socketInstance.disconnected) return;
    ws.emit('join_room', { room: 'default', name: desiredName });
    ws.emit('request_state');
    if(roomNameEl) roomNameEl.textContent = 'default';
  }

  function norm(e){
    const rect = canvasEl.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }

  const clamp = (v)=> Math.max(0, Math.min(1, v));

  function ensureCursor(id, label, isSelf){
    if(!cursorLayer || !label) return null;
    let entry = cursorMap.get(id);
    if(!entry){
      const el = document.createElement('div');
      el.className = 'cursor-indicator';
      const dot = document.createElement('span');
      dot.className = 'cursor-dot';
      const badge = document.createElement('span');
      badge.className = 'cursor-label';
      el.appendChild(dot);
      el.appendChild(badge);
      cursorLayer.appendChild(el);
      entry = { el, badge, x: 0, y: 0 };
      cursorMap.set(id, entry);
    }
    entry.badge.textContent = label;
    entry.el.classList.toggle('self', Boolean(isSelf));
    return entry;
  }

  function positionCursor(entry, x, y){
    if(!cursorLayer || !entry) return;
    const width = cursorLayer.clientWidth;
    const height = cursorLayer.clientHeight;
    entry.el.style.transform = `translate(${x * width}px, ${y * height}px)`;
    entry.x = x;
    entry.y = y;
  }

  function renderCursor(id, label, x, y, isSelf=false){
    if(label == null) return;
    const entry = ensureCursor(id, label, isSelf);
    if(!entry) return;
    positionCursor(entry, clamp(x), clamp(y));
  }

  function removeCursor(id){
    const entry = cursorMap.get(id);
    if(!entry) return;
    if(entry.el.parentElement) entry.el.parentElement.removeChild(entry.el);
    cursorMap.delete(id);
  }

  function refreshCursors(){
    if(!cursorLayer) return;
    const width = cursorLayer.clientWidth;
    const height = cursorLayer.clientHeight;
    cursorMap.forEach((entry)=>{
      entry.el.style.transform = `translate(${entry.x * width}px, ${entry.y * height}px)`;
    });
  }

  window.addEventListener('resize', refreshCursors);

  function updateOwnCursor(pt, force=false){
    const socketInstance = ws.socket;
    if(!selfLabel || !socketInstance) return;
    renderCursor(socketInstance.id, selfLabel, pt.x, pt.y, true);
    const now = performance.now();
    if(force || now - lastCursorEmit > cursorEmitInterval){
      ws.emit('cursor', { x: pt.x, y: pt.y });
      lastCursorEmit = now;
    }
  }

  canvasEl.addEventListener('pointerdown', (ev)=>{
    if(!selfLabel){
      ev.preventDefault();
      showNameModal();
      return;
    }

    canvasEl.setPointerCapture(ev.pointerId);
    const socketInstance = ws.socket;
    userId = userId || socketInstance?.id || null;
    const id = Math.random().toString(36).slice(2,9);
    const meta = { id, color: isEraser ? '#ffffff' : colorInput.value, width: parseInt(widthInput.value, 10) };
    window.CanvasAPI.startStroke(meta);
    ws.emit('stroke_start', meta);
    const p = norm(ev);
    window.CanvasAPI.pushPoint(p);
    ws.emit('stroke_chunk', { id, points: [p], color: meta.color, width: meta.width });
    updateOwnCursor(p, true);
    lastEmit = performance.now();

    function moveHandler(e){
      const pt = norm(e);
      window.CanvasAPI.pushPoint(pt);
      const now = performance.now();
      if(now - lastEmit > emitInterval){
        ws.emit('stroke_chunk', { id, points: [pt] });
        lastEmit = now;
      }
      updateOwnCursor(pt);
    }

    function upHandler(e){
      const pt = norm(e);
      window.CanvasAPI.pushPoint(pt);
      ws.emit('stroke_chunk', { id, points: [pt] });
      ws.emit('stroke_end', { id });
      window.CanvasAPI.endStroke();
      updateOwnCursor(pt, true);
      canvasEl.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
    }

    canvasEl.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler);
  });

  canvasEl.addEventListener('pointermove', (e)=>{
    if(!selfLabel) return;
    if(typeof canvasEl.hasPointerCapture === 'function' && canvasEl.hasPointerCapture(e.pointerId)) return;
    const pt = norm(e);
    updateOwnCursor(pt);
  });

  canvasEl.addEventListener('pointerleave', ()=>{
    const socketInstance = ws.socket;
    if(!selfLabel || !socketInstance) return;
    removeCursor(socketInstance.id);
    ws.emit('cursor_hide');
  });

  eraserBtn.addEventListener('click', ()=>{
    isEraser = !isEraser;
    eraserBtn.textContent = isEraser ? 'Eraser ✓' : 'Eraser';
  });
  undoBtn.addEventListener('click', ()=> ws.emit('undo'));
  redoBtn.addEventListener('click', ()=> ws.emit('redo'));

  ws.on('connect', ()=>{
    const socketInstance = ws.socket;
    userId = socketInstance ? socketInstance.id : null;
    attemptJoin();
  });

  ws.on('user_label', ({ label })=>{
    selfLabel = label;
    desiredName = label;
    if(selfLabelEl) selfLabelEl.textContent = label;
  });

  ws.on('users', (list)=>{
    userListEl.textContent = list.length ? list.join(', ') : '—';
    if(userCountEl) userCountEl.textContent = String(list.length);
  });

  ws.on('stroke_chunk', (payload)=>{
    window.CanvasAPI.applyRemoteChunk(payload.id, { points: payload.points, color: payload.color, width: payload.width });
  });

  ws.on('stroke_end', ()=>{ /* remote strokes already applied */ });

  ws.on('full_state', (state)=>{
    window.CanvasAPI.setFullState(state.ops);
  });

  ws.on('undo', ({ opId })=>{
    window.CanvasAPI.applyRemove(opId);
  });

  ws.on('redo', ({ op })=>{
    window.CanvasAPI.applyRestore(op);
  });

  ws.on('cursor', ({ id, label, x, y })=>{
    renderCursor(id, label, x, y);
  });

  ws.on('cursor_leave', ({ id })=>{
    removeCursor(id);
  });

  ws.on('reconnect', ()=>{
    attemptJoin();
  });

  if(!desiredName) showNameModal();
})();

