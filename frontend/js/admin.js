// Remove the API_BASE_URL declaration since it's now in config.js
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is admin
    await requireAdmin();

    // Load admin name
    await loadAdminInfo();

    // Load data based on current page
    const currentPage = window.location.pathname.split('/').pop();
    switch (currentPage) {
        case 'orders.html':
            await loadAllOrders();
            break;
        case 'users.html':
            await loadAllUsers();
            break;
        case 'products.html':
            await loadAllProducts();
            break;
        case 'payments.html':
            await loadAllPayments();
            break;
        default:
            // Load dashboard data
            await loadDashboardData();
            break;
    }

    // Navigation
    const navLinks = document.querySelectorAll('.nav-links a[data-section]');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                    loadSectionData(targetSection);
                }
            });
        });
    });

    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            window.location.href = 'index.html';
        });
    }
});

async function loadAdminInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load admin information');
        }
        
        const user = await response.json();
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = user.name;
        }
    } catch (error) {
        console.error('Error loading admin info:', error);
        showNotification('Error loading admin information', 'error');
    }
}

async function loadDashboardData() {
    try {
        // Load statistics
        const statsResponse = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!statsResponse.ok) {
            const error = await statsResponse.json();
            throw new Error(error.message || 'Failed to load statistics');
        }

        const stats = await statsResponse.json();

        // Update statistics
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalProducts').textContent = stats.totalProducts;
        document.getElementById('totalOrders').textContent = stats.totalOrders;
        document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue.toFixed(2)}`;

        // Load recent data
        await Promise.all([
            loadRecentOrders(),
            loadRecentUsers(),
            loadRecentProducts(),
            loadRecentPayments()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification(error.message || 'Error loading dashboard data', 'error');
    }
}

async function loadRecentOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/recent`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const orders = await response.json();

        const tbody = document.querySelector('#recentOrders tbody');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customerName}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

async function loadRecentUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/recent`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const users = await response.json();

        const tbody = document.querySelector('#recentUsers tbody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="status-badge">${user.role}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent users:', error);
    }
}

async function loadRecentProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/products/recent`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const products = await response.json();

        const tbody = document.querySelector('#recentProducts tbody');
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>${product.sellerName}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent products:', error);
    }
}

async function loadRecentPayments() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/payments/recent`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const payments = await response.json();

        const tbody = document.querySelector('#recentPayments tbody');
        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td>#${payment.orderId}</td>
                <td>$${payment.amount.toFixed(2)}</td>
                <td><span class="status-badge ${payment.status.toLowerCase()}">${payment.status}</span></td>
                <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent payments:', error);
    }
}

async function loadSectionData(section) {
    switch (section) {
        case 'users':
            loadUsers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'payments':
            loadPayments();
            break;
    }
}

async function loadUsers() {
    try {
        const users = await fetchData(`${API_BASE_URL}/users`);
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <button onclick="editUser(${user.id})">Edit</button>
                    <button onclick="deleteUser(${user.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadProducts() {
    try {
        const products = await fetchData(`${API_BASE_URL}/products`);
        const tbody = document.querySelector('#productsTable tbody');
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>$${product.price}</td>
                <td>${product.stock}</td>
                <td>${product.category?.name || 'N/A'}</td>
                <td>
                    <button onclick="editProduct(${product.id})">Edit</button>
                    <button onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function loadOrders() {
    try {
        const orders = await fetchData(`${API_BASE_URL}/orders`);
        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.user?.name || 'N/A'}</td>
                <td>$${order.total}</td>
                <td>${order.status}</td>
                <td>${order.paymentStatus}</td>
                <td>
                    <button onclick="viewOrder(${order.id})">View</button>
                    <button onclick="updateOrderStatus(${order.id})">Update Status</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function loadPayments() {
    try {
        const payments = await fetchData(`${API_BASE_URL}/payments`);
        const tbody = document.querySelector('#paymentsTable tbody');
        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td>${payment.id}</td>
                <td>${payment.orderId}</td>
                <td>$${payment.amount}</td>
                <td>${payment.status}</td>
                <td>${payment.method}</td>
                <td>
                    <button onclick="viewPayment(${payment.id})">View</button>
                    <button onclick="updatePaymentStatus(${payment.id})">Update Status</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

async function fetchData(endpoint) {
    const response = await fetch(endpoint, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
}

// Action handlers
async function editUser(userId) {
    // Implement user edit functionality
    console.log('Edit user:', userId);
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }
}

async function editProduct(productId) {
    // Implement product edit functionality
    console.log('Edit product:', productId);
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    }
}

async function viewOrder(orderId) {
    // Implement order view functionality
    console.log('View order:', orderId);
}

async function updateOrderStatus(orderId) {
    // Implement order status update functionality
    console.log('Update order status:', orderId);
}

async function viewPayment(paymentId) {
    // Implement payment view functionality
    console.log('View payment:', paymentId);
}

async function updatePaymentStatus(paymentId) {
    // Implement payment status update functionality
    console.log('Update payment status:', paymentId);
}

function showNotification(message, type = 'info') {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to container
    container.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to load all orders
async function loadAllOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = '';
        
        data.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${order._id}</td>
                <td>${order.customer.name}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
                <td><span class="status-badge ${order.paymentStatus.toLowerCase()}">${order.paymentStatus}</span></td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewOrderDetails('${order._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('Failed to load orders');
    }
}

// Function to load all users
async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';
        
        data.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user._id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewUserDetails('${user._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

// Function to load all products
async function loadAllProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/products`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        const tbody = document.querySelector('#productsTable tbody');
        tbody.innerHTML = '';
        
        data.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product._id}</td>
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>${product.seller.name}</td>
                <td><span class="status-badge ${product.status.toLowerCase()}">${product.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewProductDetails('${product._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products');
    }
}

// Function to load all payments
async function loadAllPayments() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/payments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        
        const tbody = document.querySelector('#paymentsTable tbody');
        tbody.innerHTML = '';
        
        data.forEach(payment => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${payment._id}</td>
                <td>${payment.order}</td>
                <td>$${payment.amount.toFixed(2)}</td>
                <td><span class="status-badge ${payment.status.toLowerCase()}">${payment.status}</span></td>
                <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewPaymentDetails('${payment._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading payments:', error);
        showError('Failed to load payments');
    }
}

// Function to view order details
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const order = await response.json();
        
        const modal = document.getElementById('orderModal');
        const details = document.getElementById('orderDetails');
        
        details.innerHTML = `
            <h2>Order Details</h2>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Order ID:</label>
                    <span>${order._id}</span>
                </div>
                <div class="detail-item">
                    <label>Customer:</label>
                    <span>${order.customer.name}</span>
                </div>
                <div class="detail-item">
                    <label>Total:</label>
                    <span>$${order.total.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <label>Status:</label>
                    <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div class="detail-item">
                    <label>Payment Status:</label>
                    <span class="status-badge ${order.paymentStatus.toLowerCase()}">${order.paymentStatus}</span>
                </div>
                <div class="detail-item">
                    <label>Date:</label>
                    <span>${new Date(order.createdAt).toLocaleString()}</span>
                </div>
            </div>
            <h3>Order Items</h3>
            <table class="details-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.product.name}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>${item.quantity}</td>
                            <td>$${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading order details:', error);
        showError('Failed to load order details');
    }
}

// Function to view user details
async function viewUserDetails(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const user = await response.json();
        
        const modal = document.getElementById('userModal');
        const details = document.getElementById('userDetails');
        
        details.innerHTML = `
            <h2>User Details</h2>
            <div class="details-grid">
                <div class="detail-item">
                    <label>User ID:</label>
                    <span>${user._id}</span>
                </div>
                <div class="detail-item">
                    <label>Name:</label>
                    <span>${user.name}</span>
                </div>
                <div class="detail-item">
                    <label>Email:</label>
                    <span>${user.email}</span>
                </div>
                <div class="detail-item">
                    <label>Role:</label>
                    <span class="role-badge ${user.role.toLowerCase()}">${user.role}</span>
                </div>
                <div class="detail-item">
                    <label>Joined Date:</label>
                    <span>${new Date(user.createdAt).toLocaleString()}</span>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading user details:', error);
        showError('Failed to load user details');
    }
}

// Function to view product details
async function viewProductDetails(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const product = await response.json();
        
        const modal = document.getElementById('productModal');
        const details = document.getElementById('productDetails');
        
        details.innerHTML = `
            <h2>Product Details</h2>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Product ID:</label>
                    <span>${product._id}</span>
                </div>
                <div class="detail-item">
                    <label>Name:</label>
                    <span>${product.name}</span>
                </div>
                <div class="detail-item">
                    <label>Price:</label>
                    <span>$${product.price.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <label>Stock:</label>
                    <span>${product.stock}</span>
                </div>
                <div class="detail-item">
                    <label>Seller:</label>
                    <span>${product.seller.name}</span>
                </div>
                <div class="detail-item">
                    <label>Status:</label>
                    <span class="status-badge ${product.status.toLowerCase()}">${product.status}</span>
                </div>
                <div class="detail-item">
                    <label>Created Date:</label>
                    <span>${new Date(product.createdAt).toLocaleString()}</span>
                </div>
            </div>
            <div class="detail-item">
                <label>Description:</label>
                <p>${product.description}</p>
            </div>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading product details:', error);
        showError('Failed to load product details');
    }
}

// Function to view payment details
async function viewPaymentDetails(paymentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const payment = await response.json();
        
        const modal = document.getElementById('paymentModal');
        const details = document.getElementById('paymentDetails');
        
        details.innerHTML = `
            <h2>Payment Details</h2>
            <div class="details-grid">
                <div class="detail-item">
                    <label>Payment ID:</label>
                    <span>${payment._id}</span>
                </div>
                <div class="detail-item">
                    <label>Order ID:</label>
                    <span>${payment.order}</span>
                </div>
                <div class="detail-item">
                    <label>Amount:</label>
                    <span>$${payment.amount.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <label>Status:</label>
                    <span class="status-badge ${payment.status.toLowerCase()}">${payment.status}</span>
                </div>
                <div class="detail-item">
                    <label>Date:</label>
                    <span>${new Date(payment.createdAt).toLocaleString()}</span>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading payment details:', error);
        showError('Failed to load payment details');
    }
}

// Close modal when clicking the close button or outside the modal
document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Load data based on current page
    const currentPage = window.location.pathname.split('/').pop();
    switch (currentPage) {
        case 'orders.html':
            loadAllOrders();
            break;
        case 'users.html':
            loadAllUsers();
            break;
        case 'products.html':
            loadAllProducts();
            break;
        case 'payments.html':
            loadAllPayments();
            break;
        default:
            // Load dashboard data
            loadDashboardData();
            break;
    }
}); 