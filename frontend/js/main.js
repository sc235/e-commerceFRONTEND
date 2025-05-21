// DOM Elements
const featuredProductsContainer = document.getElementById('featuredProducts');
const cartCount = document.getElementById('cartCount');

// API URL
const API_URL = 'http://localhost:5000/api';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedProducts();
    updateCartCount();
});

async function loadFeaturedProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        featuredProductsContainer.innerHTML = products
            .slice(0, 4) // Show only 4 featured products
            .map(product => `
                <div class="product-card">
                    <img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p class="description">${product.description}</p>
                    <button class="btn btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            `)
            .join('');
    } catch (error) {
        console.error('Error loading products:', error);
        featuredProductsContainer.innerHTML = '<p>Error loading products. Please try again later.</p>';
    }
}

async function addToCart(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal('login');
            return;
        }

        const response = await fetch(`${API_URL}/cart/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId,
                quantity: 1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to add item to cart');
        }

        updateCartCount();
        alert('Item added to cart successfully!');
    } catch (error) {
        alert(error.message);
    }
}

async function updateCartCount() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            cartCount.textContent = '0';
            return;
        }

        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get cart');
        }

        const itemCount = data.items.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = itemCount;
    } catch (error) {
        console.error('Error updating cart count:', error);
        cartCount.textContent = '0';
    }
}

// Helper function to show auth modal (from auth.js)
function showAuthModal(type) {
    const authModal = document.getElementById('authModal');
    const authContent = document.getElementById('authContent');
    authContent.innerHTML = type === 'login' ? getLoginForm() : getRegisterForm();
    authModal.style.display = 'block';
} 