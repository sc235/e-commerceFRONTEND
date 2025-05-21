// DOM Elements
const ordersList = document.getElementById('ordersList');
const orderModal = document.getElementById('orderModal');
const orderDetails = document.getElementById('orderDetails');
const closeModalBtns = document.querySelectorAll('.close-modal');

// API URL
const API_URL = 'http://localhost:5000/api';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    setupEventListeners();
});

function setupEventListeners() {
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            orderModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            orderModal.style.display = 'none';
        }
    });
}

async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal('login');
            return;
        }

        const response = await fetch(`${API_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const orders = await response.json();

        if (!response.ok) {
            throw new Error(orders.message || 'Failed to load orders');
        }

        displayOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersList.innerHTML = '<p class="error-message">Error loading orders. Please try again later.</p>';
    }
}

function displayOrders(orders) {
    if (orders.length === 0) {
        ordersList.innerHTML = '<p class="no-orders">You have no orders yet.</p>';
        return;
    }

    ordersList.innerHTML = orders.map(order => `
        <div class="order-card" onclick="showOrderDetails(${order.id})">
            <div class="order-header">
                <h3>Order #${order.id}</h3>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-info">
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                <p><strong>Items:</strong> ${order.items?.length || 0}</p>
            </div>
            <div class="order-actions">
                <button class="btn btn-outline" onclick="event.stopPropagation(); showOrderDetails(${order.id})">
                    View Details
                </button>
                ${order.status === 'pending' ? `
                    <button class="btn btn-danger" onclick="event.stopPropagation(); cancelOrder(${order.id})">
                        Cancel Order
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function showOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const order = await response.json();

        if (!response.ok) {
            throw new Error(order.message || 'Failed to load order details');
        }

        orderDetails.innerHTML = `
            <h2>Order #${order.id}</h2>
            <div class="order-details-grid">
                <div class="order-info-section">
                    <h3>Order Information</h3>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span class="order-status ${order.status}">${order.status}</span></p>
                    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Payment Status:</strong> <span class="payment-status ${order.paymentStatus}">${order.paymentStatus}</span></p>
                </div>
                <div class="shipping-section">
                    <h3>Shipping Information</h3>
                    <p><strong>Address:</strong> ${order.shippingAddress}</p>
                </div>
                <div class="items-section">
                    <h3>Order Items</h3>
                    <div class="order-items">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <img src="${item.product.image || 'images/placeholder.jpg'}" alt="${item.product.name}">
                                <div class="item-details">
                                    <h4>${item.product.name}</h4>
                                    <p>Quantity: ${item.quantity}</p>
                                    <p>Price: $${item.price.toFixed(2)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        orderModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Failed to load order details. Please try again later.');
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to cancel order');
        }

        alert('Order cancelled successfully');
        loadOrders();
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert(error.message);
    }
} 