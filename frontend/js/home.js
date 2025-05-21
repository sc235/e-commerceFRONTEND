document.addEventListener('DOMContentLoaded', () => {
    // Load all data
    loadCategories();
    loadFeaturedProducts();
    loadTopSellers();
});

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const categoryGrid = document.getElementById('categoryGrid');
        categoryGrid.innerHTML = categories.map(category => `
            <div class="category-card">
                <img src="${category.image}" alt="${category.name}">
                <h3>${category.name}</h3>
                <p>${category.description}</p>
                <a href="/products.html?category=${category.id}" class="btn btn-primary">View Products</a>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Error loading categories', 'error');
    }
}

async function loadFeaturedProducts() {
    try {
        const response = await fetch('/api/products/featured');
        const products = await response.json();
        
        const productGrid = document.getElementById('featuredProducts');
        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p class="seller">by ${product.sellerName}</p>
                    <div class="product-actions">
                        <button onclick="addToCart(${product.id})" class="btn btn-primary">Add to Cart</button>
                        <a href="/product.html?id=${product.id}" class="btn btn-secondary">View Details</a>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading featured products:', error);
        showNotification('Error loading featured products', 'error');
    }
}

async function loadTopSellers() {
    try {
        const response = await fetch('/api/sellers/top');
        const sellers = await response.json();
        
        const sellerGrid = document.getElementById('topSellers');
        sellerGrid.innerHTML = sellers.map(seller => `
            <div class="seller-card">
                <img src="${seller.avatar}" alt="${seller.name}">
                <div class="seller-info">
                    <h3>${seller.name}</h3>
                    <p>${seller.totalSales} Sales</p>
                    <p>${seller.rating} ★ Rating</p>
                    <a href="/seller.html?id=${seller.id}" class="btn btn-primary">View Store</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading top sellers:', error);
        showNotification('Error loading top sellers', 'error');
    }
}

async function addToCart(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please login to add items to cart', 'error');
            return;
        }

        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (response.ok) {
            showNotification('Product added to cart successfully', 'success');
        } else {
            throw new Error('Failed to add product to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding product to cart', 'error');
    }
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