import dotenv from 'dotenv';
console.log('--- DEBUG: Starting Server ---');
dotenv.config();
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ORDER_STATUS, STATUS_FLOW } from './constants.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const isValidSequence = (current, next) => {
    const currentIndex = STATUS_FLOW.indexOf(current);
    const nextIndex = STATUS_FLOW.indexOf(next);
    
    // Allow re-setting the same status? No, only move forward.
    // Transition from PENDING to CONFIRMED or REJECTED is handled by accept/reject.
    // Transition from CONFIRMED onwards must be sequential.
    if (next === ORDER_STATUS.REJECTED) return current === ORDER_STATUS.PENDING;
    
    return nextIndex === currentIndex + 1;
};

// --- Configuration ---
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// --- Socket.IO Room Management ---
io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    // Join room based on user email (for customer status updates)
    socket.on('join_user_room', (email) => {
        socket.join(`user_${email}`);
        console.log(`[SOCKET] User ${email} joined room user_${email}`);
    });

    // Join room based on restaurant ID (for owner dashboard updates)
    socket.on('join_restaurant_room', (restaurantId) => {
        socket.join(`restaurant_${restaurantId}`);
        console.log(`[SOCKET] Restaurant ${restaurantId} joined room restaurant_${restaurantId}`);
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
});

/**
 * Real-time event emission
 * Broadcasts updates to specific rooms
 */
const emitEvent = (eventName, data) => {
    console.log(`[EVENT] ${eventName} triggered for:`, data.orderId || 'new order');
    
    if (eventName === 'NEW_ORDER') {
        const room = `restaurant_${data.restaurantId}`;
        const sockets = io.sockets.adapter.rooms.get(room);
        const count = sockets ? sockets.size : 0;
        console.log(`[SOCKET] Broadcasting NEW_ORDER to ${room} (${count} listeners)`);
        io.to(room).emit('NEW_ORDER', data);
    } else if (eventName === 'ORDER_STATUS_UPDATE') {
        const room = `user_${data.userEmail}`;
        const sockets = io.sockets.adapter.rooms.get(room);
        const count = sockets ? sockets.size : 0;
        console.log(`[SOCKET] Broadcasting ORDER_STATUS_UPDATE to ${room} (${count} listeners)`);
        io.to(room).emit('ORDER_STATUS_UPDATE', data);
    }
};

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Data Layer (Mocking DB with JSON) ---
const DATA_PATH = path.join(__dirname, 'data', 'restaurants.json');
const USERS_PATH = path.join(__dirname, 'data', 'users.json');
const ORDERS_PATH = path.join(__dirname, 'data', 'orders.json');
const OFFERS_PATH = path.join(__dirname, 'data', 'offers.json');
const QUERIES_PATH = path.join(__dirname, 'data', 'queries.json');
const TABLES_PATH = path.join(__dirname, 'data', 'tables.json');
const STAFF_PATH = path.join(__dirname, 'data', 'staff.json');
const RESERVATIONS_PATH = path.join(__dirname, 'data', 'reservations.json');

const getRestaurants = () => {
    try {
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading restaurant data:', error);
        return [];
    }
};

const saveRestaurants = (restaurants) => {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(restaurants, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving restaurant data:', error);
        return false;
    }
};

const getUsers = () => {
    try {
        if (!fs.existsSync(USERS_PATH)) return [];
        const data = fs.readFileSync(USERS_PATH, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading user data:', error);
        return [];
    }
};

const saveUsers = (users) => {
    try {
        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving user data:', error);
        return false;
    }
};

const getOrders = () => {
    try {
        if (!fs.existsSync(ORDERS_PATH)) return [];
        const data = fs.readFileSync(ORDERS_PATH, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading order data:', error);
        return [];
    }
};

const saveOrders = (orders) => {
    try {
        fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving order data:', error);
        return false;
    }
};

const getOffers = () => {
    try {
        if (!fs.existsSync(OFFERS_PATH)) return [];
        const data = fs.readFileSync(OFFERS_PATH, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading offers data:', error);
        return [];
    }
};

const getQueries = () => {
    try {
        if (!fs.existsSync(QUERIES_PATH)) return [];
        const data = fs.readFileSync(QUERIES_PATH, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading queries data:', error);
        return [];
    }
};

const saveQueries = (queries) => {
    try {
        fs.writeFileSync(QUERIES_PATH, JSON.stringify(queries, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving queries data:', error);
        return false;
    }
};

const getTables = () => {
    try {
        if (!fs.existsSync(TABLES_PATH)) return [];
        const data = fs.readFileSync(TABLES_PATH, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading tables data:', error);
        return [];
    }
};

const saveTables = (tables) => {
    try {
        fs.writeFileSync(TABLES_PATH, JSON.stringify(tables, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving tables data:', error);
        return false;
    }
};

const getStaff = () => {
    try {
        if (!fs.existsSync(STAFF_PATH)) return [];
        const data = fs.readFileSync(STAFF_PATH, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading staff data:', error);
        return [];
    }
};

const saveStaff = (staff) => {
    try {
        fs.writeFileSync(STAFF_PATH, JSON.stringify(staff, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving staff data:', error);
        return false;
    }
};

const getReservations = () => {
    try {
        if (!fs.existsSync(RESERVATIONS_PATH)) return [];
        const data = fs.readFileSync(RESERVATIONS_PATH, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error reading reservations data:', error);
        return [];
    }
};

const saveReservations = (reservations) => {
    try {
        fs.writeFileSync(RESERVATIONS_PATH, JSON.stringify(reservations, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving reservations data:', error);
        return false;
    }
};

/**
 * Migration: Ensure all existing orders have a status and history
 * Runs once on server startup
 */
const runMigration = () => {
    // 1. Order Migration
    const orders = getOrders();
    let migratedOrders = false;

    const updatedOrders = orders.map(order => {
        if (!order.statusHistory || !order.statusHistory.length) {
            migratedOrders = true;
            const currentStatus = order.status || ORDER_STATUS.DELIVERED;
            const orderDate = order.date || new Date().toISOString();
            
            return {
                ...order,
                status: currentStatus,
                statusHistory: [
                    { 
                        status: ORDER_STATUS.PENDING, 
                        timestamp: orderDate,
                        message: 'Order placed'
                    },
                    { 
                        status: currentStatus, 
                        timestamp: orderDate,
                        message: 'Status synchronized during migration'
                    }
                ]
            };
        }
        return order;
    });

    if (migratedOrders) {
        saveOrders(updatedOrders);
        console.log('--- Migration: Order status history synchronized ---');
    }

    // 2. Restaurant Rating Migration
    const restaurants = getRestaurants();
    let migratedRestaurants = false;

    const updatedRestaurants = restaurants.map(r => {
        if (typeof r.ratingCount === 'undefined') {
            migratedRestaurants = true;
            // Assume 20 ratings base for stability
            return {
                ...r,
                ratingCount: 20,
                totalRating: r.rating * 20
            };
        }
        return r;
    });

    if (migratedRestaurants) {
        saveRestaurants(updatedRestaurants);
        console.log('--- Migration: Outlet ratings initialized ---');
    }
};

runMigration();

// --- Middleware ---
// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// --- Serve Static Frontend Files ---
// Point to the root directory where index.html, offers.html, etc. are located
app.use(express.static(path.join(__dirname, '..')));

// --- Routes ---

/**
 * @route   GET /api/offers
 * @desc    Get all active offers
 * @access  Public
 */
app.get('/api/offers', (req, res) => {
    const offers = getOffers();
    const activeOffers = offers.filter(o => new Date(o.expiryDate) > new Date());
    res.json(activeOffers);
});

/**
 * @route   POST /api/promos/validate
 * @desc    Validate a promo code
 * @access  Public
 */
app.post('/api/promos/validate', (req, res) => {
    const { code, restaurantId, subtotal } = req.body;
    const offers = getOffers();
    const promo = offers.find(o => o.code.toUpperCase() === code?.toUpperCase());

    if (!promo) {
        return res.status(404).json({ message: 'Invalid promo code' });
    }

    // Expiry Check
    if (new Date(promo.expiryDate) < new Date()) {
        return res.status(400).json({ message: 'Promo code has expired' });
    }

    // Restaurant Check
    if (promo.restaurantId && promo.restaurantId !== restaurantId) {
        return res.status(400).json({ message: 'Promo code not valid for this restaurant' });
    }

    // Min Order Check
    if (promo.minOrder && subtotal < promo.minOrder) {
        return res.status(400).json({ message: `Minimum order value of ₹${promo.minOrder} required` });
    }

    res.json({ message: 'Promo applied', promo });
});

/**
 * Aliases for common mistakes or legacy paths
 */
app.get('/api/coupons', (req, res) => res.redirect('/api/offers'));
app.get('/api/users', (req, res) => res.status(400).json({ 
    message: 'Please use /api/auth/login or /api/auth/profile for user data' 
}));

/**
 * @route   POST /api/orders
 * @desc    Place a new order (Checkout)
 * @access  Private (Mocked)
 */
app.post('/api/orders', (req, res) => {
    const { userEmail, items, restaurantId, subtotal, discount, total, promoCode } = req.body;

    if (!userEmail || !items || !items.length) {
        return res.status(400).json({ message: 'Invalid order data' });
    }

    // Availability Check
    const restaurants = getRestaurants();
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }

    for (const orderItem of items) {
        const menuItem = restaurant.menu.find(m => m.id === orderItem.id);
        if (!menuItem || menuItem.available === false) {
            return res.status(400).json({ 
                message: `Sorry, ${orderItem.name} is currently out of stock. Please remove it from your cart.` 
            });
        }
    }

    const orders = getOrders();
    const newOrder = {
        id: Date.now(),
        userEmail,
        items,
        restaurantId,
        subtotal,
        discount,
        total,
        promoCode,
        status: ORDER_STATUS.PENDING,
        statusHistory: [
            {
                status: ORDER_STATUS.PENDING,
                timestamp: new Date().toISOString(),
                message: 'Order placed successfully'
            }
        ],
        date: new Date().toISOString()
    };

    orders.unshift(newOrder); // Add to beginning
    saveOrders(orders);

    // Emit event for real-time dashboard update
    emitEvent('NEW_ORDER', {
        restaurantId: newOrder.restaurantId,
        orderId: newOrder.id,
        items: newOrder.items,
        total: newOrder.total
    });

    res.status(201).json({
        message: 'Order placed successfully',
        order: newOrder
    });
});

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Mocked/Admin)
 */
app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, message } = req.body;
    
    if (!ORDER_STATUS[status]) {
        return res.status(400).json({ message: 'Invalid status provided' });
    }

    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === parseInt(id));

    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[orderIndex];
    order.status = status;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
        status,
        timestamp: new Date().toISOString(),
        message: message || `Order status updated to ${status}`
    });

    saveOrders(orders);
    res.json({ message: 'Status updated', order });
});

/**
 * @route   GET /api/orders/:email
 * @desc    Get order history for a user
 * @access  Private (Mocked)
 */
app.get('/api/orders/:email', (req, res) => {
    const { email } = req.params;
    const orders = getOrders();
    const userOrders = orders.filter(o => o.userEmail === email);

    res.json(userOrders);
});

/**
 * --- Restaurant Owner Endpoints ---
 */

/**
 * @route   GET /api/owner/orders
 * @desc    Get orders for the owner's restaurant
 * @access  Private (Mocked/Owner)
 */
app.get('/api/owner/orders', (req, res) => {
    const { email, status } = req.query; // Mock auth via query email
    
    if (!email) return res.status(401).json({ message: 'Authentication required' });

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || (user.role !== 'owner' && user.role !== 'restaurant_owner')) {
        return res.status(403).json({ message: 'Access denied: Owners only' });
    }

    const orders = getOrders();
    let ownerOrders = orders.filter(o => o.restaurantId === user.restaurantId);

    if (status) {
        ownerOrders = ownerOrders.filter(o => o.status === status);
    }

    res.json(ownerOrders);
});

/**
 * @route   PATCH /api/owner/orders/:id/accept
 * @desc    Accept a pending order
 */
app.patch('/api/owner/orders/:id/accept', (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    console.log(`[DEBUG] Accept request for order ${id} by ${email}`);

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || (user.role !== 'owner' && user.role !== 'restaurant_owner')) return res.status(403).json({ message: 'Owner access required' });

    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === parseInt(id));

    if (orderIndex === -1) return res.status(404).json({ message: 'Order not found' });
    
    const order = orders[orderIndex];
    if (order.restaurantId !== user.restaurantId) return res.status(403).json({ message: 'Not authorized for this restaurant' });

    if (order.status !== ORDER_STATUS.PENDING) {
        return res.status(400).json({ message: 'Only PENDING orders can be accepted' });
    }

    order.status = ORDER_STATUS.CONFIRMED;
    order.statusHistory.push({
        status: ORDER_STATUS.CONFIRMED,
        timestamp: new Date().toISOString(),
        message: 'Order accepted by restaurant'
    });

    saveOrders(orders);

    // Emit event for real-time status update
    emitEvent('ORDER_STATUS_UPDATE', {
        userEmail: order.userEmail,
        restaurantId: order.restaurantId,
        orderId: order.id,
        status: order.status,
        message: 'Order accepted'
    });

    res.json({ message: 'Order accepted', order });
});

/**
 * @route   PATCH /api/owner/orders/:id/reject
 * @desc    Reject a pending order
 */
app.patch('/api/owner/orders/:id/reject', (req, res) => {
    const { id } = req.params;
    const { email, message } = req.body;

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || (user.role !== 'owner' && user.role !== 'restaurant_owner')) return res.status(403).json({ message: 'Owner access required' });

    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === parseInt(id));

    if (orderIndex === -1) return res.status(404).json({ message: 'Order not found' });
    
    const order = orders[orderIndex];
    if (order.restaurantId !== user.restaurantId) return res.status(403).json({ message: 'Not authorized for this restaurant' });

    if (order.status !== ORDER_STATUS.PENDING) {
        return res.status(400).json({ message: 'Only PENDING orders can be rejected' });
    }

    order.status = ORDER_STATUS.REJECTED;
    order.statusHistory.push({
        status: ORDER_STATUS.REJECTED,
        timestamp: new Date().toISOString(),
        message: message || 'Order rejected by restaurant'
    });

    saveOrders(orders);

    // Emit event
    emitEvent('ORDER_STATUS_UPDATE', {
        userEmail: order.userEmail,
        restaurantId: order.restaurantId,
        orderId: order.id,
        status: order.status,
        message: message || 'Order rejected'
    });

    res.json({ message: 'Order rejected', order });
});

/**
 * @route   PATCH /api/owner/orders/:id/status
 * @desc    Update order status with sequential validation
 */
app.patch('/api/owner/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { email, status, message } = req.body;

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || (user.role !== 'owner' && user.role !== 'restaurant_owner')) return res.status(403).json({ message: 'Owner access required' });

    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === parseInt(id));

    if (orderIndex === -1) return res.status(404).json({ message: 'Order not found' });
    
    const order = orders[orderIndex];
    if (order.restaurantId !== user.restaurantId) return res.status(403).json({ message: 'Not authorized for this restaurant' });

    if (!ORDER_STATUS[status]) {
        return res.status(400).json({ message: 'Invalid status provided' });
    }

    if (!isValidSequence(order.status, status)) {
        return res.status(400).json({ 
            message: `Invalid status transition: ${order.status} -> ${status}. Statuses must be updated sequentially.` 
        });
    }

    order.status = status;
    order.statusHistory.push({
        status,
        timestamp: new Date().toISOString(),
        message: message || `Order status updated to ${status}`
    });

    saveOrders(orders);

    // Emit event
    emitEvent('ORDER_STATUS_UPDATE', {
        userEmail: order.userEmail,
        restaurantId: order.restaurantId,
        orderId: order.id,
        status: order.status,
        message: message || `Status updated to ${status}`
    });

    res.json({ message: 'Status updated successfully', order });
});

/**
 * @route   POST /api/orders/:id/rate
 * @desc    Rate a delivered order
 */
app.post('/api/orders/:id/rate', (req, res) => {
    const { id } = req.params;
    const { email, rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Invalid rating. must be 1-5' });
    }

    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id == id);
    if (orderIndex === -1) return res.status(404).json({ message: 'Order not found' });
    
    const order = orders[orderIndex];

    // Auth check
    if (order.userEmail !== email) return res.status(403).json({ message: 'Unauthorized' });

    // Status check
    if (order.status !== ORDER_STATUS.DELIVERED) {
        return res.status(400).json({ message: 'Only delivered orders can be rated' });
    }

    // Double rating check
    if (order.isRated) {
        return res.status(400).json({ message: 'Order already rated' });
    }

    // Update Restaurant Stats
    const restaurants = getRestaurants();
    const rIndex = restaurants.findIndex(r => r.id === order.restaurantId);
    if (rIndex === -1) return res.status(404).json({ message: 'Restaurant data error' });

    const restaurant = restaurants[rIndex];
    
    // Init if missing (fallback if migration didn't run yet)
    if (!restaurant.ratingCount) {
        restaurant.ratingCount = 20;
        restaurant.totalRating = restaurant.rating * 20;
    }

    // Calc new average
    restaurant.ratingCount += 1;
    restaurant.totalRating += parseInt(rating);
    restaurant.rating = Number((restaurant.totalRating / restaurant.ratingCount).toFixed(1));

    // Update Order
    order.isRated = true;
    order.rating = parseInt(rating); // Ensure number
    order.feedback = feedback || '';

    saveRestaurants(restaurants);
    saveOrders(orders);

    saveRestaurants(restaurants);
    saveOrders(orders);

    res.json({ 
        message: 'Rating submitted successfully', 
        newRestaurantRating: restaurant.rating,
        newCount: restaurant.ratingCount 
    });
});

/**
 * @route   GET /api/restaurants/:id/reviews
 * @desc    Get public reviews for a restaurant
 */
app.get('/api/restaurants/:id/reviews', (req, res) => {
    const { id } = req.params;
    const orders = getOrders();
    const users = getUsers(); // Need user names

    const reviews = orders
        .filter(o => 
            o.restaurantId == id && 
            o.status === ORDER_STATUS.DELIVERED && 
            o.isRated && 
            o.feedback && o.feedback.length > 0
        )
        .map(o => {
            const user = users.find(u => u.email === o.userEmail);
            return {
                id: o.id,
                user: user ? user.name : 'Customer',
                rating: o.rating,
                feedback: o.feedback,
                date: o.date
            };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Recent first
        .slice(0, 20); // Limit

    res.json(reviews);
});

/**
 * @route   GET /api/owner/feedbacks
 * @desc    Get all feedbacks for the owner's restaurant
 * @access  Private (Owner)
 */
app.get('/api/owner/feedbacks', (req, res) => {
    const { email, rating } = req.query;
    
    if (!email) return res.status(401).json({ message: 'Authentication required' });

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || (user.role !== 'owner' && user.role !== 'restaurant_owner')) {
        return res.status(403).json({ message: 'Access denied: Owners only' });
    }

    const orders = getOrders();
    
    // Get all rated orders for this restaurant
    let feedbacks = orders
        .filter(o => 
            o.restaurantId === user.restaurantId && 
            o.status === ORDER_STATUS.DELIVERED &&
            o.isRated
        )
        .map(o => {
            const customer = users.find(u => u.email === o.userEmail);
            return {
                id: o.id,
                customerName: customer ? customer.name : 'Customer',
                customerEmail: o.userEmail,
                rating: o.rating,
                feedback: o.feedback || '',
                date: o.date,
                orderTotal: o.total
            };
        });

    // Filter by rating if specified
    if (rating) {
        feedbacks = feedbacks.filter(f => f.rating === parseInt(rating));
    }

    // Sort by most recent first
    feedbacks.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate statistics
    const stats = {
        totalFeedbacks: feedbacks.length,
        averageRating: feedbacks.length > 0 
            ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
            : 0,
        ratingDistribution: {
            5: feedbacks.filter(f => f.rating === 5).length,
            4: feedbacks.filter(f => f.rating === 4).length,
            3: feedbacks.filter(f => f.rating === 3).length,
            2: feedbacks.filter(f => f.rating === 2).length,
            1: feedbacks.filter(f => f.rating === 1).length
        }
    };

    res.json({ feedbacks, stats });
});

/**
 * --- Menu Management Endpoints ---
 */

/**
 * @route   POST /api/owner/menu
 * @desc    Add a new item to the restaurant's menu
 */
app.post('/api/owner/menu', (req, res) => {
    const { email, item } = req.body; // item: { name, price, type, description, image }
    
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || (user.role !== 'owner' && user.role !== 'restaurant_owner')) return res.status(403).json({ message: 'Owner access required' });

    const restaurants = getRestaurants();
    const restaurantIndex = restaurants.findIndex(r => r.id === user.restaurantId);
    if (restaurantIndex === -1) return res.status(404).json({ message: 'Restaurant not found' });

    const restaurant = restaurants[restaurantIndex];
    const newItem = {
        ...item,
        id: Date.now(), // Generate a unique ID for the item
        restaurantId: user.restaurantId
    };

    restaurant.menu.push(newItem);
    saveRestaurants(restaurants);

    res.status(201).json({ message: 'Item added successfully', item: newItem });
});

/**
 * @route   PUT /api/owner/menu/:itemId
 * @desc    Update an existing menu item
 */
app.put('/api/owner/menu/:itemId', (req, res) => {
    const { itemId } = req.params;
    const { email, item: updatedItem } = req.body;

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || (user.role !== 'owner' && user.role !== 'restaurant_owner')) return res.status(403).json({ message: 'Owner access required' });

    const restaurants = getRestaurants();
    const restaurant = restaurants.find(r => r.id === user.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const itemIndex = restaurant.menu.findIndex(m => m.id === parseInt(itemId));
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found in menu' });

    restaurant.menu[itemIndex] = { ...restaurant.menu[itemIndex], ...updatedItem };
    saveRestaurants(restaurants);

    res.json({ message: 'Item updated successfully', item: restaurant.menu[itemIndex] });
});

/**
 * @route   DELETE /api/owner/menu/:itemId
 * @desc    Remove an item from the menu
 */
app.delete('/api/owner/menu/:itemId', (req, res) => {
    const { itemId } = req.params;
    const { email } = req.body;

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || (user.role !== 'owner' && user.role !== 'restaurant_owner')) return res.status(403).json({ message: 'Owner access required' });

    const restaurants = getRestaurants();
    const restaurant = restaurants.find(r => r.id === user.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    restaurant.menu = restaurant.menu.filter(m => m.id !== parseInt(itemId));
    saveRestaurants(restaurants);

    res.json({ message: 'Item removed successfully' });
});

/**
 * --- Contact / Queries Endpoints ---
 */

/**
 * @route   POST /api/contact
 * @desc    Submit a new query/message
 */
app.post('/api/contact', (req, res) => {
    const { restaurantId, name, email, subject, message } = req.body;

    if (!restaurantId || !name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const queries = getQueries();
    const newQuery = {
        id: Date.now(),
        restaurantId: parseInt(restaurantId),
        name,
        email,
        subject: subject || 'No Subject',
        message,
        date: new Date().toISOString(),
        isRead: false
    };

    queries.push(newQuery);
    saveQueries(queries);

    res.json({ message: 'Message sent successfully', query: newQuery });
});

/**
 * @route   GET /api/owner/queries
 * @desc    Get queries for the owner's restaurant
 */
app.get('/api/owner/queries', (req, res) => {
    const { email } = req.query;

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || (user.role !== 'owner' && user.role !== 'restaurant_owner')) {
        return res.status(403).json({ message: 'Access denied: Owners only' });
    }

    const queries = getQueries();
    const ownerQueries = queries.filter(q => q.restaurantId === user.restaurantId)
                                .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(ownerQueries);
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role, restaurantName, restaurantLocation } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide all fields' });
    }

    const users = getUsers();
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    let restaurantId = null;
    if (role === 'owner') {
        const restaurants = getRestaurants();
        restaurantId = Date.now(); // Simple ID generation
        
        const newRestaurant = {
            id: restaurantId,
            name: restaurantName || `${name}'s Restaurant`,
            location: restaurantLocation || 'Unknown',
            cuisine: 'General',
            rating: 4.0,
            reviews: 0,
            deliveryTime: '30-40 min',
            costForTwo: 500,
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
            menu: []
        };
        
        restaurants.push(newRestaurant);
        saveRestaurants(restaurants);
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        role: role || 'customer',
        restaurantId,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
        token: `mock-jwt-token-${newUser.id}`
    });
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token: `mock-jwt-token-${user.id}`
    });
});

/**
 * @route   POST /api/users/change-password
 * @desc    Change user password
 * @access  Private
 */
app.post('/api/users/change-password', (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    // Validation
    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({ message: 'New password must be different from current password' });
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    const user = users[userIndex];

    // Verify current password
    if (user.password !== currentPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    users[userIndex].password = newPassword;
    users[userIndex].updatedAt = new Date().toISOString();

    saveUsers(users);

    res.json({ message: 'Password changed successfully' });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private (Mocked)
 */
app.put('/api/auth/profile', (req, res) => {
    const { email, name, phone, dob, address } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required to identify user' });
    }

    let users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }

    const updates = {
        name: name,
        phone: phone,
        dob: dob,
        address: address,
        updatedAt: new Date().toISOString()
    };

    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);

    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({ message: 'Profile updated successfully', user: userWithoutPassword });
});

/**
 * @route   DELETE /api/auth/profile/:email
 * @desc    Delete user account and associated restaurant
 * @access  Private (Mocked)
 */
app.delete('/api/auth/profile/:email', (req, res) => {
    const { email } = req.params;
    let users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // If owner, delete associated outlet
    if (user.role === 'owner' && user.restaurantId) {
        let restaurants = getRestaurants();
        restaurants = restaurants.filter(r => r.id !== user.restaurantId);
        saveRestaurants(restaurants);
        console.log(`[DELETION] Outlet ${user.restaurantId} removed.`);
    }

    // Delete user
    users = users.filter(u => u.email !== email);
    saveUsers(users);

    res.json({ message: 'Account and associated data deleted successfully' });
});

// --- Super-Admin Endpoints ---

/**
 * @route   GET /api/admin/stats
 * @desc    Get global stats (admin only)
 */
app.get('/api/admin/stats', (req, res) => {
    const { email } = req.query;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    const restaurants = getRestaurants();
    const orders = getOrders();
    const usersList = getUsers();

    const totalRevenue = orders
        .filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + o.total, 0);

    res.json({
        totalOutlets: restaurants.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        totalUsers: usersList.length,
        activeOrders: orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length
    });
});

/**
 * @route   GET /api/admin/outlets
 * @desc    Get all outlets with manager details
 */
app.get('/api/admin/outlets', (req, res) => {
    const { email } = req.query;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    const restaurants = getRestaurants();
    const managers = users.filter(u => u.role === 'owner');

    const outletsWithManagers = restaurants.map(r => {
        const manager = managers.find(m => m.restaurantId === r.id);
        return {
            ...r,
            manager: manager ? { name: manager.name, email: manager.email } : null
        };
    });

    res.json(outletsWithManagers);
});

/**
 * @route   PUT /api/owner/restaurant
 * @desc    Update restaurant details
 * @access  Private (Owner only)
 */
app.put('/api/owner/restaurant', (req, res) => {
    const { id, name, location, cuisine, image } = req.body;
    let restaurants = getRestaurants();
    const restaurantIndex = restaurants.findIndex(r => r.id === parseInt(id));

    if (restaurantIndex === -1) {
        return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurants[restaurantIndex] = {
        ...restaurants[restaurantIndex],
        name: name || restaurants[restaurantIndex].name,
        location: location || restaurants[restaurantIndex].location,
        cuisine: cuisine || restaurants[restaurantIndex].cuisine,
        image: image || restaurants[restaurantIndex].image
    };

    saveRestaurants(restaurants);
    res.json({ message: 'Restaurant details updated successfully', restaurant: restaurants[restaurantIndex] });
});

/**
 * @route   GET /api/restaurants
 * @desc    Get all restaurants (with optional search query)
 * @access  Public
 */
app.get('/api/restaurants', (req, res) => {
    const { search } = req.query;
    let restaurants = getRestaurants();

    if (search) {
        const query = search.toLowerCase();
        restaurants = restaurants.filter(r => 
            r.name.toLowerCase().includes(query) || 
            r.cuisine.toLowerCase().includes(query) ||
            r.menu.some(item => item.name.toLowerCase().includes(query))
        );
    }

    res.json(restaurants);
});

/**
 * @route   GET /api/restaurants/:id
 * @desc    Get single restaurant details by ID
 * @access  Public
 */
app.get('/api/restaurants/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const restaurants = getRestaurants();
    const restaurant = restaurants.find(r => r.id === id);

    if (restaurant) {
        res.json(restaurant);
    } else {
        res.status(404).json({ message: 'Restaurant not found' });
    }
});

/**
 * @route   GET /api/owner/tables
 * @desc    Get all tables for an outlet
 */
app.get('/api/owner/tables', (req, res) => {
    const { email } = req.query;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || (!user.restaurantId && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    const tables = getTables();
    const myTables = tables.filter(t => t.restaurantId === user.restaurantId);
    res.json(myTables);
});

/**
 * @route   POST /api/owner/tables
 * @desc    Add a new table
 */
app.post('/api/owner/tables', (req, res) => {
    const { email, number, capacity } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !user.restaurantId) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    const tables = getTables();
    const newTable = {
        id: Date.now(),
        restaurantId: user.restaurantId,
        number,
        capacity: parseInt(capacity),
        status: 'Available'
    };

    tables.push(newTable);
    saveTables(tables);
    res.status(201).json({ message: 'Table added successfully', table: newTable });
});

/**
 * @route   PUT /api/owner/tables/:id
 * @desc    Update table status or info
 */
app.put('/api/owner/tables/:id', (req, res) => {
    const { id } = req.params;
    const { email, status, number, capacity } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !user.restaurantId) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    let tables = getTables();
    const tableIndex = tables.findIndex(t => t.id === parseInt(id) && t.restaurantId === user.restaurantId);

    if (tableIndex === -1) {
        return res.status(404).json({ message: 'Table not found' });
    }

    tables[tableIndex] = {
        ...tables[tableIndex],
        status: status || tables[tableIndex].status,
        number: number || tables[tableIndex].number,
        capacity: capacity ? parseInt(capacity) : tables[tableIndex].capacity
    };

    saveTables(tables);
    res.json({ message: 'Table updated successfully', table: tables[tableIndex] });
});

/**
 * @route   DELETE /api/owner/tables/:id
 * @desc    Delete a table
 */
app.delete('/api/owner/tables/:id', (req, res) => {
    const { id } = req.params;
    const { email } = req.query;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !user.restaurantId) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    let tables = getTables();
    const initialLength = tables.length;
    tables = tables.filter(t => !(t.id === parseInt(id) && t.restaurantId === user.restaurantId));

    if (tables.length === initialLength) {
        return res.status(404).json({ message: 'Table not found or unauthorized' });
    }

    saveTables(tables);
    res.json({ message: 'Table deleted successfully' });
});

/**
 * @route   GET /api/owner/staff
 * @desc    Get all staff for an outlet
 */
app.get('/api/owner/staff', (req, res) => {
    const { email } = req.query;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !user.restaurantId) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    const staff = getStaff();
    const myStaff = staff.filter(s => s.restaurantId === user.restaurantId);
    res.json(myStaff);
});

/**
 * @route   POST /api/owner/staff
 * @desc    Add a new staff member
 */
app.post('/api/owner/staff', (req, res) => {
    const { email, name, role, phone, salary } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !user.restaurantId) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    const staff = getStaff();
    const newStaff = {
        id: Date.now(),
        restaurantId: user.restaurantId,
        name,
        role,
        phone,
        salary: parseInt(salary),
        status: 'Active',
        joinedDate: new Date().toISOString()
    };

    staff.push(newStaff);
    saveStaff(staff);
    res.status(201).json({ message: 'Staff member added successfully', staff: newStaff });
});

/**
 * @route   PUT /api/owner/staff/:id
 * @desc    Update staff information
 */
app.put('/api/owner/staff/:id', (req, res) => {
    const { id } = req.params;
    const { email, name, role, phone, salary, status } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !user.restaurantId) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    let staff = getStaff();
    const staffIndex = staff.findIndex(s => s.id === parseInt(id) && s.restaurantId === user.restaurantId);

    if (staffIndex === -1) {
        return res.status(404).json({ message: 'Staff member not found' });
    }

    staff[staffIndex] = {
        ...staff[staffIndex],
        name: name || staff[staffIndex].name,
        role: role || staff[staffIndex].role,
        phone: phone || staff[staffIndex].phone,
        salary: salary ? parseInt(salary) : staff[staffIndex].salary,
        status: status || staff[staffIndex].status
    };

    saveStaff(staff);
    res.json({ message: 'Staff information updated successfully', staff: staff[staffIndex] });
});

/**
 * @route   DELETE /api/owner/staff/:id
 * @desc    Delete a staff member
 */
app.delete('/api/owner/staff/:id', (req, res) => {
    const { id } = req.params;
    const { email } = req.query;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || !user.restaurantId) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    let staff = getStaff();
    const initialLength = staff.length;
    staff = staff.filter(s => !(s.id === parseInt(id) && s.restaurantId === user.restaurantId));

    if (staff.length === initialLength) {
        return res.status(404).json({ message: 'Staff member not found or unauthorized' });
    }

    saveStaff(staff);
    res.json({ message: 'Staff member removed successfully' });
});

/**
 * @route   GET /api/health
 * @desc    Check if the server is alive and well
 * @access  Public
 */
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'DigiDine Backend',
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * @route   GET /
 * @desc    General welcome message
 */
app.get('/', (req, res) => {
    res.send('Welcome to the DigiDine API Gateway. Use /api/health for system status.');
});

/**
 * @route   GET /api/restaurants/:id/tables
 * @desc    Get tables for a specific outlet (Public)
 */
app.get('/api/restaurants/:id/tables', (req, res) => {
    const { id } = req.params;
    const tables = getTables();
    const filtered = tables.filter(t => t.restaurantId === parseInt(id));
    res.json(filtered);
});

// --- Reservation Endpoints ---

/**
 * @route   POST /api/reservations
 * @desc    Create a new table reservation
 */
app.post('/api/reservations', (req, res) => {
    const { restaurantId, userId, tableId, date, time, guests, userEmail } = req.body;
    
    console.log('Received reservation request:', req.body); // DEBUG
    
    // Check for missing or empty required fields
    if(!restaurantId || !tableId || !date || !time || date.trim() === '' || time.trim() === '') {
        console.log('Validation failed:', { restaurantId, tableId, date, time }); // DEBUG
        return res.status(400).json({ message: 'Missing required reservation details' });
    }

    const reservations = getReservations();
    const newReservation = {
        id: Date.now(),
        restaurantId: parseInt(restaurantId),
        userId: userId || null,
        userEmail: userEmail,
        tableId: parseInt(tableId),
        date,
        time,
        guests: parseInt(guests) || 2,
        status: 'Pending',
        createdAt: new Date().toISOString()
    };

    reservations.push(newReservation);
    saveReservations(reservations);

    // Emit event to owner
    emitEvent('new_reservation', newReservation, parseInt(restaurantId));

    res.status(201).json({ message: 'Reservation requested successfully', reservation: newReservation });
});

/**
 * @route   GET /api/owner/reservations
 * @desc    Get all reservations for an outlet
 */
app.get('/api/owner/reservations', (req, res) => {
    const { email } = req.query;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const reservations = getReservations();
    const filtered = user.role === 'admin' 
        ? reservations 
        : reservations.filter(r => r.restaurantId === user.restaurantId);

    res.json(filtered);
});

/**
 * @route   PUT /api/owner/reservations/:id
 * @desc    Update reservation status
 */
app.put('/api/owner/reservations/:id', (req, res) => {
    const { id } = req.params;
    const { status, email } = req.body;
    
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const reservations = getReservations();
    const index = reservations.findIndex(r => r.id === parseInt(id));

    if (index === -1) return res.status(404).json({ message: 'Reservation not found' });
    
    if (user.role !== 'admin' && reservations[index].restaurantId !== user.restaurantId) {
        return res.status(403).json({ message: 'Not authorized for this outlet' });
    }

    reservations[index].status = status;
    saveReservations(reservations);

    res.json({ message: `Reservation ${status}`, reservation: reservations[index] });
});

/**
 * @route   GET /api/customer/reservations
 * @desc    Get reservations for a customer
 */
app.get('/api/customer/reservations', (req, res) => {
    const { email } = req.query;
    if(!email) return res.status(400).json({ message: 'Email required' });

    const reservations = getReservations();
    const filtered = reservations.filter(r => r.userEmail === email);
    res.json(filtered);
});

// --- Server Initialization ---
httpServer.listen(PORT, () => {
    console.log(`
  =========================================
  🚀 DigiDine Backend Server is Running!
  =========================================
  📡 Port: ${PORT}
  🔗 Health Check: http://localhost:${PORT}/api/health
  📡 Real-time: Socket.IO Enabled
  =========================================
    `);
});
