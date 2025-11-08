const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Rooms = require('./rooms');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const rooms = new Rooms();

app.use(express.static(__dirname + '/../client'));

io.on('connection', (socket)=>{
  console.log('conn', socket.id);
  let currentRoom = 'default';

  socket.on('join_room', ({room, name})=>{
    currentRoom = room || 'default';
    socket.join(currentRoom);
    rooms.ensureRoom(currentRoom);
    const label = rooms.addUser(currentRoom, socket.id, name);
    io.to(currentRoom).emit('users', rooms.getUsers(currentRoom));
    socket.emit('user_label', { label });
  });

  socket.on('request_state', ()=>{ const state = rooms.getState(currentRoom); socket.emit('full_state', { ops: state.ops }); });

  socket.on('stroke_start', (meta)=>{ rooms.ensureRoom(currentRoom); rooms.startOp(currentRoom, meta.id, meta); io.to(currentRoom).emit('stroke_chunk', { id: meta.id, points: [], color: meta.color, width: meta.width }); });

  socket.on('stroke_chunk', (chunk)=>{ // {id, points, color?, width?}
    rooms.appendPoints(currentRoom, chunk.id, chunk.points, chunk.color, chunk.width);
    io.to(currentRoom).emit('stroke_chunk', chunk);
  });

  socket.on('stroke_end', ({id})=>{ const op = rooms.finishOp(currentRoom, id); io.to(currentRoom).emit('stroke_end', op); });

  socket.on('undo', ()=>{
    const opId = rooms.undo(currentRoom);
    if(opId) io.to(currentRoom).emit('undo', { opId });
  });

  socket.on('redo', ()=>{
    const op = rooms.redo(currentRoom);
    if(op) io.to(currentRoom).emit('redo', { op });
  });

  socket.on('cursor', (c)=>{
    const label = rooms.getUserLabel(currentRoom, socket.id);
    if(label == null) return;
    socket.to(currentRoom).emit('cursor', { id: socket.id, label, x: c.x, y: c.y });
  });

  socket.on('cursor_hide', ()=>{
    socket.to(currentRoom).emit('cursor_leave', { id: socket.id });
  });

  socket.on('disconnect', ()=>{
    rooms.removeUser(currentRoom, socket.id);
    io.to(currentRoom).emit('users', rooms.getUsers(currentRoom));
    socket.to(currentRoom).emit('cursor_leave', { id: socket.id });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('listening', PORT));

