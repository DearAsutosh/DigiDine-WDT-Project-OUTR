/* Main Application Logic */
let socket;

function initSocket() {
    if (typeof io === 'undefined') {
        console.warn('Socket.IO not loaded. Real-time updates disabled.');
        return;
    }
    socket = io();
    const user = Auth.getCurrentUser();
    
    // Safety check: Join room even if role is missing (default to customer behavior)
    if (user && (!user.role || user.role === 'customer')) {
        console.log(`[SOCKET] Attempting to join user room: user_${user.email}`);
        socket.emit('join_user_room', user.email);
        
        socket.on('ORDER_STATUS_UPDATE', (data) => {
            console.log('[SOCKET] Received ORDER_STATUS_UPDATE:', data);
            Cart.showToast(`Order #${data.orderId.toString().slice(-6)} updated to: ${data.status}`, 'info');
            
            // If user is on profile page, refresh history
            if (document.body.id === 'page-profile' && typeof loadOrderHistory === 'function') {
                console.log('[SOCKET] Refreshing order history...');
                loadOrderHistory();
            }
        });
    }

    socket.on('connect', () => console.log('[SOCKET] Connected to server'));
    socket.on('connect_error', (err) => console.error('[SOCKET] Connection error:', err));
}

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Socket Init
    initSocket();

    // 0. Route Guard (Run immediately)
    Auth.checkAccess();

    // 1. Backend Data Init
    await DB.init();

    // 2. Global Init
    Auth.updateNavbar();
    updateActiveNavItem(); // Highlight active nav
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
        case 'page-offers':
            initOffersPage();
            break;
        case 'page-profile':
            initProfilePage();
            break;
    }
});

/* --- Offers Page Logic --- */
async function initOffersPage() {
    const listContainer = document.getElementById('offers-list');
    
    try {
        const offers = await ApiClient.getOffers();
        listContainer.innerHTML = '';

        if (offers.length === 0) {
            listContainer.innerHTML = '<div class="col-12 text-center p-5"><h3 class="text-muted">No active offers at the moment.</h3></div>';
            return;
        }

        offers.forEach(offer => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-4';
            card.innerHTML = `
                <div class="card border-0 shadow-sm h-100 offer-card animate-fade-in-up">
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <img src="${offer.image}" alt="" style="width: 50px; height: 50px;">
                            <span class="badge bg-brand-light text-brand fw-bold">${offer.tag}</span>
                        </div>
                        <h5 class="fw-bold mb-1">${offer.title}</h5>
                        <p class="text-muted small mb-3">${offer.description}</p>
                        
                        <div class="mt-auto border-top pt-3">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="bg-light px-3 py-2 rounded border border-dashed text-uppercase fw-bold small" style="letter-spacing: 1px;">
                                    ${offer.code}
                                </div>
                                <button class="btn btn-sm btn-brand copy-btn" data-code="${offer.code}">COPY</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            listContainer.appendChild(card);
        });

        // Copy Logic
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const code = this.dataset.code;
                navigator.clipboard.writeText(code).then(() => {
                    const originalText = this.innerText;
                    this.innerText = 'COPIED!';
                    this.classList.replace('btn-brand', 'btn-success');
                    setTimeout(() => {
                        this.innerText = originalText;
                        this.classList.replace('btn-success', 'btn-brand');
                    }, 2000);
                });
            });
        });

    } catch (error) {
        console.error('Failed to load offers:', error);
        listContainer.innerHTML = '<div class="alert alert-danger">Failed to load offers. Please try again later.</div>';
    }
}

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

    // Load Orders Helper is now global
    loadOrderHistory();

    loadOrderHistory();

    // Handle Edit Profile
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
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

        const res = await Auth.updateProfile(updateData);
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
                        <p class="text-muted small text-truncate mb-2">${r.cuisine}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                             <p class="text-muted small mb-0"><i class="bi bi-geo-alt-fill"></i> ${r.location}</p>
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

    // --- Customer Love Marquee ---
    (async function renderReviews() {
        try {
            const reviews = await ApiClient.getRestaurantReviews(restId);
            if (!reviews || reviews.length === 0) return;

            const reviewHtml = reviews.map(r => `
                <div class="d-inline-block bg-white border border-brand rounded p-3 me-3 shadow-sm align-top" style="min-width: 250px; max-width: 300px; white-space: normal;">
                    <div class="d-flex align-items-center mb-1">
                        <span class="text-warning small me-2">${'★'.repeat(r.rating)}</span>
                        <span class="fw-bold small text-dark">- ${r.user}</span>
                    </div>
                    <p class="small text-muted mb-0 fst-italic">"${r.feedback}"</p>
                </div>
            `).join('');

            // Marquee Container
            const marqueeSection = document.createElement('div');
            marqueeSection.className = 'w-100 py-4 bg-light border-bottom mb-5 overflow-hidden';
            marqueeSection.innerHTML = `
                <div class="container mb-3">
                    <h5 class="fw-bold text-brand"><i class="bi bi-heart-fill me-2"></i>Customer Love</h5>
                </div>
                <!-- Inline CSS Marquee -->
                <div style="width: 100%; overflow: hidden; position: relative;">
                    <style>
                        @keyframes marquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .marquee-track {
                            display: flex;
                            width: max-content;
                            animation: marquee 40s linear infinite;
                        }
                        .marquee-track:hover { animation-play-state: paused; }
                    </style>
                    <div class="marquee-track px-2">
                        ${reviewHtml}
                        <!-- Duplicate for seamless loop -->
                        ${reviewHtml}
                    </div>
                </div>
            `;
            
            // Insert BEFORE the main container (move up DOM tree)
            const menuContainer = document.getElementById('menu-container');
            const mainContainer = menuContainer.closest('.container');
            if(mainContainer) {
                mainContainer.parentNode.insertBefore(marqueeSection, mainContainer);
            } else {
                 // Fallback
                 menuContainer.parentNode.insertBefore(marqueeSection, menuContainer);
            }

        } catch (e) {
            console.error('Failed to load reviews:', e);
        }
    })();

    // Veg Filter Handler
    if (vegFilter) {
        vegFilter.addEventListener('change', (e) => {
            renderMenu(e.target.checked);
        });
    }

    // Floating Cart Removed as per user request
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
    applyPromoBtn.addEventListener('click', async () => {
        const code = promoInput.value.trim().toUpperCase();
        
        // Validate promo first via backend
        const validation = await Cart.validatePromo(code, Cart.getCart());
        if (!validation.valid) {
            Cart.showToast(validation.message, 'error');
            currentPromo = null;
            updateSummary();
            return;
        }

        // Apply returned promo object
        currentPromo = validation.promo;
        const newTotals = Cart.getTotals(currentPromo);
        if(newTotals.discount > 0) {
             Cart.showToast('Promo code applied!');
        } else {
             // This shouldn't happen if server validated it, but for safety:
             Cart.showToast('Promo conditions not met for this cart total');
             currentPromo = null;
        }
        updateSummary();
    });

    // Checkout
    document.getElementById('checkout-btn').addEventListener('click', async () => {
        if (!Auth.isAuthenticated()) {
            Cart.showToast('Please login to place order');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }
        
        // Cart.checkout handles backend saving logic
        const res = await Cart.checkout(currentPromo);
        if (res.success) {
            Cart.showToast('Order Placed! Redirecting...');
            setTimeout(() => window.location.href = 'profile.html', 2000); // Redirect to profile to see orders
        } else {
             Cart.showToast(res.message || 'Checkout failed. Please try again.', 'error');
        }
    });

    // View Coupons Logic
    const viewCouponsBtn = document.getElementById('view-coupons-btn');
    const modalCouponsList = document.getElementById('modal-coupons-list');
    const couponModal = new bootstrap.Modal(document.getElementById('couponModal'));

    viewCouponsBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        modalCouponsList.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-brand" role="status"></div></div>';
        couponModal.show();

        try {
            const offers = await ApiClient.getOffers();
            const cart = Cart.getCart();
            const subtotal = Cart.getTotals().itemTotal;
            const restaurantId = cart.length > 0 ? cart[0].restaurantId : null;

            modalCouponsList.innerHTML = '';
            
            if (offers.length === 0) {
                modalCouponsList.innerHTML = '<div class="text-center p-4">No coupons available right now.</div>';
                return;
            }

            offers.forEach(offer => {
                // Check eligibility for UI (visual indicator only, server validates again)
                const isRestMatch = !offer.restaurantId || offer.restaurantId === restaurantId;
                const isMinMatch = !offer.minOrder || subtotal >= offer.minOrder;
                const isEligible = isRestMatch && isMinMatch;

                const col = document.createElement('div');
                col.className = 'col-md-6 mb-3';
                col.innerHTML = `
                    <div class="card border h-100 ${!isEligible ? 'opacity-75 bg-light' : ''}">
                        <div class="card-body p-3">
                            <div class="d-flex align-items-center mb-2">
                                <img src="${offer.image}" alt="" style="width: 30px; height: 30px;" class="me-2">
                                <span class="fw-bold text-uppercase small">${offer.code}</span>
                            </div>
                            <h6 class="fw-bold mb-1 small">${offer.title}</h6>
                            <p class="text-muted mb-3" style="font-size: 0.75rem;">${offer.description}</p>
                            ${!isEligible ? 
                                `<small class="text-danger d-block mb-2" style="font-size: 0.7rem;">
                                    ${!isRestMatch ? 'Not valid for this restaurant' : `Min order value: ₹${offer.minOrder}`}
                                </small>` : ''
                            }
                            <button class="btn btn-sm ${isEligible ? 'btn-outline-brand' : 'btn-secondary disabled'} w-100 select-coupon-btn" 
                                data-code="${offer.code}" ${!isEligible ? 'disabled' : ''}>
                                APPLY COUPON
                            </button>
                        </div>
                    </div>
                `;
                modalCouponsList.appendChild(col);
            });

            // Select Coupon Listener
            modalCouponsList.querySelectorAll('.select-coupon-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const code = this.dataset.code;
                    promoInput.value = code;
                    couponModal.hide();
                    applyPromoBtn.click(); // Trigger the existing apply logic
                });
            });

        } catch (error) {
            console.error('Failed to fetch coupons for modal:', error);
            modalCouponsList.innerHTML = '<div class="alert alert-danger mx-2">Error loading coupons.</div>';
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

    // Role Selection Toggle
    const roleSelectors = document.getElementsByName('role');
    const restaurantGroup = document.getElementById('restaurant-name-group');
    
    roleSelectors.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'owner') {
                restaurantGroup.classList.remove('d-none');
            } else {
                restaurantGroup.classList.add('d-none');
            }
        });
    });

    // Helper for redirection
    const redirectUser = (user) => {
        if (user.role === 'owner') {
            window.location.href = 'owner-dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    };

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        const res = await Auth.login(email, pass);
        
        if (res.success) {
            Cart.showToast('Login successful! Redirecting...');
            setTimeout(() => redirectUser(res.user), 1000);
        } else {
            Cart.showToast(res.message, 'error');
        }
    });

    // Handle Register
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const role = document.querySelector('input[name="role"]:checked').value;
        const restaurantName = document.getElementById('reg-restaurant').value;
        const restaurantLocation = document.getElementById('reg-location').value;
        
        const res = await Auth.register(name, email, pass, role, restaurantName, restaurantLocation);
        if (res.success) {
            Cart.showToast('Registration successful! Redirecting...');
            setTimeout(() => redirectUser(res.user), 1000);
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

function showOrderTrackingModal(order) {
    if (!order.statusHistory) {
        showModal('Order Tracking', 'No tracking history available for this order.');
        return;
    }

    const timelineHtml = order.statusHistory.map((step, index) => {
        const date = new Date(step.timestamp).toLocaleDateString();
        const time = new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isActive = index === order.statusHistory.length - 1;
        
        return `
            <div class="d-flex position-relative pb-4">
                ${index < order.statusHistory.length - 1 ? '<div class="position-absolute border-start border-2 h-100" style="left: 11px; top: 15px; border-color: #dee2e6 !important;"></div>' : ''}
                <div class="rounded-circle ${isActive ? 'bg-success' : 'bg-secondary'} mt-1" style="width: 24px; height: 24px; z-index: 1; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    <i class="bi bi-check2 text-white small"></i>
                </div>
                <div class="ms-3">
                    <h6 class="mb-0 fw-bold ${isActive ? 'text-success' : ''}">${step.status.replace(/_/g, ' ')}</h6>
                    <small class="text-muted d-block">${date} at ${time}</small>
                    <p class="small mb-0 mt-1">${step.message}</p>
                </div>
            </div>
        `;
    }).reverse().join('');

    const body = `
        <div class="order-tracking-timeline py-2">
            ${timelineHtml}
        </div>
        <div class="mt-3 p-3 bg-light rounded-3">
            <div class="d-flex justify-content-between mb-1">
                <span class="small text-muted">Order ID</span>
                <span class="small fw-bold">#${order.id}</span>
            </div>
            <div class="d-flex justify-content-between">
                <span class="small text-muted">Email</span>
                <span class="small fw-bold text-truncate ms-2">${order.userEmail}</span>
            </div>
        </div>
    `;

    showModal('Order Status Tracking', body);
}

/* --- Navigation Helpers --- */
function updateActiveNavItem() {
    const pageId = document.body.id;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === 'index.html' && pageId === 'page-home') link.classList.add('active');
        if (href === 'offers.html' && pageId === 'page-offers') link.classList.add('active');
        if (href === 'profile.html' && pageId === 'page-profile') link.classList.add('active');
    });
}

function initNavigationHandlers() {
    // Placeholder for search/offers redirection if needed
    console.log('Navigation handlers initialized');
}

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = themeToggle.querySelector('i');
        if (icon) icon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
        else if (themeToggle.querySelector('.bi-moon-stars')) themeToggle.querySelector('.bi-moon-stars').classList.replace('bi-moon-stars', 'bi-sun');
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

/**
 * --- Global Helper: Status Badge ---
 */
function getStatusBadge(status) {
    let color = 'secondary';
    let display = status || 'PENDING';
    switch(status) {
        case 'PENDING': color = 'warning'; display = 'Pending'; break;
        case 'CONFIRMED': color = 'info'; display = 'Confirmed'; break;
        case 'PREPARING': color = 'primary'; display = 'Preparing'; break;
        case 'READY': color = 'info'; display = 'Ready'; break;
        case 'OUT_FOR_DELIVERY': color = 'warning'; display = 'Out for Delivery'; break;
        case 'DELIVERED': color = 'success'; display = 'Delivered'; break;
        case 'REJECTED': color = 'danger'; display = 'Rejected'; break;
    }
    return `<span class="badge bg-${color}-subtle text-${color} border border-${color}-subtle rounded-pill small">${display}</span>`;
}

/**
 * --- Global: Load Order History ---
 * Made global to be accessible by Socket.IO
 */
async function loadOrderHistory() {
    const user = Auth.getCurrentUser();
    const historyContainer = document.getElementById('order-history-list');
    
    if (!user || !historyContainer) return; // Not on profile page or not logged in

    try {
        const orders = await ApiClient.getOrderHistory(user.email);
        
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
                
                // Action Buttons Logic
                let actionBtns = `
                    <button class="btn btn-sm btn-outline-secondary track-btn" data-order-id="${order.id}">Track</button>
                    <button class="btn btn-sm btn-outline-brand reorder-btn" data-order-id="${order.id}">Reorder</button>
                `;

                if (order.status === 'DELIVERED' && !order.isRated) {
                    actionBtns = `
                        <button class="btn btn-sm btn-warning text-white rate-btn" data-order-id="${order.id}" data-rest-name="${rName}"><i class="bi bi-star-fill me-1"></i>Rate</button>
                        <button class="btn btn-sm btn-outline-brand reorder-btn" data-order-id="${order.id}">Reorder</button>
                    `;
                } else if (order.isRated) {
                     actionBtns = `
                        <span class="badge bg-light text-warning border align-self-center me-2"><i class="bi bi-star-fill"></i> ${order.rating}</span>
                        <button class="btn btn-sm btn-outline-brand reorder-btn" data-order-id="${order.id}">Reorder</button>
                    `;
                }

                card.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <h6 class="fw-bold mb-0 text-dark">${rName}</h6>
                                <small class="text-muted">${date} at ${time}</small>
                            </div>
                            ${getStatusBadge(order.status)}
                        </div>
                        <p class="small text-muted mb-2 text-truncate">${itemText}</p>
                        <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                            <span class="fw-bold text-dark">₹${order.total}</span>
                            <div class="btn-group">
                                ${actionBtns}
                            </div>
                        </div>
                    </div>
                `;
                historyContainer.appendChild(card);
            });

            // Event Listeners for Dynamic Buttons
            
            // Rate Logic
            document.querySelectorAll('.rate-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const oid = this.dataset.orderId;
                    const rName = this.dataset.restName;
                    showRatingModal(oid, rName);
                });
            });

            // Track Logic
            document.querySelectorAll('.track-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-order-id');
                    const order = orders.find(o => o.id == orderId);
                    if (order) showOrderTrackingModal(order);
                });
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
        } else {
            historyContainer.innerHTML = '<div class="text-center p-4 text-muted">No orders found yet.</div>';
        }
    } catch (error) {
        console.error('Failed to load orders:', error);
        historyContainer.innerHTML = '<div class="alert alert-danger">Failed to load order history.</div>';
    }
}



function initFooterPopups() {
    // Placeholder for footer links
}

/**
 * --- Global: Rating Modal ---
 */
function showRatingModal(orderId, restaurantName) {
    // Remove existing if any
    const existing = document.getElementById('rating-modal');
    if (existing) existing.remove();

    const modalHtml = `
    <div class="modal fade" id="rating-modal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content text-center">
                <div class="modal-header border-0 pb-0 justify-content-end">
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body pb-4">
                    <h5 class="fw-bold mb-3">Rate your food from<br><span class="text-brand">${restaurantName}</span></h5>
                    <div class="rating-stars mb-4 fs-1 text-muted" style="cursor: pointer;">
                        <i class="bi bi-star" data-val="1"></i>
                        <i class="bi bi-star" data-val="2"></i>
                        <i class="bi bi-star" data-val="3"></i>
                        <i class="bi bi-star" data-val="4"></i>
                        <i class="bi bi-star" data-val="5"></i>
                    </div>
                    <textarea class="form-control mb-3" placeholder="Tell us more... (Optional)" rows="2"></textarea>
                    <button class="btn btn-brand w-100 disabled" id="submit-rating-btn">Submit Rating</button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('rating-modal');
    const modal = new bootstrap.Modal(modalEl);
    const submitBtn = document.getElementById('submit-rating-btn');
    const stars = modalEl.querySelectorAll('.bi-star, .bi-star-fill');
    let selectedRating = 0;

    // Star Click Logic
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            if(selectedRating) return; 
            const val = parseInt(this.dataset.val);
            highlightStars(val);
        });
        
        star.addEventListener('mouseout', function() {
             if(selectedRating) highlightStars(selectedRating);
             else highlightStars(0);
        });

        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.val);
            highlightStars(selectedRating);
            submitBtn.classList.remove('disabled');
        });
    });

    function highlightStars(count) {
        stars.forEach(s => {
            const val = parseInt(s.dataset.val);
            if (val <= count) {
                s.classList.remove('bi-star');
                s.classList.add('bi-star-fill', 'text-warning');
            } else {
                s.classList.remove('bi-star-fill', 'text-warning');
                s.classList.add('bi-star');
            }
        });
    }

    // Submit Logic
    submitBtn.addEventListener('click', async () => {
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        const feedback = modalEl.querySelector('textarea').value;
        try {
            const res = await ApiClient.rateOrder(orderId, selectedRating, feedback);
            modal.hide();
            Cart.showToast('Thanks for your feedback!');
            // Refresh order history if on profile page
            if (typeof loadOrderHistory === 'function') loadOrderHistory();
            // Refresh home page if active to show new rating
            if (document.body.id === 'page-home') initHomePage();
        } catch (error) {
            console.error(error);
            Cart.showToast(error.message, 'error');
            submitBtn.innerText = 'Submit Rating';
        }
    });

    modal.show();
}
