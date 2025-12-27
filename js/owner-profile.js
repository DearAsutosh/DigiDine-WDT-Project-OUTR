/* Owner Profile Logic */

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (icon.classList.contains('bi-moon-stars-fill')) icon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
            else if (icon.classList.contains('bi-moon-stars')) icon.classList.replace('bi-moon-stars', 'bi-sun');
        }
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (isDark) {
                if (icon.classList.contains('bi-moon-stars-fill')) icon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
                else if (icon.classList.contains('bi-moon-stars')) icon.classList.replace('bi-moon-stars', 'bi-sun');
            } else {
                if (icon.classList.contains('bi-sun-fill')) icon.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
                else if (icon.classList.contains('bi-sun')) icon.classList.replace('bi-sun', 'bi-moon-stars');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // 0. UI Init
    initTheme();
    // 1. Auth Guard
    const user = Auth.getCurrentUser();
    if (!user || (user.role !== 'owner' && user.role !== 'restaurant_owner')) {
        window.location.href = 'index.html';
        return;
    }

    // 2. UI Init
    document.getElementById('owner-name-nav').textContent = user.name;
    loadProfileData(user);

    // 3. User Form Handler
    document.getElementById('user-details-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const updates = {
            email: user.email,
            name: document.getElementById('owner-name').value,
            phone: document.getElementById('owner-phone').value
        };

        try {
            const response = await ApiClient.request('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            
            // Update local storage
            localStorage.setItem(Auth.SESSION_KEY, JSON.stringify(response.user));
            Cart.showToast('Personal info updated successfully!', 'success');
            document.getElementById('owner-name-nav').textContent = response.user.name;
        } catch (error) {
            Cart.showToast('Failed to update personal info: ' + error.message, 'danger');
        }
    });

    // 4. Restaurant Form Handler
    document.getElementById('restaurant-details-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const details = {
            id: user.restaurantId,
            name: document.getElementById('restaurant-name').value,
            cuisine: document.getElementById('restaurant-cuisine').value,
            location: document.getElementById('restaurant-location').value,
            image: document.getElementById('restaurant-image').value
        };

        try {
            await ApiClient.updateRestaurant(details);
            Cart.showToast('Restaurant details updated successfully!', 'success');
        } catch (error) {
            Cart.showToast('Failed to update restaurant info: ' + error.message, 'danger');
        }
    });

    // 5. Delete Account Handler
    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        const btn = document.getElementById('confirm-delete-btn');
        btn.disabled = true;
        btn.textContent = 'DELETING...';

        try {
            await Auth.deleteAccount();
            // Auth.deleteAccount redirects to index.html on success
        } catch (error) {
            Cart.showToast('Failed to delete account: ' + error.message, 'danger');
            btn.disabled = false;
            btn.textContent = 'YES, DELETE EVERYTHING';
        }
    });
});

/**
 * Fetch and display initial data
 */
async function loadProfileData(user) {
    // Set user fields
    document.getElementById('owner-name').value = user.name;
    document.getElementById('owner-email').value = user.email;
    document.getElementById('owner-phone').value = user.phone || '';

    // Fetch restaurant details
    try {
        const restaurants = await ApiClient.getRestaurants();
        const myRestaurant = restaurants.find(r => r.id === parseInt(user.restaurantId));
        
        if (myRestaurant) {
            document.getElementById('restaurant-name').value = myRestaurant.name;
            document.getElementById('restaurant-cuisine').value = myRestaurant.cuisine || '';
            document.getElementById('restaurant-location').value = myRestaurant.location || '';
            document.getElementById('restaurant-image').value = myRestaurant.image || '';
        }
    } catch (error) {
        console.error('Error loading restaurant data:', error);
    }
}

// --- Password Change Handler (Owner Profile) ---
const ownerChangePasswordForm = document.getElementById('owner-change-password-form');
if (ownerChangePasswordForm) {
    ownerChangePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('owner-current-password').value;
        const newPassword = document.getElementById('owner-new-password').value;
        const confirmPassword = document.getElementById('owner-confirm-password').value;
        
        // Validation
        if (newPassword !== confirmPassword) {
            Cart.showToast('Passwords do not match', 'danger');
            return;
        }
        
        if (newPassword.length < 6) {
            Cart.showToast('Password must be at least 6 characters', 'danger');
            return;
        }
        
        try {
            const user = Auth.getCurrentUser();
            if (!user) {
                Cart.showToast('Please login first', 'danger');
                return;
            }
            
            await ApiClient.changePassword(user.email, currentPassword, newPassword);
            Cart.showToast('Password changed successfully!', 'success');
            ownerChangePasswordForm.reset();
        } catch (error) {
            Cart.showToast(error.message || 'Failed to change password', 'danger');
        }
    });
}
