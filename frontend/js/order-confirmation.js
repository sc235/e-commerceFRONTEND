// DOM Elements
const orderNumber = document.getElementById('orderNumber');
const orderDate = document.getElementById('orderDate');
const orderStatus = document.getElementById('orderStatus');
const paymentStatus = document.getElementById('paymentStatus');
const shippingInfo = document.getElementById('shippingInfo');
const orderItems = document.getElementById('orderItems');
const subtotal = document.getElementById('subtotal');
const shipping = document.getElementById('shipping');
const tax = document.getElementById('tax');
const total = document.getElementById('total');

// API URL
const API_URL = 'http://localhost:5000/api';

// Get order ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('orderId');

// Load order details when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (orderId) {
        loadOrderDetails(orderId);
    } else {
        showError('No order ID provided');
    }
});

// Function to load order details
async function loadOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load order details');
        }

        const order = await response.json();
        displayOrderDetails(order);
    } catch (error) {
        showError(error.message);
    }
}

// Function to display order details
function displayOrderDetails(order) {
    // Display order information
    orderNumber.textContent = order.id;
    orderDate.textContent = new Date(order.createdAt).toLocaleDateString();
    orderStatus.textContent = order.status;
    paymentStatus.textContent = order.paymentStatus;

    // Display shipping information
    const address = order.shippingAddress;
    shippingInfo.innerHTML = `
        <div class="address-details">
            <p><strong>${address.fullName}</strong></p>
            <p>${address.streetAddress}</p>
            <p>${address.city}, ${address.state} ${address.postalCode}</p>
            <p>${address.country}</p>
            <p>Phone: ${address.phoneNumber}</p>
        </div>
    `;

    // Display order items
    orderItems.innerHTML = order.items.map(item => `
        <div class="order-item">
            <div class="item-image">
                <img src="${item.product.imageUrl}" alt="${item.product.name}">
            </div>
            <div class="item-details">
                <h3>${item.product.name}</h3>
                <p class="item-price">$${item.price.toFixed(2)}</p>
                <p class="item-quantity">Quantity: ${item.quantity}</p>
            </div>
            <div class="item-total">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
        </div>
    `).join('');

    // Display order totals
    subtotal.textContent = `$${order.subtotal.toFixed(2)}`;
    shipping.textContent = `$${order.shippingCost.toFixed(2)}`;
    tax.textContent = `$${order.tax.toFixed(2)}`;
    total.textContent = `$${order.total.toFixed(2)}`;
}

// Function to show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.confirmation-container').prepend(errorDiv);
} 