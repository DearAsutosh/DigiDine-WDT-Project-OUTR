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
    register: function(name, email, password) {
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email already registered' };
        }
        const newUser = { name, email, password };
        users.push(newUser);
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        // Auto login after signup
        this.login(email, password);
        return { success: true, message: 'Registration successful' };
    },

    // Login
    login: function(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            // Remove password from session storage for security
            const { password, ...safeUser } = user;
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(safeUser));
            
            // Set flag for one-time welcome greeting
            sessionStorage.setItem('welcome_user', 'true');
            
            return { success: true, message: 'Login successful', user: safeUser };
        }
        return { success: false, message: 'Invalid credentials' };
    },

    // Logout
    logout: function() {
        if (typeof Cart !== 'undefined') {
            Cart.clearCart();
        }
        localStorage.removeItem(this.SESSION_KEY);
        // Clean up welcome flag just in case
        sessionStorage.removeItem('welcome_user');
        window.location.href = 'login.html';
    },

    // Check if user is logged in
    isAuthenticated: function() {
        return !!this.getCurrentUser();
    },

    // Update Profile
    updateProfile: function(updatedData) {
        let users = this.getUsers();
        let currentUser = this.getCurrentUser();
        
        if (!currentUser) return { success: false, message: 'Not logged in' };

        // Update in list
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex > -1) {
            users[userIndex] = { ...users[userIndex], ...updatedData };
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
            
            // Update session
            const safeUser = { ...currentUser, ...updatedData };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(safeUser));
            
            return { success: true, message: 'Updated' };
        }
        return { success: false, message: 'User not found' };
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
                         navUserDisplay.innerHTML = `<a href="profile.html" id="profile-link-content" class="nav-link text-decoration-none d-flex align-items-center">Hello, ${user.name}</a>`;
                         
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
                         // Case 2: Normal Navigation -> Show Image Immediately
                         const imgHtml = user.image 
                             ? `<img src="${user.image}" alt="Profile" class="rounded-circle object-fit-cover shadow-sm" style="width: 32px; height: 32px; border: 2px solid var(--brand-color);">`
                             : `<i class="bi bi-person-circle fs-4 text-brand"></i>`;
                         
                         navUserDisplay.innerHTML = `<a href="profile.html" class="nav-link text-decoration-none d-flex align-items-center">${imgHtml}</a>`;
                     }
                }
            } else {
                navAuthItem.innerHTML = `<a class="nav-link btn btn-light rounded-pill px-3 fw-bold" href="login.html">Login</a>`;
                if(navUserDisplay) navUserDisplay.innerHTML = '';
            }
        }
    }
};
