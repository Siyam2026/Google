const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get('groupId');

let currentUser = null;
let group = null;

async function init() {
    if (!groupId) {
        window.location.href = '/home.html';
        return;
    }

    const authRes = await fetch('/api/auth/me');
    currentUser = await authRes.json();
    socket.emit('join', currentUser._id);

    // Load group info
    const groupsRes = await fetch('/api/groups');
    const groups = await groupsRes.json();
    group = groups.find(g => g._id === groupId);

    if (group) {
        document.getElementById('group-name').textContent = group.name;
        // Load members...
    }
}

init();
