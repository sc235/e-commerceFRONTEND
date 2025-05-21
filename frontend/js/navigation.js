// Remove the API_BASE_URL declaration since it's now in config.js
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const navLinks = document.querySelector('.nav-links');
    
    if (!token) {
        // Show public navigation
        navLinks.innerHTML = `
            <a href="index.html">Home</a>
            <a href="products.html">Products</a>
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
        return;
    }

    // Get user role and update navigation
    fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(user => {
        let navItems = `
            <a href="index.html">Home</a>
            <a href="products.html">Products</a>
            <a href="cart.html">Cart</a>
            <a href="orders.html">Orders</a>
        `;

        if (user.role === 'admin') {
            navItems += `<a href="admin-dashboard.html">Admin Dashboard</a>`;
        } else if (user.role === 'seller') {
            navItems += `<a href="seller-dashboard.html">Seller Dashboard</a>`;
        }

        navItems += `<button id="logoutBtn" class="btn btn-outline">Logout</button>`;
        navLinks.innerHTML = navItems;

        // Add logout event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                window.location.href = 'index.html';
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        navLinks.innerHTML = `
            <a href="index.html">Home</a>
            <a href="products.html">Products</a>
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
        `;
    });
}); 