const registerForm = document.getElementById('register-form');
const errorMessage = document.getElementById('error-message');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Clear previous error
        errorMessage.textContent = '';

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Success: redirect to login as requested
                alert('Registration successful! Please login.');
                window.location.href = '/login.html';
            } else {
                // Error: show message
                errorMessage.textContent = data.message || 'Registration failed';
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
