const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const targetUserId = urlParams.get('userId');

let currentUser = null;
let targetUser = null;

// DOM Elements
const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const typingIndicator = document.getElementById('typing-indicator');
const headerAvatar = document.getElementById('header-avatar');
const headerName = document.getElementById('header-name');
const headerStatus = document.getElementById('header-status');

async function init() {
    if (!targetUserId) {
        window.location.href = '/home.html';
        return;
    }

    const authRes = await fetch('/api/auth/me');
    if (!authRes.ok) {
        window.location.href = '/login.html';
        return;
    }
    currentUser = await authRes.json();
    socket.emit('join', currentUser._id);

    // Load target user info
    // We'll search for them or get from friends list
    const friendsRes = await fetch('/api/users/friends');
    const friends = await friendsRes.json();
    targetUser = friends.find(f => f._id === targetUserId);
    
    if (targetUser) {
        headerAvatar.src = targetUser.profilePic;
        headerName.textContent = targetUser.name;
        headerStatus.textContent = targetUser.status || 'offline';
    }

    loadMessages();
}

async function loadMessages() {
    const res = await fetch(`/api/messages/${targetUserId}`);
    const messages = await res.json();
    messagesContainer.innerHTML = '';
    messages.forEach(msg => appendMessage(msg));
    scrollToBottom();
}

function appendMessage(msg) {
    const div = document.createElement('div');
    div.className = `message ${msg.sender === currentUser._id ? 'sent' : 'received'}`;
    div.innerHTML = `
        <div>${msg.content}</div>
        <span class="message-time">${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    `;
    messagesContainer.appendChild(div);
    scrollToBottom();
}

messageForm.onsubmit = async (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    if (!content) return;

    const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            receiverId: targetUserId,
            content,
            type: 'text'
        })
    });

    const msg = await res.json();
    appendMessage(msg);
    socket.emit('sendMessage', { receiverId: targetUserId, message: msg });
    messageInput.value = '';
};

// Typing
messageInput.oninput = () => {
    socket.emit('typing', { receiverId: targetUserId, isTyping: true, senderName: currentUser.name });
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
        socket.emit('typing', { receiverId: targetUserId, isTyping: false });
    }, 2000);
};

socket.on('receiveMessage', (msg) => {
    if (msg.sender === targetUserId) {
        appendMessage(msg);
    }
});

socket.on('userTyping', (data) => {
    if (data.isTyping) {
        typingIndicator.textContent = `${data.senderName} is typing...`;
    } else {
        typingIndicator.textContent = '';
    }
});

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Voice Recording (Basic)
const voiceBtn = document.getElementById('voice-btn');
let mediaRecorder;
let audioChunks = [];

voiceBtn.onclick = async () => {
    if (!mediaRecorder) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            // In a real app, you'd upload this blob to the server
            alert("Voice message recorded (simulated upload)");
            audioChunks = [];
        };

        mediaRecorder.start();
        voiceBtn.style.color = 'red';
        voiceBtn.textContent = '⏹️';
    } else {
        mediaRecorder.stop();
        mediaRecorder = null;
        voiceBtn.style.color = 'var(--accent-color)';
        voiceBtn.textContent = '🎤';
    }
};

init();
