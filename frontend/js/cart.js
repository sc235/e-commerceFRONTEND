// DOM Elements
const cartItemsContainer = document.getElementById('cartItems');
const subtotalElement = document.getElementById('subtotal');
const shippingElement = document.getElementById('shipping');
const totalElement = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');

// Constants
const SHIPPING_RATE = 10.00;
const API_URL = 'http://localhost:5000/api';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    setupEventListeners();
});

function setupEventListeners() {
    checkoutBtn.addEventListener('click', handleCheckout);
}

async function loadCart() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal('login');
            return;
        }

        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load cart');
        }

        displayCartItems(data.items);
        updateCartSummary(data.total);
        updateCartCount(data.items.reduce((total, item) => total + item.quantity, 0));
    } catch (error) {
        console.error('Error loading cart:', error);
        cartItemsContainer.innerHTML = '<p>Error loading cart. Please try again later.</p>';
    }
}

function displayCartItems(items) {
    if (items.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
        checkoutBtn.disabled = true;
        return;
    }

    cartItemsContainer.innerHTML = items.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.product.image || 'images/placeholder.jpg'}" alt="${item.product.name}">
            <div class="item-details">
                <h3>${item.product.name}</h3>
                <p class="price">$${item.price.toFixed(2)}</p>
            </div>
            <div class="quantity-controls">
                <button class="btn btn-outline" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="btn btn-outline" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="btn btn-danger" onclick="removeItem(${item.id})">Remove</button>
        </div>
    `).join('');

    checkoutBtn.disabled = false;
}

function updateCartSummary(subtotal) {
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    shippingElement.textContent = `$${SHIPPING_RATE.toFixed(2)}`;
    totalElement.textContent = `$${(subtotal + SHIPPING_RATE).toFixed(2)}`;
}

async function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        removeItem(itemId);
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/cart/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity: newQuantity })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update quantity');
        }

        loadCart();
    } catch (error) {
        alert(error.message);
    }
}

async function removeItem(itemId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/cart/items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to remove item');
        }

        loadCart();
    } catch (error) {
        alert(error.message);
    }
}

async function handleCheckout() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                shippingAddress: '123 Main St, City, Country', // This should be collected from a form
                paymentMethod: 'credit_card' // This should be collected from a form
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create order');
        }

        alert('Order created successfully!');
        window.location.href = '/orders.html';
    } catch (error) {
        alert(error.message);
    }
} 