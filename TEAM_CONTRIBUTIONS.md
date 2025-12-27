# DigiDine Project - Team Contributions Distribution
## Equal Work Distribution Among 4 Teammates

---

## 👤 **TEAMMATE 1: Authentication & UI/UX**

### Frontend Responsibilities:
1. **User Authentication System**
   - Login page design and functionality (login.html)
   - Registration page with role selection (customer/owner)
   - Profile management page (profile.html)
   - Profile picture upload with image compression
   - Authentication state management (auth.js)
   - Navbar updates based on login status
   - Route guards and access control

2. **Dark Mode UI**
   - Theme toggle button implementation
   - Dark mode CSS styling
   - Theme persistence using localStorage
   - Theme application across all pages

### Backend Responsibilities:
1. **Authentication APIs**
   - POST /api/auth/register - User registration endpoint
   - POST /api/auth/login - User login endpoint
   - PUT /api/auth/profile - Profile update endpoint
   - DELETE /api/auth/profile/:email - Account deletion endpoint
   - POST /api/users/change-password - Password change endpoint
   - User data validation and storage

### Files to Work On:
- `login.html`
- `profile.html`
- `js/auth.js`
- `css/style.css` (dark mode styles)
- `server/index.js` (authentication routes)

---

## 👤 **TEAMMATE 2: Restaurant Discovery & Menu Display**

### Frontend Responsibilities:
1. **Restaurant Discovery Module**
   - Home page restaurant listing (index.html)
   - Restaurant card design and layout
   - Search functionality (by name, cuisine, food items)
   - Rating filter dropdown
   - Restaurant detail page header (restaurant.html)
   - Smooth scroll and navigation

2. **Menu & Food Item Display**
   - Menu item listing on restaurant page
   - Veg/Non-Veg filter toggle
   - Food item cards with images and details
   - Add to cart button functionality
   - Customer reviews marquee display
   - Menu item rendering logic

### Backend Responsibilities:
1. **Restaurant APIs**
   - GET /api/restaurants - Get all restaurants
   - GET /api/restaurants/:id - Get single restaurant details
   - GET /api/restaurants/:id/reviews - Get restaurant reviews
   - Search functionality in restaurant endpoint
   - Restaurant data management

### Files to Work On:
- `index.html`
- `restaurant.html`
- `js/app.js` (home page and restaurant page logic)
- `js/data.js`
- `server/index.js` (restaurant routes)

---

## 👤 **TEAMMATE 3: Cart & Coupons System**

### Frontend Responsibilities:
1. **Cart System**
   - Cart page design and layout (cart.html)
   - Add to cart functionality
   - Remove items from cart
   - Quantity update controls (+/- buttons)
   - Cart badge counter in navbar
   - Empty cart message display
   - Restaurant consistency check (warning modal)
   - Bill calculation display

2. **Coupons & Offers System**
   - Offers page design (offers.html)
   - Coupon card display
   - Copy coupon code functionality
   - Coupon application on cart page
   - View coupons modal
   - Coupon eligibility display
   - Discount calculation and display

### Backend Responsibilities:
1. **Cart & Coupon APIs**
   - POST /api/promos/validate - Coupon validation endpoint
   - GET /api/offers - Get all active offers
   - Coupon validation logic (expiry, minimum order, restaurant-specific)
   - Offer data management

### Files to Work On:
- `cart.html`
- `offers.html`
- `js/cart.js`
- `js/app.js` (cart and offers page logic)
- `server/index.js` (coupon and offers routes)
- `server/data/offers.json`

---

## 👤 **TEAMMATE 4: Orders & Owner Dashboard**

### Frontend Responsibilities:
1. **Order Placement System**
   - Order summary display
   - Checkout button functionality
   - Order confirmation flow
   - Real-time order notifications

2. **Order History**
   - Order history page display
   - Order tracking modal with timeline
   - Rate order functionality and modal
   - Reorder button functionality
   - Order status badges

3. **Restaurant Owner Dashboard**
   - Owner dashboard page (owner-dashboard.html)
   - Order management interface (accept/reject/update status)
   - Menu management (add/edit/delete items)
   - Analytics display (total orders, revenue)
   - Customer feedbacks display
   - Real-time order notifications for owners
   - Owner profile page (owner-profile.html)

### Backend Responsibilities:
1. **Order APIs**
   - POST /api/orders - Place new order
   - GET /api/orders/:email - Get order history
   - POST /api/orders/:id/rate - Rate an order
   - PATCH /api/orders/:id/status - Update order status

2. **Owner APIs**
   - GET /api/owner/orders - Get owner's orders
   - PATCH /api/owner/orders/:id/accept - Accept order
   - PATCH /api/owner/orders/:id/reject - Reject order
   - PATCH /api/owner/orders/:id/status - Update order status
   - POST /api/owner/menu - Add menu item
   - PUT /api/owner/menu/:itemId - Update menu item
   - DELETE /api/owner/menu/:itemId - Delete menu item
   - GET /api/owner/feedbacks - Get customer feedbacks
   - PUT /api/owner/restaurant - Update restaurant details

3. **Real-Time Communication**
   - Socket.IO server setup
   - Real-time order notifications
   - Order status update broadcasts
   - Room management (user rooms, restaurant rooms)

### Files to Work On:
- `owner-dashboard.html`
- `owner-profile.html`
- `js/owner-dashboard.js`
- `js/owner-profile.js`
- `js/app.js` (order history logic)
- `server/index.js` (order and owner routes, Socket.IO)
- `server/data/orders.json`
- `server/constants.js`

---

## 🔧 **SHARED RESPONSIBILITIES (All Teammates)**

### Common Tasks:
1. **API Client Module** (`js/api-client.js`)
   - All teammates contribute to API client functions for their respective features
   - Ensure consistent error handling
   - Maintain API endpoint consistency

2. **Styling & Design** (`css/style.css`)
   - Consistent design system
   - Responsive layout
   - Brand colors and typography
   - Shared components styling

3. **Data Structure** (`server/data/`)
   - Coordinate JSON file structure
   - Ensure data consistency
   - Migration scripts if needed

4. **Testing & Debugging**
   - Cross-browser testing
   - Feature integration testing
   - Bug fixes and improvements

---

## 📊 **Workload Summary**

| Teammate | Frontend Pages | Frontend JS Files | Backend Routes | Complexity Level |
|----------|---------------|------------------|---------------|------------------|
| **Teammate 1** | 2 pages | 1 main file | 5 routes | Medium |
| **Teammate 2** | 2 pages | 1 main file | 3 routes | Medium |
| **Teammate 3** | 2 pages | 1 main file | 2 routes | Medium-High |
| **Teammate 4** | 2 pages | 2 main files | 10+ routes + Socket.IO | High |

**Note:** Teammate 4 has more backend routes but this balances with the complexity of real-time features and owner dashboard.

---

## 🎯 **Development Workflow**

1. **Phase 1: Setup & Authentication** (Teammate 1)
   - Set up project structure
   - Implement authentication system
   - Create base UI components

2. **Phase 2: Core Features** (Teammates 2 & 3)
   - Restaurant discovery and menu display
   - Cart and coupon system
   - Basic order placement

3. **Phase 3: Advanced Features** (Teammate 4)
   - Order management
   - Owner dashboard
   - Real-time updates

4. **Phase 4: Integration & Polish** (All)
   - Feature integration
   - Bug fixes
   - UI/UX improvements
   - Testing

---

## ✅ **Deliverables Checklist**

### Teammate 1:
- [ ] Login/Registration pages functional
- [ ] Profile management working
- [ ] Dark mode implemented
- [ ] Authentication APIs working
- [ ] Route guards implemented

### Teammate 2:
- [ ] Restaurant listing page functional
- [ ] Search and filter working
- [ ] Restaurant detail page working
- [ ] Menu display functional
- [ ] Restaurant APIs working

### Teammate 3:
- [ ] Cart page functional
- [ ] Add/remove/update cart working
- [ ] Offers page functional
- [ ] Coupon validation working
- [ ] Bill calculation accurate

### Teammate 4:
- [ ] Order placement working
- [ ] Order history functional
- [ ] Order tracking working
- [ ] Owner dashboard functional
- [ ] Real-time updates working
- [ ] All owner APIs working

---

## 📝 **Notes**

- Each teammate should communicate regularly for API integration
- Follow consistent coding standards and naming conventions
- Use Git branches for feature development
- Regular code reviews before merging
- Test features independently before integration
- Document any API changes or additions

---

**Total Features Distributed:** 9 Major Modules
**Total Teammates:** 4
**Distribution:** Equal workload with balanced complexity

