/* Main Application Logic */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Global Init
    Auth.updateNavbar();
    updateActiveNavItem(); // New: Highlight active nav
    Cart.updateBadge();
    initTheme();
    initFooterPopups();
    initNavigationHandlers(); // New: Search, Offers logic

    // 2. Page Specific Logic
    const pageId = document.body.id;

    switch (pageId) {
        case 'page-home':
            initHomePage();
            break;
        case 'page-restaurant':
            initRestaurantPage();
            break;
        case 'page-cart':
            initCartPage();
            break;
        case 'page-login':
            initLoginPage();
            break;
        case 'page-profile':
            initProfilePage();
            break;
    }
});

/* --- Profile Page Logic --- */
function initProfilePage() {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = Auth.getCurrentUser();
    
    // Fill Info
    document.getElementById('profile-name-display').textContent = user.name;
    document.getElementById('profile-email-display').textContent = user.email;
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-phone').value = user.phone || '';
    document.getElementById('edit-dob').value = user.dob || '';
    document.getElementById('edit-address').value = user.address || '';

    // Handle Profile Image
    const imgPreview = document.getElementById('profile-image-preview');
    const defaultIcon = document.getElementById('profile-default-icon');
    
    if (user.image) {
        imgPreview.src = user.image;
        imgPreview.classList.remove('d-none');
        defaultIcon.classList.add('d-none');
    }

    // Image Upload Handler (Compressed)
    document.getElementById('profile-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Compress Image
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300; // Small thumbnail size
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
                    
                    imgPreview.src = compressedBase64;
                    imgPreview.classList.remove('d-none');
                    defaultIcon.classList.add('d-none');
                    imgPreview.setAttribute('data-new-image', compressedBase64);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Load Orders
    const historyKey = `orders_${user.email}`;
    const orders = JSON.parse(localStorage.getItem(historyKey) || '[]');
    const historyContainer = document.getElementById('order-history-list');
    
    if (orders.length > 0) {
        historyContainer.innerHTML = '';
        orders.forEach(order => {
            const date = new Date(order.date).toLocaleDateString();
            const time = new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Calculate Item text
            const itemText = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
             // Find Restaurant Name safely
            const r = DB.restaurants.find(res => res.id === order.restaurantId);
            const rName = r ? r.name : 'Restaurant';

            const card = document.createElement('div');
            card.className = 'card mb-3 border-0 shadow-sm';
            card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <h6 class="fw-bold mb-0 text-dark">${rName}</h6>
                            <small class="text-muted">${date} at ${time}</small>
                        </div>
                        <span class="badge bg-success">${order.status}</span>
                    </div>
                    <p class="small text-muted mb-2 text-truncate">${itemText}</p>
                    <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                        <span class="fw-bold text-dark">Total Paid: ₹${order.total}</span>
                        <button class="btn btn-sm btn-outline-brand reorder-btn" data-order-id="${order.id}">Reorder</button>
                    </div>
                </div>
            `;
            historyContainer.appendChild(card);
        });

        // Reorder Logic (Simple: Add items to cart)
        document.querySelectorAll('.reorder-btn').forEach(btn => {
             btn.addEventListener('click', function() {
                 const orderId = parseInt(this.getAttribute('data-order-id'));
                 const order = orders.find(o => o.id === orderId);
                 if(order) {
                     // Check if different restaurant
                     const currentCart = Cart.getCart();
                     if (currentCart.length > 0 && currentCart[0].restaurantId !== order.restaurantId) {
                         if(!confirm('This will clear your current cart. Proceed?')) return;
                         Cart.clearCart();
                     }
                     // Add items
                     order.items.forEach(item => Cart.forceAddToCart(item, order.restaurantId));
                     Cart.showToast('Items added to cart');
                     setTimeout(() => window.location.href = 'cart.html', 1000);
                 }
             });
        });

    }

    // Handle Edit Profile
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('edit-name').value;
        const newPhone = document.getElementById('edit-phone').value;
        const newDob = document.getElementById('edit-dob').value;
        const newAddress = document.getElementById('edit-address').value;
        const newImage = imgPreview.getAttribute('data-new-image') || user.image;

        const updateData = { 
            name: newName,
            phone: newPhone,
            dob: newDob,
            address: newAddress,
            image: newImage
        };

        const res = Auth.updateProfile(updateData);
        if (res.success) {
            Cart.showToast('Profile updated!');
            document.getElementById('profile-name-display').textContent = newName;
            Auth.updateNavbar(); // Refresh navbar
        } else {
            Cart.showToast(res.message, 'error');
        }
    });
}

/* --- Home Page Logic --- */
function initHomePage() {
    const container = document.getElementById('restaurant-list');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('rating-filter');

    function renderRestaurants(list) {
        container.innerHTML = '';
        if (list.length === 0) {
            container.innerHTML = '<div class="col-12 text-center mt-5"><h3>No matches found</h3><p class="text-muted">Try looking for specific dishes!</p></div>';
            return;
        }

        list.forEach(r => {
            // Calculate Average Cost for One based on Menu
            let avgCost = 0;
            if (r.menu && r.menu.length > 0) {
                const total = r.menu.reduce((sum, item) => sum + item.price, 0);
                avgCost = Math.round(total / r.menu.length);
            } else {
                avgCost = 150; // Fallback
            }

            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-3 mb-4';
            card.innerHTML = `
                <div class="card h-100 restaurant-card shadow-sm border-0 hover-scale animate-fade-in-up">
                    <div class="position-relative">
                        <img src="${r.image}" class="card-img-top skeleton" alt="${r.name}" style="height: 200px; object-fit: cover;" onload="this.classList.remove('skeleton')" onerror="this.classList.remove('skeleton');this.onerror=null;this.src='https://placehold.co/600x400?text=${encodeURIComponent(r.name)}'">
                        <div class="position-absolute bottom-0 start-0 bg-white px-2 py-1 m-2 rounded shadow-sm fw-bold">
                            ${r.deliveryTime}
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h5 class="card-title mb-0 fw-bold text-truncate">${r.name}</h5>
                            <span class="badge bg-success"><i class="bi bi-star-fill"></i> ${r.rating}</span>
                        </div>
                        <p class="text-muted small text-truncate mb-0">${r.cuisine}</p>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                             <p class="text-muted small mb-0">${r.location}</p>
                             <p class="text-dark small fw-bold mb-0">₹${avgCost} for one</p>
                        </div>
                    </div>
                    <a href="restaurant.html?id=${r.id}" class="stretched-link"></a>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Initial Render
    renderRestaurants(DB.restaurants);

    // Search Handler
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterAndRender(query, filterSelect.value);
    });

    // Filter Handler
    filterSelect.addEventListener('change', (e) => {
        const minRating = e.target.value;
        filterAndRender(searchInput.value.toLowerCase(), minRating);
    });

    function filterAndRender(query, minRating) {
        let filtered = DB.restaurants.filter(r => {
            const basicMatch = r.name.toLowerCase().includes(query) || r.cuisine.toLowerCase().includes(query);
            // Deep Search: content of menu
            const menuMatch = r.menu.some(item => item.name.toLowerCase().includes(query));
            return basicMatch || menuMatch;
        });
        
        if (minRating !== 'all') {
            filtered = filtered.filter(r => r.rating >= parseFloat(minRating));
        }
        
        renderRestaurants(filtered);
    }
    // Smooth Scroll for Order Now (JS Fallback/Enforcement)
    const orderBtn = document.querySelector('a[href="#restaurant-list"]');
    if (orderBtn) {
        orderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('restaurant-list');
            if (target) {
                const headerOffset = 100;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    }
}

/* --- Restaurant Page Logic --- */
function initRestaurantPage() {
    const params = new URLSearchParams(window.location.search);
    const restId = parseInt(params.get('id'));
    const restaurant = DB.restaurants.find(r => r.id === restId);

    if (!restaurant) {
        document.getElementById('restaurant-details').innerHTML = '<div class="container mt-5 text-center"><h2>Restaurant not found</h2><a href="index.html" class="btn btn-primary">Go Home</a></div>';
        return;
    }

    // Render Header
    document.getElementById('res-name').textContent = restaurant.name;
    document.getElementById('res-cuisine').textContent = restaurant.cuisine;
    document.getElementById('res-location').textContent = restaurant.location;
    document.getElementById('res-rating').innerHTML = `<i class="bi bi-star-fill"></i> ${restaurant.rating}`;
    document.getElementById('res-time').textContent = restaurant.deliveryTime;
    document.getElementById('res-image').src = restaurant.image;

    // Render Menu
    const menuContainer = document.getElementById('menu-container');
    const vegFilter = document.getElementById('veg-filter');

    function renderMenu(onlyVeg = false) {
        menuContainer.innerHTML = '';
        const items = onlyVeg ? restaurant.menu.filter(i => i.type === 'veg') : restaurant.menu;

        if (items.length === 0) {
            menuContainer.innerHTML = '<div class="text-center p-4">No items available using current filters.</div>';
            return;
        }

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'list-group-item d-flex justify-content-between align-items-center p-3 border-0 border-bottom';
            const isVeg = item.type === 'veg';
            
            row.innerHTML = `
                <div class="flex-grow-1">
                    <div class="mb-1 d-flex align-items-center">
                        <i class="bi bi-circle-fill ${isVeg ? 'text-success' : 'text-danger'} small-icon me-2"></i>
                        ${item.image ? `<img src="${item.image}" alt="" class="rounded-circle me-2 border" style="width: 40px; height: 40px; object-fit: cover;">` : ''}
                        <span class="fw-bold">${item.name}</span>
                    </div>
                    <div class="text-muted small">₹${item.price}</div>
                    <div class="text-muted smaller description">${item.description}</div>
                </div>
                <div class="ms-3 position-relative" style="width: 120px; height: 100px;">
                    <!-- Placeholder image per item if needed, using general placeholders -->
                    <div class="position-absolute top-50 start-50 translate-middle w-100 text-center">
                       <button class="btn btn-outline-success fw-bold shadow-sm btn-sm px-4 add-btn" data-id="${item.id}">ADD</button>
                    </div>
                </div>
            `;
            menuContainer.appendChild(row);
        });

        // Add Event Listeners to Buttons
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.dataset.id);
                const item = restaurant.menu.find(i => i.id === itemId);
                Cart.addToCart(item, restaurant.id);
            });
        });
    }

    renderMenu();

    // Floating Cart Logic
    const floatingCartHtml = `
        <div id="floating-cart" class="floating-cart-bar hidden">
            <div class="d-flex flex-column">
                <span class="fw-bold" id="float-count">0 ITEMS</span>
                <small class="text-white-50" id="float-total">₹0</small>
            </div>
            <div class="d-flex align-items-center fw-bold">
                View Cart <i class="bi bi-arrow-right ms-2"></i>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', floatingCartHtml);
    const floatBar = document.getElementById('floating-cart');
    
    // Redirect on click
    floatBar.addEventListener('click', () => window.location.href = 'cart.html');

    function updateFloatingCart() {
        const cart = Cart.getCart();
        // Only show if cart has items from THIS restaurant
        if (cart.length > 0 && cart[0].restaurantId === restaurant.id) {
            const count = cart.reduce((sum, i) => sum + i.quantity, 0);
            const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            
            document.getElementById('float-count').textContent = `${count} ITEM${count > 1 ? 'S' : ''}`;
            document.getElementById('float-total').textContent = `₹${total} plus taxes`;
            
            floatBar.classList.remove('hidden');
        } else {
            floatBar.classList.add('hidden');
        }
    }

    // Hook into global Cart changes? 
    // Since Cart.saveCart calls updateBadge, we can't easily hook unless we modify Cart.js 
    // OR we just assume actions on this page trigger it.
    // Let's modify the btn listeners to call this.
    
    // Initial check
    updateFloatingCart();

    // Re-bind listeners to update Floating Cart
    // (We replaced listeners in renderMenu, so we need to ensure updateFloatingCart is called)
    // Actually, we can just observe localStorage? No, simpler to wrap the existing addToCart
    const originalAddToCart = Cart.addToCart.bind(Cart);
    // This is risky to monkey-patch. Better to just call it on click.

    document.getElementById('menu-container').addEventListener('click', (e) => {
        if(e.target.classList.contains('add-btn')) {
            // Wait slightly for Cart to update
            setTimeout(updateFloatingCart, 100);
        }
    });
}

/* --- Cart Page Logic --- */
function initCartPage() {
    const tableBody = document.getElementById('cart-items');
    const emptyMsg = document.getElementById('empty-cart-msg');
    const cartContent = document.getElementById('cart-content');
    const discountRow = document.getElementById('discount-row');
    const promoInput = document.getElementById('promo-code');
    const applyPromoBtn = document.getElementById('apply-promo');
    
    // Summary Els
    const elItemTotal = document.getElementById('item-total');
    const elDelivery = document.getElementById('delivery-fee');
    const elTax = document.getElementById('tax-fee');
    const elDiscount = document.getElementById('discount-amount');
    const elToPay = document.getElementById('to-pay');

    let currentPromo = null;

    function renderCart() {
        const cart = Cart.getCart();
        
        if (cart.length === 0) {
            cartContent.classList.add('d-none');
            emptyMsg.classList.remove('d-none');
            return;
        }

        cartContent.classList.remove('d-none');
        emptyMsg.classList.add('d-none');
        tableBody.innerHTML = '';

        cart.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="width: 50%">
                    <div class="d-flex align-items-center">
                        ${item.image ? `<img src="${item.image}" alt="" class="rounded me-3 border" style="width: 50px; height: 50px; object-fit: cover;">` : ''}
                        <div>
                             <div class="d-flex align-items-center mb-1">
                                <i class="bi bi-circle-fill ${item.type === 'veg' ? 'text-success' : 'text-danger'} me-2 small"></i>
                                <span class="fw-bold">${item.name}</span>
                             </div>
                        </div>
                    </div>
                </td>
                <td style="width: 30%">
                    <div class="btn-group btn-group-sm section-quantity">
                        <button class="btn btn-outline-secondary btn-qty" data-id="${item.id}" data-change="-1">-</button>
                        <span class="btn btn-white disabled border bg-white text-dark">${item.quantity}</span>
                        <button class="btn btn-outline-success btn-qty" data-id="${item.id}" data-change="1">+</button>
                    </div>
                </td>
                <td class="text-end">₹${item.price * item.quantity}</td>
                <td class="text-end"><button class="btn btn-sm text-danger btn-remove" data-id="${item.id}"><i class="bi bi-trash"></i></button></td>
            `;
            tableBody.appendChild(tr);
        });

        updateSummary();
    }

    function updateSummary() {
        const totals = Cart.getTotals(currentPromo);
        
        elItemTotal.textContent = `₹${totals.itemTotal}`;
        elDelivery.textContent = `₹${totals.deliveryFee}`;
        elTax.textContent = `₹${totals.tax}`;
        elToPay.textContent = `₹${totals.toPay}`;
        
        if (totals.discount > 0) {
            discountRow.classList.remove('d-none');
            elDiscount.textContent = `- ₹${totals.discount}`;
        } else {
            discountRow.classList.add('d-none');
        }
    }

    // Event Delegation for Cart Actions
    tableBody.addEventListener('click', (e) => {
        const btnQty = e.target.closest('.btn-qty');
        const btnRemove = e.target.closest('.btn-remove');

        if (btnQty) {
            const id = parseInt(btnQty.dataset.id);
            const change = parseInt(btnQty.dataset.change);
            Cart.updateQuantity(id, change);
            renderCart();
        }

        if (btnRemove) {
            const id = parseInt(btnRemove.dataset.id);
            Cart.removeItem(id);
            renderCart();
        }
    });

    // Promo Handler
    applyPromoBtn.addEventListener('click', () => {
        const code = promoInput.value.trim().toUpperCase();
        const totals = Cart.getTotals(null); // Check totals for min requirements
        
        // Validate promo first
        // Validate promo first
        const validation = Cart.validatePromo(code, Cart.getCart());
        if (!validation.valid) {
            Cart.showToast(validation.message, 'error');
            currentPromo = null;
            updateSummary();
            return;
        }

        // Apply
        currentPromo = code;
        const newTotals = Cart.getTotals(currentPromo);
        if(newTotals.discount > 0) {
             Cart.showToast('Promo code applied!');
        } else {
             Cart.showToast('Promo conditions not met');
             currentPromo = null;
        }
        updateSummary();
    });

    // Checkout
    // Checkout
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (!Auth.isAuthenticated()) {
            Cart.showToast('Please login to place order');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }
        
        // Cart.checkout handles saving logic
        if (Cart.checkout(currentPromo)) {
            Cart.showToast('Order Placed! Redirecting...');
            setTimeout(() => window.location.href = 'index.html', 2000); // Redirect to home or profile later
        } else {
             Cart.showToast('Checkout failed. Please try again.', 'error');
        }
    });

    renderCart();
}

/* --- Login Page Logic --- */
function initLoginPage() {
    if (Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Toggle between Login and Register
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-box').classList.add('d-none');
        document.getElementById('register-box').classList.remove('d-none');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-box').classList.add('d-none');
        document.getElementById('login-box').classList.remove('d-none');
    });

    // Handle Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        const res = Auth.login(email, pass);
        
        if (res.success) {
            Cart.showToast('Login successful! Redirecting...');
            setTimeout(() => window.location.href = 'index.html', 1000);
        } else {
            Cart.showToast(res.message, 'error');
        }
    });

    // Handle Register
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        
        const res = Auth.register(name, email, pass);
        if (res.success) {
            Cart.showToast('Registration successful! Redirecting...');
            setTimeout(() => window.location.href = 'index.html', 1000);
        } else {
            Cart.showToast(res.message, 'error');
        }
    });

    // Password Toggle Logic
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            }
        });
    });
}

/* --- Theme Logic --- */
function initFooterPopups() {
    const links = document.querySelectorAll('footer a');
    links.forEach(link => {
        const text = link.textContent.trim();
        
        // Skip Home if it is a standard link
        if (['Home'].includes(text)) return; 

        // Define content for popups
        const popupContent = {
            'About Us': { title: 'About DigiDine', body: 'DigiDine is a premium food delivery service connecting you with the best restaurants in town. We believe in quality, speed, and customer satisfaction.' },
            'Careers': { title: 'Join Our Team', body: 'We are always looking for passionate people to join our team. Send your resume to careers@digidine.com' },
            'Support': { title: 'Support', body: 'Need help with an order? Contact our support team at support@digidine.com or call 1800-123-456.' },
            'Help & Support': { title: 'Help & Support', body: 'Browse our FAQ or chat with us. We are here to help you 24/7.' },
            'Partner with us': { title: 'Partner with DigiDine', body: 'Grow your business with us. Reach thousands of new customers. Sign up today!' },
            'Ride with us': { title: 'Become a Delivery Partner', body: 'Earn money by delivering food with DigiDine. Flexible hours and great pay.' },
            'Terms': { title: 'Terms & Conditions', body: 'These are the terms and conditions...' },
            'Privacy': { title: 'Privacy Policy', body: 'We respect your privacy...' },
            'Terms & Conditions': { title: 'Terms & Conditions', body: 'These are the terms and conditions...' },
            'Privacy Policy': { title: 'Privacy Policy', body: 'We respect your privacy...' }
        };

        if (popupContent[text]) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showModal(popupContent[text].title, popupContent[text].body);
            });
        }
    });

    // App Store Buttons
    document.querySelectorAll('.app-store-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const isApple = btn.querySelector('.bi-apple');
            const store = isApple ? 'App Store' : 'Play Store';
            showModal(
                `Coming Soon to ${store}! 🚀`,
                `We're cooking up something special! The DigiDine app will be available on your mobile device very soon. Stay tuned for exclusive app-only deals! 📱🍕`
            );
        });
    });

    // Social Media Icons
    const socialLinks = document.querySelectorAll('footer .bi-facebook, footer .bi-instagram, footer .bi-twitter, footer .bi-youtube');
    socialLinks.forEach(icon => {
        const link = icon.closest('a');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                Cart.showToast('Social media pages coming soon!');
            });
        }
    });
}

function showModal(title, bodyText) {
    // Remove existing modal if any
    const existingModal = document.getElementById('dynamic-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHtml = `
    <div class="modal fade" id="dynamic-modal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-white">
                <div class="modal-header border-bottom-0">
                    <h5 class="modal-title fw-bold">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-muted">
                    <p>${bodyText}</p>
                </div>
                <div class="modal-footer border-top-0">
                    <button type="button" class="btn btn-brand" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('dynamic-modal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

/* --- Global Image Error Handling --- */
window.addEventListener('error', function(e) {
    if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
        // Only replace if it's not already a placeholder to avoid infinite loops
        if (!e.target.src.includes('placehold.co')) {
             e.target.src = 'https://placehold.co/100x100?text=Food';
        }
    }
}, true);
function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = toggleBtn ? toggleBtn.querySelector('i') : null;

    // Check localStorage
    const savedTheme = localStorage.getItem('digidine-theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        if(icon) icon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
             e.preventDefault(); // Prevent default if in form or link
             if (body.classList.contains('dark-theme')) {
                 body.classList.remove('dark-theme');
                 localStorage.setItem('digidine-theme', 'light');
                 if(icon) icon.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
             } else {
                 body.classList.add('dark-theme');
                 localStorage.setItem('digidine-theme', 'dark');
                 if(icon) icon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
             }
        });
    }
}

/* --- Navigation & Global Interactions --- */
function updateActiveNavItem() {
    // 1. Get current normalized path
    const wPath = window.location.pathname;
    const wPage = wPath.split('/').pop().split('#')[0].split('?')[0] || 'index.html';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        
        let href = link.getAttribute('href');
        if (!href) return;
        
        // Normalize href
        const lPage = href.split('/').pop().split('#')[0].split('?')[0];

        // 2. Logic to match
        // If we are on home (index.html or empty), match specific links
        if (wPage === 'index.html' || wPage === '') {
            if ((lPage === 'index.html' || lPage === '' || lPage === '#') && 
                !link.textContent.includes('Search') && 
                !link.textContent.includes('Offers')) {
                link.classList.add('active');
            }
        } 
        // If on other pages (cart, login, restaurant), match exactly
        else {
             if (lPage === wPage) {
                 link.classList.add('active');
             }
        }
    });

    // 3. Special override for "Home" text if needed, but handled above
    // 4. Ensure Cart is highlighted if active (redundancy check)
    if (wPage === 'cart.html') {
         const cartBtn = document.querySelector('a[href*="cart.html"]');
         if(cartBtn) cartBtn.classList.add('active');
    }
}

function initNavigationHandlers() {
    // Search Handler
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent.includes('Search')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleSearchClick();
            });
        }
        if (link.textContent.includes('Offers')) {
             link.addEventListener('click', (e) => {
                e.preventDefault();
                showOffersModal();
            });
        }
    });
}

function handleSearchClick() {
    const isHome = document.body.id === 'page-home';
    if (isHome) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => searchInput.focus(), 500); 
        }
    } else {
        window.location.href = 'index.html#search-input';
    }
}

function showOffersModal() {
    const codes = Object.entries(Cart.PROMOS).map(([code, details]) => {
        const desc = details.type === 'percent' ? `${details.value}% OFF (Max ₹${details.max})` : `Flat ₹${details.value} OFF (Min Order ₹${details.min})`;
        const restLimit = details.restaurantId ? `<br><small class="text-warning">On specific restaurant only</small>` : '';
        return `
            <div class="col-md-6 mb-3">
                <div class="border rounded p-3 text-center position-relative bg-light h-100 dashed-border">
                    <h5 class="fw-bold text-success mb-1">${code}</h5>
                    <p class="small text-muted mb-2">${desc}${restLimit}</p>
                    <button class="btn btn-sm btn-outline-secondary copy-btn" data-code="${code}">Copy Code</button>
                </div>
            </div>
        `;
    }).join('');

    const body = `
        <div class="row">
            ${codes}
        </div>
        <div class="mt-3 text-center small text-muted">
            Apply these codes at checkout!
        </div>
    `;

    showModal('Available Offers', body);

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const code = this.getAttribute('data-code');
            navigator.clipboard.writeText(code);
            const originalText = this.textContent;
            this.textContent = 'Copied!';
            this.className = 'btn btn-sm btn-success copy-btn text-white';
            setTimeout(() => {
                this.textContent = originalText;
                this.className = 'btn btn-sm btn-outline-secondary copy-btn';
            }, 1500);
        });
    });
}

// Enhance Home Page Init to handle hash for search
if (typeof initHomePage !== 'undefined') {
    const originalInitHomePage = initHomePage;
    initHomePage = function() {
        originalInitHomePage();
        if (window.location.hash === '#search-input') {
            setTimeout(() => {
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    searchInput.focus();
                }
            }, 500);
        }
    };
}
