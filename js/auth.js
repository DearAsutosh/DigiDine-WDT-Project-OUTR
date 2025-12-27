const Auth = {
    // Keys
    USERS_KEY: 'users',
    SESSION_KEY: 'loggedInUser',

    // Helper to get users
    getUsers: function() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },

    // Helper to get current user
    getCurrentUser: function() {
        const user = localStorage.getItem(this.SESSION_KEY);
        return user ? JSON.parse(user) : null;
    },

    // Signup
    register: async function(name, email, password, role = 'customer', restaurantName = '', restaurantLocation = '') {
        try {
            const response = await ApiClient.register(name, email, password, role, restaurantName, restaurantLocation);
            // Save session
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(response.user));
            // Store token if provided
            if (response.token) localStorage.setItem('auth_token', response.token);
            
            // Set flag for one-time welcome greeting
            sessionStorage.setItem('welcome_user', 'true');
            
            return { success: true, message: response.message, user: response.user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Login
    login: async function(email, password) {
        try {
            const response = await ApiClient.login(email, password);
            // Save session
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(response.user));
            // Store token if provided
            if (response.token) localStorage.setItem('auth_token', response.token);
            
            // Set flag for one-time welcome greeting
            sessionStorage.setItem('welcome_user', 'true');
            
            return { success: true, message: response.message, user: response.user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Logout
    logout: function() {
        if (typeof Cart !== 'undefined') {
            Cart.clearCart();
        }
        localStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem('auth_token');
        // Clean up welcome flag just in case
        sessionStorage.removeItem('welcome_user');
        window.location.href = 'login.html';
    },

    // Delete Account
    deleteAccount: async function() {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            await ApiClient.deleteProfile(user.email);
            localStorage.removeItem(this.SESSION_KEY);
            localStorage.removeItem('auth_token');
            // Clean up welcome flag just in case
            sessionStorage.removeItem('welcome_user');
            window.location.href = 'index.html';
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Check if user is logged in
    isAuthenticated: function() {
        return !!this.getCurrentUser();
    },

    // Route Guard
    checkAccess: function() {
        const user = this.getCurrentUser();
        const pageId = document.body.id;
        const customerPages = ['page-home', 'page-restaurant', 'page-cart', 'page-offers', 'page-profile'];
        const ownerPages = ['page-owner-dashboard', 'page-owner-profile'];

        if (!user) {
            // Guest access to customer pages is allowed (except profile), 
            // but owner pages require login
            if (ownerPages.includes(pageId)) {
                window.location.href = 'login.html';
            }
            return;
        }

        if (user.role === 'owner' || user.role === 'restaurant_owner') {
            // Owner trying to access customer pages -> redirect to dashboard
            if (customerPages.includes(pageId)) {
                window.location.href = 'owner-dashboard.html';
            }
        } else if (user.role === 'customer') {
            // Customer trying to access owner pages -> redirect to home
            if (ownerPages.includes(pageId)) {
                window.location.href = 'index.html';
            }
        }
    },

    // Update Profile
    updateProfile: async function(updatedData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: 'Not logged in' };

        try {
            const response = await ApiClient.updateProfile({ 
                ...updatedData, 
                email: currentUser.email // Backend needs email to identify user
            });
            
            // Update session
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(response.user));
            
            return { success: true, message: response.message, user: response.user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Update UI elements based on auth state
    updateNavbar: function() {
        const user = this.getCurrentUser();
        const navAuthItem = document.getElementById('nav-auth-item');
        const navUserDisplay = document.getElementById('nav-user-name');
        
        if (navAuthItem) {
            if (user) {
                navAuthItem.innerHTML = `<a class="nav-link btn btn-light rounded-pill px-3 fw-bold" href="#" onclick="Auth.logout()">Logout</a>`;
                if(navUserDisplay) {
                     const showWelcome = sessionStorage.getItem('welcome_user');
                     
                     if (showWelcome) {
                         // Case 1: Just Logged In -> Show Greeting, then delay switch
                         const profileUrl = (user.role === 'owner' || user.role === 'restaurant_owner') ? 'owner-profile.html' : 'profile.html';
                         navUserDisplay.innerHTML = `<a href="${profileUrl}" id="profile-link-content" class="nav-link text-decoration-none d-flex align-items-center">Hello, ${user.name}</a>`;
                         
                         // Remove flag so next refresh shows image immediately
                         sessionStorage.removeItem('welcome_user');

                         setTimeout(() => {
                             const contentLink = document.getElementById('profile-link-content');
                             if(contentLink) {
                                  // Switch to Image
                                  const imgHtml = user.image 
                                     ? `<img src="${user.image}" alt="Profile" class="rounded-circle object-fit-cover shadow-sm" style="width: 32px; height: 32px; border: 2px solid var(--brand-color);">`
                                     : `<i class="bi bi-person-circle fs-4 text-brand"></i>`;
                                  contentLink.innerHTML = imgHtml;
                             }
                         }, 2500);
                     } else {
                         // Case 2: Standard Display -> Show Image or Icon
                         const profileUrl = (user.role === 'owner' || user.role === 'restaurant_owner') ? 'owner-profile.html' : 'profile.html';
                         const imgHtml = user.image 
                             ? `<img src="${user.image}" alt="Profile" class="rounded-circle object-fit-cover shadow-sm" style="width: 32px; height: 32px; border: 2px solid var(--brand-color);">`
                             : `<i class="bi bi-person-circle fs-4 text-brand"></i>`;
                         navUserDisplay.innerHTML = `<a href="${profileUrl}" class="nav-link text-decoration-none d-flex align-items-center">${imgHtml}</a>`;
                     }
                }
            } else {
                navAuthItem.innerHTML = `<a class="nav-link btn btn-light rounded-pill px-3 fw-bold" href="login.html">Login</a>`;
                if(navUserDisplay) navUserDisplay.innerHTML = '';
            }
        }
    }
};
