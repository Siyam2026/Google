const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Clear previous error
        errorMessage.textContent = '';

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Success: redirect to home
                window.location.href = '/home.html';
            } else {
                // Error: show message under password field (or in the error div)
                errorMessage.textContent = data.message || 'Invalid username or password';
            }
        } catch (err) {
            errorMessage.textContent = 'Connection error. Please try again later.';
        }
    });
}

// Check if already logged in
async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
            window.location.href = '/home.html';
        }
    } catch (err) {}
}

checkAuth();
