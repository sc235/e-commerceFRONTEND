// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const addProductForm = document.getElementById('addProductForm');
const editProductForm = document.getElementById('editProductForm');
const categorySelect = document.getElementById('categorySelect');

// State
let products = [];
let categories = [];
const API_URL = 'http://localhost:5000/api';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCategories();
    loadProducts();
    setupEventListeners();
});

function setupEventListeners() {
    addProductForm.addEventListener('submit', handleAddProduct);
    editProductForm.addEventListener('submit', handleEditProduct);
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const user = await response.json();
        if (user.role !== 'seller' && user.role !== 'admin') {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = '/login.html';
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        categories = await response.json();

        // Populate category select
        categorySelect.innerHTML = categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        products = await response.json();

        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
    }
}

function displayProducts(productsToDisplay) {
    productsGrid.innerHTML = productsToDisplay.map(product => `
        <div class="product-card">
            <img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p class="stock">Stock: ${product.stock}</p>
            <div class="product-actions">
                <button class="btn btn-primary" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

async function handleAddProduct(e) {
    e.preventDefault();
    const formData = new FormData(addProductForm);
    const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        categoryId: formData.get('categoryId'),
        image: formData.get('image')
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error('Failed to add product');
        }

        addProductForm.reset();
        loadProducts();
        alert('Product added successfully!');
    } catch (error) {
        alert(error.message);
    }
}

async function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Populate edit form
    const form = editProductForm;
    form.querySelector('[name="name"]').value = product.name;
    form.querySelector('[name="description"]').value = product.description;
    form.querySelector('[name="price"]').value = product.price;
    form.querySelector('[name="stock"]').value = product.stock;
    form.querySelector('[name="categoryId"]').value = product.categoryId;
    form.dataset.productId = productId;

    // Show edit form
    form.style.display = 'block';
}

async function handleEditProduct(e) {
    e.preventDefault();
    const productId = e.target.dataset.productId;
    const formData = new FormData(editProductForm);
    const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        categoryId: formData.get('categoryId'),
        image: formData.get('image')
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error('Failed to update product');
        }

        editProductForm.reset();
        editProductForm.style.display = 'none';
        loadProducts();
        alert('Product updated successfully!');
    } catch (error) {
        alert(error.message);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete product');
        }

        loadProducts();
        alert('Product deleted successfully!');
    } catch (error) {
        alert(error.message);
    }
} 