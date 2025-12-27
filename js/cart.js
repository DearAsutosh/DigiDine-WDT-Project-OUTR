const Cart = {
    KEY: 'cart',

    getCart: function() {
        const cart = localStorage.getItem(this.KEY);
        return cart ? JSON.parse(cart) : [];
    },

    saveCart: function(cart) {
        localStorage.setItem(this.KEY, JSON.stringify(cart));
        this.updateBadge();
    },

    addToCart: function(item, restaurantId) {
        if (!Auth.isAuthenticated()) {
            this.showToast('Please login to add items', 'error');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return false;
        }

        let cart = this.getCart();
        
        // Mismatch Check
        if (cart.length > 0 && cart[0].restaurantId !== restaurantId) {
            this.showSwitchModal(item, restaurantId);
            return false;
        }

        this.forceAddToCart(item, restaurantId);
        return true;
    },

    forceAddToCart: function(item, restaurantId) {
        let cart = this.getCart();
        // If different restaurant (after confirmation), clear first
        if (cart.length > 0 && cart[0].restaurantId !== restaurantId) {
            cart = [];
        }

        const existingItemIndex = cart.findIndex(i => i.id === item.id);
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({ ...item, quantity: 1, restaurantId: restaurantId });
        }
        
        this.saveCart(cart);
        this.showToast(`Added ${item.name} to cart`);
    },

    showSwitchModal: function(item, restaurantId) {
        // Remove existing if any
        const existing = document.getElementById('cart-warning-modal');
        if (existing) existing.remove();

        const modalHtml = `
        <div class="modal fade" id="cart-warning-modal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold text-danger">Start new basket?</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-muted small">
                        Your cart contains items from another restaurant. Do you want to clear your cart and add items from this restaurant?
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-light w-50" data-bs-dismiss="modal">NO</button>
                        <button type="button" class="btn btn-danger w-50" id="confirm-switch-btn">YES, START NEW</button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalEl = document.getElementById('cart-warning-modal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        document.getElementById('confirm-switch-btn').addEventListener('click', () => {
            this.forceAddToCart(item, restaurantId);
            modal.hide();
        });
    },

    updateQuantity: function(itemId, change) {
        let cart = this.getCart();
        const itemIndex = cart.findIndex(i => i.id === itemId);
        
        if (itemIndex > -1) {
            cart[itemIndex].quantity += change;
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1);
            }
            this.saveCart(cart);
        }
        return cart; // return updated cart for UI render
    },

    removeItem: function(itemId) {
        let cart = this.getCart();
        cart = cart.filter(i => i.id !== itemId);
        this.saveCart(cart);
        return cart;
    },

    clearCart: function() {
        localStorage.removeItem(this.KEY);
        this.updateBadge();
    },

    checkout: async function(promoCode) {
         const user = Auth.getCurrentUser();
         if (!user) return { success: false, message: 'Not logged in' };

         const cart = this.getCart();
         const totals = this.getTotals(promoCode);
         
         try {
             const orderData = {
                 userEmail: user.email,
                 items: cart,
                 restaurantId: cart[0].restaurantId,
                 subtotal: totals.itemTotal,
                 discount: totals.discount,
                 total: totals.toPay,
                 promoCode: promoCode
             };

             const response = await ApiClient.placeOrder(orderData);
             this.clearCart();
             return { success: true, order: response.order };
         } catch (error) {
             console.error('Checkout failed:', error);
             return { success: false, message: error.message };
         }
    },

    // Note: getTotals remains sync but assumes promo is pre-validated or passed in
    getTotals: function(appliedPromo = null) {
        const cart = this.getCart();
        const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Fees
        const deliveryFee = itemTotal > 0 ? (itemTotal > 500 ? 0 : 40) : 0; // Free delivery above 500
        const tax = Math.round(itemTotal * 0.05); // 5% tax
        
        // Discount
        let discount = 0;
        if (appliedPromo) {
            if (appliedPromo.type === 'percent') {
                discount = Math.min((itemTotal * appliedPromo.value / 100), appliedPromo.maxDiscount || appliedPromo.max || 9999);
            } else if (appliedPromo.type === 'flat') {
                if (itemTotal >= (appliedPromo.min || 0)) {
                    discount = appliedPromo.value;
                }
            }
        }

        const toPay = Math.max(0, itemTotal + deliveryFee + tax - discount);

        return {
            itemTotal,
            deliveryFee,
            tax,
            discount,
            toPay,
            cartCount: cart.reduce((sum, item) => sum + item.quantity, 0)
        };
    },

    validatePromo: async function(code, cartItems) {
        if (!cartItems || cartItems.length === 0) return { valid: false, message: 'Cart is empty' };
        
        try {
            const response = await ApiClient.validatePromo(code, cartItems[0].restaurantId, this.getTotals().itemTotal);
            return { valid: true, message: response.message, promo: response.promo };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    },

    updateBadge: function() {
        const count = this.getCart().reduce((sum, item) => sum + item.quantity, 0);
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(b => {
            b.innerText = count;
            b.style.display = count > 0 ? 'inline-block' : 'none';
        });
    },

    showToast: function(message, type = 'success') {
        // Simple toast using Bootstrap if available, or custom
        const toastContainer = document.getElementById('toast-container');
        const bgClass = type === 'error' ? 'bg-danger' : 'bg-success';
        
        if (toastContainer) {
            const toastEl = document.createElement('div');
            toastEl.className = `toast align-items-center text-white ${bgClass} border-0 show`;
            toastEl.role = 'alert';
            toastEl.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;
            toastContainer.appendChild(toastEl);
            setTimeout(() => toastEl.remove(), 3000);
        } else {
            // Fallback
            // alert(message); 
            // Better fallback: create container if missing
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '1100';
            document.body.appendChild(container);
            this.showToast(message, type); // Retry
        }
    }
};
