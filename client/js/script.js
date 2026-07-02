const socket = io();
const username = localStorage.getItem('chat_username');
const currentRoom = localStorage.getItem('current_chat_room') || 'Global Lobby';

// Redirect back to login if session data doesn't exist
if (!username) {
    window.location.href = 'index.html';
}

// Update UI Header Title immediately
document.getElementById('roomTitle').innerText = `💬 ${currentRoom}`;

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const logoutBtn = document.getElementById('logoutBtn');
const typingIndicator = document.getElementById('typingIndicator');

let typingTimeout;

// 1. Tell the server to drop us into our specific room channel
socket.emit('join_room', { username, room: currentRoom });

// Send structured message payload specifically tied to this room context
function emitMessage() {
    const text = messageInput.value.trim();
    if (text) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Include the room name inside the object payload
        socket.emit('send_message', { username, text, time, room: currentRoom });
        messageInput.value = '';
        
        // Clear typing status once sent
        socket.emit('typing', { username, room: currentRoom, isTyping: false });
    }
}

// Fire typing tracking events to the server while modifying input values
messageInput.addEventListener('input', () => {
    socket.emit('typing', { username, room: currentRoom, isTyping: true });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('typing', { username, room: currentRoom, isTyping: false });
    }, 1500);
});

sendBtn.addEventListener('click', emitMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') emitMessage();
});

// Render incoming targeted room broadcasts inside styled text bubbles
socket.on('receive_message', (data) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message-item');
    
    const isSelf = data.username === username;
    if (isSelf) msgDiv.classList.add('self');
    
    msgDiv.innerHTML = `
        ${!isSelf ? `<span class="msg-user">${data.username}</span>` : ''}
        <span class="msg-text">${data.text}</span>
        <span class="msg-time">${data.time}</span>
    `;
    
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Render incoming system alerts (e.g., "User has joined the chat")
socket.on('system_message', (text) => {
    const sysDiv = document.createElement('div');
    sysDiv.style.cssText = "text-align: center; color: #777; font-size: 12px; margin: 8px 0; font-style: italic;";
    sysDiv.innerText = text;
    messagesContainer.appendChild(sysDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

// Render typing state changes matching our specific room context
socket.on('user_typing', (data) => {
    if (data.isTyping) {
        typingIndicator.innerText = `${data.username} is typing...`;
    } else {
        typingIndicator.innerText = '';
    }
});

// Clear targeted room session parameter and bounce user backwards
logoutBtn.addEventListener('click', () => {
    window.location.href = 'home.html';
});
