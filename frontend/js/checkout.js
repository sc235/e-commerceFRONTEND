// DOM Elements
const addressesList = document.getElementById('addressesList');
const addNewAddressBtn = document.getElementById('addNewAddressBtn');
const addressModal = document.getElementById('addressModal');
const addressForm = document.getElementById('addressForm');
const paymentForm = document.getElementById('paymentForm');
const orderItems = document.getElementById('orderItems');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const closeModalBtns = document.querySelectorAll('.close-modal');

// API URL
const API_URL = 'http://localhost:5000/api';

// Selected address
let selectedAddressId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadAddresses();
    setupEventListeners();
});

function setupEventListeners() {
    // Address modal
    addNewAddressBtn.addEventListener('click', () => {
        addressModal.style.display = 'block';
        addressForm.reset();
    });

    // Close modals
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            addressModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === addressModal) {
            addressModal.style.display = 'none';
        }
    });

    // Form submissions
    addressForm.addEventListener('submit', handleAddressSubmit);
    paymentForm.addEventListener('submit', handlePaymentSubmit);
    placeOrderBtn.addEventListener('click', handlePlaceOrder);

    // Card number formatting
    document.getElementById('cardNumber').addEventListener('input', formatCardNumber);
    document.getElementById('expiryDate').addEventListener('input', formatExpiryDate);
}

function formatCardNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }
    e.target.value = formattedValue;
}

function formatExpiryDate(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
    }
    e.target.value = value;
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

        const cart = await response.json();

        if (!response.ok) {
            throw new Error(cart.message || 'Failed to load cart');
        }

        displayCartItems(cart.items);
        updateOrderSummary(cart);
    } catch (error) {
        console.error('Error loading cart:', error);
        alert('Failed to load cart items');
    }
}

function displayCartItems(items) {
    if (items.length === 0) {
        orderItems.innerHTML = '<p class="no-items">Your cart is empty</p>';
        return;
    }

    orderItems.innerHTML = items.map(item => `
        <div class="order-item">
            <img src="${item.product.image || 'images/placeholder.jpg'}" alt="${item.product.name}">
            <div class="item-details">
                <h4>${item.product.name}</h4>
                <p>Quantity: ${item.quantity}</p>
                <p>Price: $${item.price.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

function updateOrderSummary(cart) {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 10; // Fixed shipping cost
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

async function loadAddresses() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        const response = await fetch(`${API_URL}/users/addresses`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const addresses = await response.json();

        if (!response.ok) {
            throw new Error(addresses.message || 'Failed to load addresses');
        }

        displayAddresses(addresses);
    } catch (error) {
        console.error('Error loading addresses:', error);
        addressesList.innerHTML = '<p class="error-message">Failed to load addresses</p>';
    }
}

function displayAddresses(addresses) {
    if (addresses.length === 0) {
        addressesList.innerHTML = '<p class="no-addresses">No addresses found</p>';
        return;
    }

    addressesList.innerHTML = addresses.map(address => `
        <div class="address-card ${selectedAddressId === address.id ? 'selected' : ''}" 
             onclick="selectAddress(${address.id})">
            <div class="address-content">
                <p><strong>${address.addressLine1}</strong></p>
                ${address.addressLine2 ? `<p>${address.addressLine2}</p>` : ''}
                <p>${address.city}, ${address.state} ${address.postalCode}</p>
                <p>${address.country}</p>
            </div>
        </div>
    `).join('');
}

function selectAddress(addressId) {
    selectedAddressId = addressId;
    const addressCards = document.querySelectorAll('.address-card');
    addressCards.forEach(card => {
        card.classList.toggle('selected', card.dataset.addressId === addressId.toString());
    });
}

async function handleAddressSubmit(e) {
    e.preventDefault();

    try {
        const token = localStorage.getItem('token');
        const formData = new FormData(addressForm);
        const data = {
            addressLine1: formData.get('addressLine1'),
            addressLine2: formData.get('addressLine2'),
            city: formData.get('city'),
            state: formData.get('state'),
            postalCode: formData.get('postalCode'),
            country: formData.get('country')
        };

        const response = await fetch(`${API_URL}/users/addresses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to save address');
        }

        addressModal.style.display = 'none';
        addressForm.reset();
        loadAddresses();
    } catch (error) {
        console.error('Error saving address:', error);
        alert(error.message);
    }
}

async function handlePaymentSubmit(e) {
    e.preventDefault();

    try {
        const token = localStorage.getItem('token');
        const formData = new FormData(paymentForm);
        const data = {
            cardNumber: formData.get('cardNumber').replace(/\s/g, ''),
            expiryDate: formData.get('expiryDate'),
            cvv: formData.get('cvv'),
            cardName: formData.get('cardName')
        };

        const response = await fetch(`${API_URL}/payments/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Invalid payment information');
        }

        // Payment validation successful
        return true;
    } catch (error) {
        console.error('Error validating payment:', error);
        alert(error.message);
        return false;
    }
}

async function handlePlaceOrder() {
    if (!selectedAddressId) {
        alert('Please select a shipping address');
        return;
    }

    const isPaymentValid = await handlePaymentSubmit(new Event('submit'));
    if (!isPaymentValid) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                shippingAddressId: selectedAddressId
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to place order');
        }

        // Redirect to order confirmation page
        window.location.href = `order-confirmation.html?orderId=${result.id}`;
    } catch (error) {
        console.error('Error placing order:', error);
        alert(error.message);
    }
} 