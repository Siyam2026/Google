const socket = io();
let currentUser = null;
let selectedUser = null;
let peer = null;
let localStream = null;

// DOM Elements
const myAvatar = document.getElementById('my-avatar');
const myName = document.getElementById('my-name');
const logoutBtn = document.getElementById('logout-btn');
const userSearch = document.getElementById('user-search');
const searchResults = document.getElementById('search-results');
const friendsList = document.getElementById('friends-list');
const requestsList = document.getElementById('requests-list');
const chatWindow = document.getElementById('chat-window');
const noChatSelected = document.getElementById('no-chat-selected');
const chatAvatar = document.getElementById('chat-avatar');
const chatName = document.getElementById('chat-name');
const chatStatus = document.getElementById('chat-status');
const messagesContainer = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const typingIndicator = document.getElementById('typing-indicator');

// Audio Call Elements
const callModal = document.getElementById('call-modal');
const callTitle = document.getElementById('call-title');
const callAvatar = document.getElementById('call-avatar');
const acceptCallBtn = document.getElementById('accept-call');
const rejectCallBtn = document.getElementById('reject-call');
const endCallBtn = document.getElementById('end-call');
const callControls = document.getElementById('call-controls');
const activeCallControls = document.getElementById('active-call-controls');

// Initialize App
async function init() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js');
    }
    
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
            window.location.href = '/login.html';
            return;
        }
        currentUser = await res.json();
        
        myAvatar.src = currentUser.profilePic;
        myName.textContent = currentUser.name;
        
        socket.emit('join', currentUser._id);
        
        loadFriends();
        loadRequests();
    } catch (err) {
        window.location.href = '/login.html';
    }
}

// Load Friends
async function loadFriends() {
    const res = await fetch('/api/users/friends');
    const friends = await res.json();
    friendsList.innerHTML = '';
    friends.forEach(friend => {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.innerHTML = `
            <div style="position: relative;">
                <img src="${friend.profilePic}" class="avatar" alt="${friend.name}">
                <div class="status-dot ${friend.status}" data-user-id="${friend._id}"></div>
            </div>
            <div>
                <div style="font-weight: bold;">${friend.name}</div>
                <div style="font-size: 0.7rem; color: var(--text-secondary);">@${friend.username}</div>
            </div>
        `;
        div.onclick = () => {
            window.location.href = `/chat.html?userId=${friend._id}`;
        };
        friendsList.appendChild(div);
    });
}

// Load Requests
async function loadRequests() {
    const res = await fetch('/api/users/requests');
    const requests = await res.json();
    requestsList.innerHTML = '';
    requests.forEach(req => {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.innerHTML = `
            <img src="${req.profilePic}" class="avatar" alt="${req.name}">
            <div style="flex: 1;">
                <div style="font-weight: bold;">${req.name}</div>
                <div style="font-size: 0.7rem; color: var(--text-secondary);">@${req.username}</div>
            </div>
            <button onclick="acceptRequest('${req._id}')" style="padding: 2px 8px; font-size: 0.7rem;">ACCEPT</button>
        `;
        requestsList.appendChild(div);
    });
}

// Select User for Chat
async function selectUser(user) {
    selectedUser = user;
    noChatSelected.style.display = 'none';
    chatWindow.style.display = 'flex';
    
    chatAvatar.src = user.profilePic;
    chatName.textContent = user.name;
    chatStatus.textContent = user.status || 'offline';
    chatStatus.className = `status-dot ${user.status || 'offline'}`;
    
    loadMessages(user._id);
}

// Load Messages
async function loadMessages(userId) {
    const res = await fetch(`/api/messages/${userId}`);
    const messages = await res.json();
    messagesContainer.innerHTML = '';
    messages.forEach(msg => appendMessage(msg));
    scrollToBottom();
}

// Append Message to UI
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

// Send Message
messageForm.onsubmit = async (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    if (!content || !selectedUser) return;
    
    const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            receiverId: selectedUser._id,
            content,
            type: 'text'
        })
    });
    
    const msg = await res.json();
    appendMessage(msg);
    socket.emit('sendMessage', { receiverId: selectedUser._id, message: msg });
    messageInput.value = '';
    socket.emit('typing', { receiverId: selectedUser._id, isTyping: false });
};

// Typing Indicator
let typingTimeout;
messageInput.oninput = () => {
    if (!selectedUser) return;
    socket.emit('typing', { receiverId: selectedUser._id, isTyping: true, senderName: currentUser.name });
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('typing', { receiverId: selectedUser._id, isTyping: false });
    }, 2000);
};

// Socket Events
socket.on('receiveMessage', (msg) => {
    if (selectedUser && msg.sender === selectedUser._id) {
        appendMessage(msg);
    }
    // Show notification if not in current chat?
});

socket.on('userTyping', (data) => {
    if (data.isTyping) {
        typingIndicator.textContent = `${data.senderName} is typing...`;
    } else {
        typingIndicator.textContent = '';
    }
});

socket.on('userStatus', (data) => {
    const dots = document.querySelectorAll(`.status-dot[data-user-id="${data.userId}"]`);
    dots.forEach(dot => {
        dot.className = `status-dot ${data.status}`;
    });
    if (selectedUser && selectedUser._id === data.userId) {
        chatStatus.textContent = data.status;
    }
});

// Search Users
userSearch.oninput = async () => {
    const query = userSearch.value.trim();
    if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    const res = await fetch(`/api/users/search?query=${query}`);
    const users = await res.json();
    
    searchResults.innerHTML = '';
    searchResults.style.display = 'block';
    
    if (users.length === 0) {
        searchResults.innerHTML = '<div style="padding: 10px; font-size: 0.8rem;">No operatives found.</div>';
    } else {
        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.innerHTML = `
                <img src="${user.profilePic}" class="avatar" alt="${user.name}">
                <div style="flex: 1;">
                    <div style="font-weight: bold;">${user.name}</div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary);">@${user.username}</div>
                </div>
                <button onclick="sendRequest('${user._id}')" style="padding: 2px 8px; font-size: 0.7rem;">REQUEST</button>
            `;
            searchResults.appendChild(div);
        });
    }
};

// Friend Request Actions
window.sendRequest = async (userId) => {
    const res = await fetch('/api/users/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    if (res.ok) {
        alert('Request sent');
        userSearch.value = '';
        searchResults.style.display = 'none';
    }
};

window.acceptRequest = async (userId) => {
    const res = await fetch('/api/users/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });
    if (res.ok) {
        loadFriends();
        loadRequests();
    }
};

// Logout
logoutBtn.onclick = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
};

// Helper
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// --- WebRTC Audio Call Logic ---

const audioCallBtn = document.getElementById('audio-call-btn');

audioCallBtn.onclick = () => {
    if (!selectedUser) return;
    startCall(selectedUser._id);
};

async function startCall(userId) {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream: localStream
        });

        peer.on('signal', (data) => {
            socket.emit('callUser', {
                userToCall: userId,
                signalData: data,
                from: currentUser._id,
                name: currentUser.name
            });
        });

        peer.on('stream', (stream) => {
            const audio = document.createElement('audio');
            audio.srcObject = stream;
            audio.play();
        });

        callTitle.textContent = "CALLING...";
        callAvatar.src = selectedUser.profilePic;
        callModal.style.display = 'flex';
        callControls.style.display = 'none';
        activeCallControls.style.display = 'flex';

    } catch (err) {
        alert("Could not access microphone");
    }
}

socket.on('incomingCall', (data) => {
    callTitle.textContent = `INCOMING CALL: ${data.name}`;
    callAvatar.src = "/uploads/default-avatar.png"; // Should ideally fetch from data
    callModal.style.display = 'flex';
    callControls.style.display = 'flex';
    activeCallControls.style.display = 'none';

    acceptCallBtn.onclick = async () => {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            peer = new SimplePeer({
                initiator: false,
                trickle: false,
                stream: localStream
            });

            peer.on('signal', (signal) => {
                socket.emit('answerCall', { signal, to: data.from });
            });

            peer.on('stream', (stream) => {
                const audio = document.createElement('audio');
                audio.srcObject = stream;
                audio.play();
            });

            peer.signal(data.signal);
            
            callControls.style.display = 'none';
            activeCallControls.style.display = 'flex';
            callTitle.textContent = "ENCRYPTED TRANSMISSION ACTIVE";
        } catch (err) {
            alert("Could not access microphone");
        }
    };

    rejectCallBtn.onclick = () => {
        callModal.style.display = 'none';
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
    };
});

socket.on('callAccepted', (signal) => {
    peer.signal(signal);
    callTitle.textContent = "ENCRYPTED TRANSMISSION ACTIVE";
});

endCallBtn.onclick = () => {
    if (peer) peer.destroy();
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    callModal.style.display = 'none';
};

// Initialize
init();
