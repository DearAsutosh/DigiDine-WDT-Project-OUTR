/**
 * DigiDine API Client
 * Handles all communication with the backend server.
 */

const API_BASE_URL = 'http://localhost:3000/api';

const ApiClient = {
    /**
     * Helper for fetch calls
     * @param {string} endpoint 
     * @param {object} options 
     */
    request: async function(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },

    // --- Restaurant APIs ---

    /**
     * Fetch all restaurants
     * @param {string} search Optional search query
     */
    getRestaurants: function(search = '') {
        const query = search ? `?search=${encodeURIComponent(search)}` : '';
        return this.request(`/restaurants${query}`);
    },

    /**
     * Fetch single restaurant by ID
     * @param {number|string} id 
     */
    getRestaurantById: function(id) {
        return this.request(`/restaurants/${id}`);
    },

    // --- Authentication APIs ---

    register: function(name, email, password, role = 'customer', restaurantName = '', restaurantLocation = '') {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role, restaurantName, restaurantLocation })
        });
    },

    /**
     * Login user
     * @param {string} email 
     * @param {string} password 
     */
    login: function(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    /**
     * Change user password
     * @param {string} email 
     * @param {string} currentPassword 
     * @param {string} newPassword 
     */
    changePassword: function(email, currentPassword, newPassword) {
        return this.request('/users/change-password', {
            method: 'POST',
            body: JSON.stringify({ email, currentPassword, newPassword })
        });
    },

    /**
     * Update user profile
     * @param {object} userData 
     */
    updateProfile: function(userData) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },

    // --- Order & Promo APIs ---

    /**
     * Validate a promo code
     * @param {string} code 
     * @param {number} restaurantId 
     * @param {number} subtotal 
     */
    validatePromo: function(code, restaurantId, subtotal) {
        return this.request('/promos/validate', {
            method: 'POST',
            body: JSON.stringify({ code, restaurantId, subtotal })
        });
    },

    /**
     * Place a new order
     * @param {object} orderData 
     */
    placeOrder: function(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    /**
     * Rate an order
     * @param {number|string} orderId
     * @param {number} rating
     * @param {string} feedback
     */
    rateOrder: async function(orderId, rating, feedback) {
        // Assuming Auth is globally available or imported elsewhere
        const user = Auth.getCurrentUser();
        if (!user) {
            throw new Error('User not logged in');
        }
        return this.request(`/orders/${orderId}/rate`, {
            method: 'POST',
            body: JSON.stringify({ email: user.email, rating, feedback })
        });
    },

    /**
     * Get order history for a user
     * @param {string} email 
     */
    getOrderHistory: function(email) {
        return this.request(`/orders/${encodeURIComponent(email)}`);
    },

    /**
     * Update order status
     * @param {number|string} id 
     * @param {string} status 
     * @param {string} message 
     */
    updateOrderStatus: function(id, status, message = '') {
        return this.request(`/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, message })
        });
    },

    /**
     * Get all active offers
     */
    getOffers: function() {
        return this.request('/offers');
    },

    // --- Health Check ---
    checkHealth: function() {
        return this.request('/health');
    },

    /**
     * Delete user profile
     * @param {string} email 
     */
    deleteProfile: function(email) {
        return this.request(`/auth/profile/${encodeURIComponent(email)}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get reviews for a specific restaurant
     * @param {number|string} restaurantId 
     */
    async getRestaurantReviews(restaurantId) {
        return this.request(`/restaurants/${restaurantId}/reviews`);
    },

    /**
     * Update restaurant details
     * @param {number|string} id The ID of the restaurant to update.
     * @param {object} data The updated restaurant data.
     */
    async updateRestaurant(id, data) {
        return this.request(`/owner/restaurant/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // --- Owner Specific APIs ---

    /**
     * Get orders for owner's restaurant
     * @param {string} email Owner email
     * @param {string} status Optional status filter
     */
    getOwnerOrders: function(email, status = '') {
        const query = status ? `&status=${status}` : '';
        return this.request(`/owner/orders?email=${encodeURIComponent(email)}${query}`);
    },

    /**
     * Owner: Accept an order
     */
    acceptOrder: function(orderId, email) {
        return this.request(`/owner/orders/${orderId}/accept`, {
            method: 'PATCH',
            body: JSON.stringify({ email })
        });
    },

    /**
     * Owner: Reject an order
     */
    rejectOrder: function(orderId, email, message = '') {
        return this.request(`/owner/orders/${orderId}/reject`, {
            method: 'PATCH',
            body: JSON.stringify({ email, message })
        });
    },

    /**
     * Owner: Sequential status update
     */
    updateOwnerOrderStatus: function(orderId, email, status, message = '') {
        return this.request(`/owner/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ email, status, message })
        });
    },

    /**
     * Owner: Add menu item
     */
    addMenuItem: function(email, item) {
        return this.request('/owner/menu', {
            method: 'POST',
            body: JSON.stringify({ email, item })
        });
    },

    /**
     * Owner: Update menu item
     */
    updateMenuItem: function(itemId, email, item) {
        return this.request(`/owner/menu/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ email, item })
        });
    },

    /**
     * Owner: Delete menu item
     */
    deleteMenuItem: function(itemId, email) {
        return this.request(`/owner/menu/${itemId}`, {
            method: 'DELETE',
            body: JSON.stringify({ email })
        });
    }
};

// Make it available globally
window.ApiClient = ApiClient;
