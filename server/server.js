const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, '../client')));

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Room Isolation Logic: Puts the user socket instance into an isolated channel pipeline
    socket.on('join_room', (data) => {
        socket.join(data.room);
        console.log(`User [${data.username}] joined channel room: ${data.room}`);
        
        // Broadcasts a specialized notification alert solely inside that room group
        socket.to(data.room).emit('system_message', `${data.username} joined the chat`);
    });

    // Listen for incoming messages and target them strictly to their originating room boundary
    socket.on('send_message', (data) => {
        io.to(data.room).emit('receive_message', data); 
    });

    // Listen for typing events and broadcast strictly to other members of that room channel
    socket.on('typing', (data) => {
        socket.to(data.room).emit('user_typing', data);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

