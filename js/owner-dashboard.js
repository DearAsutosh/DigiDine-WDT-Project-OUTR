/* Owner Dashboard Logic */

// --- Global Socket Init ---
let socket;
function initSocket() {
    if (typeof io === 'undefined') {
        console.warn('Socket.IO not loaded. Real-time updates disabled.');
        return;
    }
    socket = io();
    const user = Auth.getCurrentUser();
    if (user && user.restaurantId) {
        console.log(`[SOCKET] Joining restaurant room: restaurant_${user.restaurantId}`);
        socket.emit('join_restaurant_room', user.restaurantId);
        
        socket.on('NEW_ORDER', (order) => {
            console.log('[SOCKET] Received NEW_ORDER:', order);
            Cart.showToast(`New Order Received! #${order.id.toString().slice(-6)}`, 'success');
            if (currentTab === 'incoming') {
                loadOrders();
            }
            updateAnalytics();
        });
    }

    socket.on('connect', () => console.log('[SOCKET] Dashboard connected'));
    socket.on('connect_error', (err) => console.error('[SOCKET] Dashboard connection error:', err));
}

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = themeToggle.querySelector('i');
        if (icon) icon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (isDark) icon.classList.replace('bi-moon-stars-fill', 'bi-sun-fill');
            else icon.classList.replace('bi-sun-fill', 'bi-moon-stars-fill');
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // 0. UI Init
    initTheme();
    initSocket();

    // 1. Auth Guard
    if (!Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const user = Auth.getCurrentUser();
    if (user.role !== 'owner' && user.role !== 'restaurant_owner') {
        window.location.href = 'index.html';
        return;
    }

    // 2. Global UI Init
    const nameEl = document.getElementById('owner-name');
    if (nameEl) nameEl.textContent = user.name;
    initOrdersTab();
    initMenuTab();
    initAnalytics();
    initFeedbacksTab();
});

// --- Constants ---
const ORDER_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PREPARING: 'PREPARING',
    READY: 'READY',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    REJECTED: 'REJECTED'
};

const NEXT_STATUS = {
    'CONFIRMED': 'PREPARING',
    'PREPARING': 'READY',
    'READY': 'OUT_FOR_DELIVERY',
    'OUT_FOR_DELIVERY': 'DELIVERED'
};

// --- Orders Logic ---
let pendingRejectOrderId = null;
let currentTab = 'incoming';
let loadOrders;

async function initOrdersTab() {
    const container = document.getElementById('orders-container');
    const filterBtns = document.querySelectorAll('[data-tab]');

    loadOrders = async () => {
        container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-brand" role="status"></div></div>';
        try {
            const user = Auth.getCurrentUser();
            const orders = await ApiClient.getOwnerOrders(user.email);
            
            let filteredOrders = [];
            if (currentTab === 'incoming') {
                filteredOrders = orders.filter(o => o.status === ORDER_STATUS.PENDING);
            } else if (currentTab === 'active') {
                filteredOrders = orders.filter(o => [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.OUT_FOR_DELIVERY].includes(o.status));
            } else {
                filteredOrders = orders.filter(o => [ORDER_STATUS.DELIVERED, ORDER_STATUS.REJECTED].includes(o.status));
            }

            container.innerHTML = '';
            if (filteredOrders.length === 0) {
                container.innerHTML = `<div class="col-12 text-center p-5 text-muted animate-fade-in"><i class="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>No ${currentTab} orders found.</div>`;
                return;
            }

            filteredOrders.forEach(order => {
                const card = createOrderCard(order);
                container.appendChild(card);
            });
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">Failed to load orders.</div>';
        }
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            loadOrders();
        });
    });

    // Rejection Modal Setup
    const rejectModal = new bootstrap.Modal(document.getElementById('rejectModal'));
    const confirmRejectBtn = document.getElementById('confirm-reject-btn');
    const rejectReasonSelect = document.getElementById('reject-reason-select');
    const rejectReasonCustom = document.getElementById('reject-reason-custom');

    confirmRejectBtn.onclick = async () => {
        const reason = rejectReasonSelect.value === 'other' ? rejectReasonCustom.value : rejectReasonSelect.value;
        if (!reason) {
            Cart.showToast('Please provide a reason', 'error');
            return;
        }

        const user = Auth.getCurrentUser();
        try {
            const res = await ApiClient.rejectOrder(pendingRejectOrderId, user.email, reason);
            Cart.showToast(res.message);
            rejectModal.hide();
            loadOrders();
            updateAnalytics();
        } catch (error) {
            Cart.showToast(error.message, 'error');
        }
    };

    window.openRejectModal = (orderId) => {
        pendingRejectOrderId = orderId;
        rejectReasonCustom.value = '';
        rejectModal.show();
    };

    loadOrders();
}

function createOrderCard(order) {
    const div = document.createElement('div');
    div.className = 'col-md-6 col-lg-4 mb-4 animate-fade-in-up';
    
    const itemsList = order.items.map(i => `<li>${i.quantity}x ${i.name}</li>`).join('');
    const statusBadge = `<span class="badge ${getStatusClass(order.status)}">${order.status.replace(/_/g, ' ')}</span>`;
    
    let actionButtons = '';
    if (order.status === ORDER_STATUS.PENDING) {
        actionButtons = `
            <div class="d-flex gap-2 mt-3">
                <button class="btn btn-sm btn-success flex-grow-1 py-2 fw-bold" onclick="handleOrderAction('${order.id}', 'accept')">ACCEPT</button>
                <button class="btn btn-sm btn-outline-danger flex-grow-1 py-2 fw-bold" onclick="openRejectModal('${order.id}')">REJECT</button>
            </div>
        `;
    } else if (NEXT_STATUS[order.status]) {
        const next = NEXT_STATUS[order.status];
        actionButtons = `
            <button class="btn btn-sm btn-brand w-100 mt-3 py-2 fw-bold" onclick="handleOrderAction('${order.id}', 'update', '${next}')">
                MARK AS ${next.replace(/_/g, ' ')}
            </button>
        `;
    }

    // Rating Display Logic
    let ratingHtml = '';
    if (order.isRated) {
        ratingHtml = `
            <div class="mt-3 pt-3 border-top">
                <div class="d-flex align-items-center mb-1">
                    <span class="text-muted small me-2">Rating:</span>
                    <span class="text-warning">
                        ${'★'.repeat(order.rating)}${'☆'.repeat(5 - order.rating)}
                    </span>
                    <span class="fw-bold ms-1 text-dark">${order.rating}.0</span>
                </div>
                ${order.feedback ? `<div class="bg-light p-2 rounded small text-muted fst-italic">"${order.feedback}"</div>` : ''}
            </div>
        `;
    }

    div.innerHTML = `
        <div class="card h-100 border-0 shadow-sm order-card hover-scale">
            <div class="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center pt-3 px-3">
                <span class="fw-bold">#${order.id.toString().slice(-6)}</span>
                ${statusBadge}
            </div>
            <div class="card-body px-3 pb-3 pt-1">
                <div class="d-flex justify-content-between mb-2">
                    <small class="text-muted">${new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                    <small class="text-muted fw-bold">₹${order.total}</small>
                </div>
                <ul class="list-unstyled small mb-0 text-muted ps-2 border-start border-3 border-light">
                    ${itemsList}
                </ul>
                ${actionButtons}
                ${ratingHtml}
            </div>
        </div>
    `;
    return div;
}

window.handleOrderAction = async (orderId, action, nextStatus = '') => {
    const user = Auth.getCurrentUser();
    try {
        let res;
        if (action === 'accept') {
            res = await ApiClient.acceptOrder(orderId, user.email);
        } else if (action === 'update') {
            res = await ApiClient.updateOwnerOrderStatus(orderId, user.email, nextStatus);
        }

        Cart.showToast(res.message);
        loadOrders(); // Refresh current tab list
        updateAnalytics(); // Refresh stats
    } catch (error) {
        Cart.showToast(error.message, 'error');
    }
};

function getStatusClass(status) {
    switch (status) {
        case 'PENDING': return 'bg-warning text-dark';
        case 'CONFIRMED': return 'bg-info text-dark';
        case 'PREPARING': return 'bg-primary text-white';
        case 'READY': return 'bg-success text-white';
        case 'OUT_FOR_DELIVERY': return 'bg-dark text-white';
        case 'DELIVERED': return 'bg-secondary text-white';
        case 'REJECTED': return 'bg-danger text-white';
        default: return 'bg-light text-dark';
    }
}

// --- Menu Logic ---
async function initMenuTab() {
    const tableBody = document.getElementById('menu-table-body');
    const form = document.getElementById('menu-item-form');
    let restaurants = await ApiClient.getRestaurants();
    const user = Auth.getCurrentUser();
    const myRestaurant = restaurants.find(r => r.id === user.restaurantId);

    const loadMenu = () => {
        if (!myRestaurant) return;
        tableBody.innerHTML = '';
        myRestaurant.menu.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.image || 'https://via.placeholder.com/80'}" class="menu-item-img me-3">
                        <div>
                            <div class="fw-bold">${item.name}</div>
                            <div class="text-muted small">${item.description}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${item.type === 'veg' ? 'bg-success' : 'bg-danger'}">${item.type}</span></td>
                <td>₹${item.price}</td>
                <td><span class="badge bg-light text-success border border-success">In Stock</span></td>
                <td>
                    <button class="btn btn-sm btn-light border me-2" onclick="editMenuItem(${item.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-light border text-danger" onclick="deleteMenuItem(${item.id})"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const itemData = {
            name: document.getElementById('item-name').value,
            price: parseInt(document.getElementById('item-price').value),
            type: document.getElementById('item-type').value,
            description: document.getElementById('item-desc').value,
            image: document.getElementById('item-image').value
        };

        const itemId = document.getElementById('item-id').value;
        try {
            if (itemId) {
                await ApiClient.updateMenuItem(itemId, user.email, itemData);
            } else {
                await ApiClient.addMenuItem(user.email, itemData);
            }
            bootstrap.Modal.getInstance(document.getElementById('addModal')).hide();
            Cart.showToast('Menu updated successfully');
            // Refresh local data and UI
            restaurants = await ApiClient.getRestaurants();
            const updatedRest = restaurants.find(r => r.id === user.restaurantId);
            myRestaurant.menu = updatedRest.menu;
            loadMenu();
        } catch (error) {
            Cart.showToast(error.message, 'error');
        }
    };

    window.editMenuItem = (id) => {
        const item = myRestaurant.menu.find(m => m.id === id);
        if (!item) return;
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-type').value = item.type;
        document.getElementById('item-desc').value = item.description;
        document.getElementById('item-image').value = item.image;
        document.getElementById('itemModalLabel').textContent = 'Edit Menu Item';
        new bootstrap.Modal(document.getElementById('addModal')).show();
    };

    window.deleteMenuItem = async (id) => {
        if (!confirm('Are you sure you want to remove this item?')) return;
        try {
            await ApiClient.deleteMenuItem(id, user.email);
            Cart.showToast('Item removed');
            restaurants = await ApiClient.getRestaurants();
            const updatedRest = restaurants.find(r => r.id === user.restaurantId);
            myRestaurant.menu = updatedRest.menu;
            loadMenu();
        } catch (error) {
            Cart.showToast(error.message, 'error');
        }
    };

    loadMenu();
}

// --- Analytics Logic ---
async function initAnalytics() {
    updateAnalytics();
}

async function updateAnalytics() {
    const user = Auth.getCurrentUser();
    try {
        const orders = await ApiClient.getOwnerOrders(user.email);
        const deliveredOrders = orders.filter(o => o.status === ORDER_STATUS.DELIVERED);
        const revenue = deliveredOrders.reduce((acc, o) => acc + o.total, 0);

        document.getElementById('stat-total-orders').textContent = orders.length;
        document.getElementById('stat-revenue').textContent = `₹${revenue.toLocaleString()}`;
    } catch (error) {
        console.error('Analytics Error:', error);
    }
}

// --- Feedbacks Logic ---
let currentFeedbackFilter = 'all';

async function initFeedbacksTab() {
    const filterSelect = document.getElementById('feedback-rating-filter');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            currentFeedbackFilter = e.target.value;
            loadFeedbacks();
        });
    }

    // Load feedbacks when the tab is shown
    const feedbacksTab = document.querySelector('[href="#feedbacks-section"]');
    if (feedbacksTab) {
        feedbacksTab.addEventListener('shown.bs.tab', () => {
            loadFeedbacks();
        });
    }
}

async function loadFeedbacks() {
    const container = document.getElementById('feedbacks-container');
    if (!container) {
        console.error('Feedbacks container not found');
        return;
    }

    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-brand" role="status"></div></div>';
    
    try {
        const user = Auth.getCurrentUser();
        if (!user || !user.email) {
            throw new Error('User not authenticated');
        }

        console.log('Loading feedbacks for user:', user.email);
        
        const url = currentFeedbackFilter === 'all' 
            ? `/api/owner/feedbacks?email=${encodeURIComponent(user.email)}`
            : `/api/owner/feedbacks?email=${encodeURIComponent(user.email)}&rating=${currentFeedbackFilter}`;
        
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server error:', errorData);
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        const { feedbacks, stats } = data;

        // Update statistics
        document.getElementById('feedback-total').textContent = stats.totalFeedbacks;
        document.getElementById('feedback-avg').textContent = stats.averageRating;

        // Update rating distribution
        const distributionEl = document.getElementById('rating-distribution');
        if (distributionEl) {
            distributionEl.innerHTML = '';
            for (let i = 5; i >= 1; i--) {
                const count = stats.ratingDistribution[i];
                const percentage = stats.totalFeedbacks > 0 
                    ? Math.round((count / stats.totalFeedbacks) * 100) 
                    : 0;
                
                const div = document.createElement('div');
                div.className = 'flex-grow-1';
                div.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span>${i}★</span>
                        <span class="text-muted">${count}</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-warning" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                `;
                distributionEl.appendChild(div);
            }
        }

        // Display feedbacks
        container.innerHTML = '';
        if (feedbacks.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-chat-left-text display-4 mb-3 d-block"></i>
                    <p>No feedbacks ${currentFeedbackFilter !== 'all' ? 'with this rating' : 'yet'}</p>
                </div>
            `;
            return;
        }

        feedbacks.forEach(feedback => {
            const card = createFeedbackCard(feedback);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading feedbacks:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <strong>Failed to load feedbacks.</strong><br>
                <small>${error.message}</small><br>
                <small class="text-muted">Check browser console for details.</small>
            </div>
        `;
    }
}

function createFeedbackCard(feedback) {
    const div = document.createElement('div');
    div.className = 'card border-0 shadow-sm mb-3 animate-fade-in';
    
    const stars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
    const date = new Date(feedback.date);
    const formattedDate = date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    div.innerHTML = `
        <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h6 class="fw-bold mb-1">${feedback.customerName}</h6>
                    <small class="text-muted">Order #${feedback.id.toString().slice(-6)} • ₹${feedback.orderTotal}</small>
                </div>
                <div class="text-end">
                    <div class="text-warning fs-5">${stars}</div>
                    <small class="text-muted">${formattedDate}</small>
                </div>
            </div>
            ${feedback.feedback ? `
                <div class="bg-light p-3 rounded">
                    <p class="mb-0 text-muted fst-italic">"${feedback.feedback}"</p>
                </div>
            ` : '<p class="text-muted small mb-0">No written feedback provided</p>'}
        </div>
    `;
    
    return div;
}
