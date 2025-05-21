// DOM Elements
const profileMenuItems = document.querySelectorAll('.profile-menu-item');
const profileSections = document.querySelectorAll('.profile-section');
const personalInfoForm = document.getElementById('personalInfoForm');
const changePasswordForm = document.getElementById('changePasswordForm');
const addressesList = document.getElementById('addressesList');
const addAddressBtn = document.getElementById('addAddressBtn');
const addressModal = document.getElementById('addressModal');
const addressForm = document.getElementById('addressForm');
const closeModalBtns = document.querySelectorAll('.close-modal');

// API URL
const API_URL = 'http://localhost:5000/api';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadAddresses();
    setupEventListeners();
});

function setupEventListeners() {
    // Profile menu navigation
    profileMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    // Form submissions
    personalInfoForm.addEventListener('submit', handlePersonalInfoUpdate);
    changePasswordForm.addEventListener('submit', handlePasswordChange);
    addressForm.addEventListener('submit', handleAddressSubmit);

    // Address modal
    addAddressBtn.addEventListener('click', () => {
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
}

function switchSection(sectionId) {
    // Update menu items
    profileMenuItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionId);
    });

    // Update sections
    profileSections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });
}

async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal('login');
            return;
        }

        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const user = await response.json();

        if (!response.ok) {
            throw new Error(user.message || 'Failed to load profile');
        }

        // Populate form fields
        document.getElementById('name').value = user.name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile information');
    }
}

async function handlePersonalInfoUpdate(e) {
    e.preventDefault();

    try {
        const token = localStorage.getItem('token');
        const formData = new FormData(personalInfoForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };

        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to update profile');
        }

        alert('Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert(error.message);
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();

    try {
        const token = localStorage.getItem('token');
        const formData = new FormData(changePasswordForm);
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        const data = {
            currentPassword: formData.get('currentPassword'),
            newPassword: newPassword
        };

        const response = await fetch(`${API_URL}/users/change-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to change password');
        }

        alert('Password changed successfully');
        changePasswordForm.reset();
    } catch (error) {
        console.error('Error changing password:', error);
        alert(error.message);
    }
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
        <div class="address-card">
            <div class="address-content">
                <p><strong>${address.addressLine1}</strong></p>
                ${address.addressLine2 ? `<p>${address.addressLine2}</p>` : ''}
                <p>${address.city}, ${address.state} ${address.postalCode}</p>
                <p>${address.country}</p>
            </div>
            <div class="address-actions">
                <button class="btn btn-outline" onclick="editAddress(${address.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteAddress(${address.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
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

        const addressId = addressForm.dataset.addressId;
        const method = addressId ? 'PUT' : 'POST';
        const url = addressId ? 
            `${API_URL}/users/addresses/${addressId}` : 
            `${API_URL}/users/addresses`;

        const response = await fetch(url, {
            method,
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
        delete addressForm.dataset.addressId;
        loadAddresses();
    } catch (error) {
        console.error('Error saving address:', error);
        alert(error.message);
    }
}

async function editAddress(addressId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/addresses/${addressId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const address = await response.json();

        if (!response.ok) {
            throw new Error(address.message || 'Failed to load address');
        }

        // Populate form
        document.getElementById('addressLine1').value = address.addressLine1;
        document.getElementById('addressLine2').value = address.addressLine2 || '';
        document.getElementById('city').value = address.city;
        document.getElementById('state').value = address.state;
        document.getElementById('postalCode').value = address.postalCode;
        document.getElementById('country').value = address.country;

        // Set address ID for update
        addressForm.dataset.addressId = addressId;
        document.getElementById('addressModalTitle').textContent = 'Edit Address';
        addressModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading address:', error);
        alert(error.message);
    }
}

async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/addresses/${addressId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Failed to delete address');
        }

        loadAddresses();
    } catch (error) {
        console.error('Error deleting address:', error);
        alert(error.message);
    }
} 