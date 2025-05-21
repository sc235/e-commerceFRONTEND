// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authModal = document.getElementById('authModal');
const authContent = document.getElementById('authContent');
const closeModalBtns = document.querySelectorAll('.close-modal');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupAuthEventListeners();
});

function setupAuthEventListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    if (loginBtn) {
        loginBtn.addEventListener('click', () => window.location.href = 'login.html');
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', () => window.location.href = 'register.html');
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (token) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';

        // Show/hide elements based on user role
        const sellerElements = document.querySelectorAll('.seller-only');
        const customerElements = document.querySelectorAll('.customer-only');

        sellerElements.forEach(el => {
            el.style.display = userRole === 'seller' ? 'block' : 'none';
        });

        customerElements.forEach(el => {
            el.style.display = userRole === 'customer' ? 'block' : 'none';
        });
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';

        // Hide role-specific elements
        const roleElements = document.querySelectorAll('.seller-only, .customer-only');
        roleElements.forEach(el => {
            el.style.display = 'none';
        });
    }
}

function showAuthModal(type) {
    if (!authModal) return;

    authContent.innerHTML = type === 'login' ? `
        <h2>Login</h2>
        <form id="modalLoginForm" class="auth-form">
            <div class="form-group">
                <label for="modalEmail">Email</label>
                <input type="email" id="modalEmail" name="email" required>
            </div>
            <div class="form-group">
                <label for="modalPassword">Password</label>
                <input type="password" id="modalPassword" name="password" required>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary btn-block">Login</button>
            </div>
            <div class="auth-links">
                <p>Don't have an account? <a href="#" onclick="showAuthModal('register')">Register</a></p>
            </div>
        </form>
    ` : `
        <h2>Register</h2>
        <form id="modalRegisterForm" class="auth-form">
            <div class="form-group">
                <label for="modalName">Full Name</label>
                <input type="text" id="modalName" name="name" required>
            </div>
            <div class="form-group">
                <label for="modalEmail">Email</label>
                <input type="email" id="modalEmail" name="email" required>
            </div>
            <div class="form-group">
                <label for="modalPassword">Password</label>
                <input type="password" id="modalPassword" name="password" required>
            </div>
            <div class="form-group">
                <label for="modalConfirmPassword">Confirm Password</label>
                <input type="password" id="modalConfirmPassword" name="confirmPassword" required>
            </div>
            <div class="form-group">
                <label for="modalRole">Register as</label>
                <select id="modalRole" name="role" required>
                    <option value="customer">Customer</option>
                    <option value="seller">Seller</option>
                </select>
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-primary btn-block">Register</button>
            </div>
            <div class="auth-links">
                <p>Already have an account? <a href="#" onclick="showAuthModal('login')">Login</a></p>
            </div>
        </form>
    `;

    authModal.style.display = 'block';

    // Add event listeners to modal forms
    const modalLoginForm = document.getElementById('modalLoginForm');
    const modalRegisterForm = document.getElementById('modalRegisterForm');

    if (modalLoginForm) {
        modalLoginForm.addEventListener('submit', handleLogin);
    }
    if (modalRegisterForm) {
        modalRegisterForm.addEventListener('submit', handleRegister);
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token and user role
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);

        // Show success notification
        showNotification('Login successful!', 'success');

        // Redirect based on role
        switch (data.user.role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'seller':
                window.location.href = 'seller-dashboard.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const form = e.target;
    const name = form.querySelector('[name="name"]').value;
    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;
    const role = form.querySelector('[name="role"]').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        // Store token and user role
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);

        // Show success notification
        showNotification('Registration successful!', 'success');

        // Redirect based on role
        switch (data.user.role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'seller':
                window.location.href = 'seller-dashboard.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    checkAuthStatus();
    window.location.href = 'index.html';
}

// Authentication functions
async function register(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role')?.value || 'customer' // Default to customer if role not specified
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            showNotification('Registration successful!', 'success');
            
            // Redirect based on role
            switch (data.user.role) {
                case 'admin':
                    window.location.href = 'admin-dashboard.html';
                    break;
                case 'seller':
                    window.location.href = 'seller-dashboard.html';
                    break;
                default:
                    window.location.href = 'index.html';
            }
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
}

// Role-based access control
function checkAuth(requiredRole = null) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    if (requiredRole) {
        fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(user => {
            if (user.role !== requiredRole) {
                window.location.href = '/index.html';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = '/login.html';
        });
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Admin-specific functions
async function isAdmin() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            return false;
        }

        const user = await response.json();
        return user.role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

async function requireAdmin() {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
        showNotification('Access denied. Admin privileges required.', 'error');
        window.location.href = 'index.html';
    }
}

// Export functions for use in other files
window.checkAuth = checkAuth;
window.isAdmin = isAdmin;
window.requireAdmin = requireAdmin;
window.showNotification = showNotification;

// Update the event listeners at the bottom of the file
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}); 