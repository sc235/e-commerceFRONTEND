document.addEventListener('DOMContentLoaded', () => {
    // Check if user is seller
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Verify seller role
    fetch('/api/auth/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.role !== 'seller') {
            window.location.href = '/index.html';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        window.location.href = '/login.html';
    });

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

    // Load dashboard data
    loadDashboardData();

    // Product Modal
    const modal = document.getElementById('productModal');
    const addProductBtn = document.getElementById('addProductBtn');
    const closeBtn = document.querySelector('.close');
    const productForm = document.getElementById('productForm');

    addProductBtn.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Add New Product';
        productForm.reset();
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            categoryId: document.getElementById('productCategory').value,
            description: document.getElementById('productDescription').value,
            imageUrl: document.getElementById('productImage').value
        };

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                modal.style.display = 'none';
                loadProducts();
                showNotification('Product added successfully!', 'success');
            } else {
                throw new Error('Failed to add product');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to add product', 'error');
        }
    });

    // Logout handler
    document.getElementById('logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
});

async function loadDashboardData() {
    try {
        const [products, orders] = await Promise.all([
            fetchData('/api/products/seller'),
            fetchData('/api/orders/seller')
        ]);

        // Update dashboard stats
        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('totalRevenue').textContent = 
            `$${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}`;
        document.getElementById('pendingOrders').textContent = 
            orders.filter(order => order.status === 'pending').length;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadSectionData(section) {
    switch (section) {
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

async function loadProducts() {
    try {
        const products = await fetchData('/api/products/seller');
        const categories = await fetchData('/api/categories');
        
        // Update category select in modal
        const categorySelect = document.getElementById('productCategory');
        categorySelect.innerHTML = categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');

        // Update products table
        const tbody = document.querySelector('#productsTable tbody');
        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>$${product.price}</td>
                <td>${product.stock}</td>
                <td>${product.category?.name || 'N/A'}</td>
                <td>${product.status}</td>
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
        const orders = await fetchData('/api/orders/seller');
        const tbody = document.querySelector('#ordersTable tbody');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.user?.name || 'N/A'}</td>
                <td>${order.items.length} items</td>
                <td>$${order.total}</td>
                <td>${order.status}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
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

async function loadAnalytics() {
    try {
        const orders = await fetchData('/api/orders/seller');
        
        // Sales Overview Chart
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        const salesData = processSalesData(orders);
        new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Sales',
                    data: salesData.values,
                    borderColor: '#3498db',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Top Products Chart
        const productsCtx = document.getElementById('productsChart').getContext('2d');
        const productsData = processProductsData(orders);
        new Chart(productsCtx, {
            type: 'bar',
            data: {
                labels: productsData.labels,
                datasets: [{
                    label: 'Units Sold',
                    data: productsData.values,
                    backgroundColor: '#2ecc71'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function processSalesData(orders) {
    const salesByDate = {};
    orders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString();
        salesByDate[date] = (salesByDate[date] || 0) + order.total;
    });

    return {
        labels: Object.keys(salesByDate),
        values: Object.values(salesByDate)
    };
}

function processProductsData(orders) {
    const productSales = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            productSales[item.product.name] = (productSales[item.product.name] || 0) + item.quantity;
        });
    });

    const sortedProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    return {
        labels: sortedProducts.map(([name]) => name),
        values: sortedProducts.map(([,quantity]) => quantity)
    };
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
async function editProduct(productId) {
    try {
        const product = await fetchData(`/api/products/${productId}`);
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productCategory').value = product.categoryId;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productImage').value = product.imageUrl;
        
        document.getElementById('productModal').style.display = 'block';
        
        // Update form submission handler
        const form = document.getElementById('productForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('productName').value,
                price: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value),
                categoryId: document.getElementById('productCategory').value,
                description: document.getElementById('productDescription').value,
                imageUrl: document.getElementById('productImage').value
            };

            try {
                const response = await fetch(`/api/products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    document.getElementById('productModal').style.display = 'none';
                    loadProducts();
                    showNotification('Product updated successfully!', 'success');
                } else {
                    throw new Error('Failed to update product');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Failed to update product', 'error');
            }
        };
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Failed to load product details', 'error');
    }
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                loadProducts();
                showNotification('Product deleted successfully!', 'success');
            } else {
                throw new Error('Failed to delete product');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to delete product', 'error');
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

function showNotification(message, type = 'info') {
    // Implement notification system
    console.log(`${type}: ${message}`);
} 