const express = require('express');
const router = express.Router();
const { authenticateUser} = require('../user/utils') 
const { adminAuth } = require('../admin/utils');
const {
    createOrder,
    createGuestOrder,
    getUserOrders,
    getOrdersById,
    getGuestOrderByTrackingId,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
} = require('./orderController');

//middleware to make authentication optional for guest orders
const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
        //if token exists, try to authenticate
        authenticateUser(req, res, next);
    } else {
        //if no token, allow guest order creation
        next();
    }
};


// ------ Create Orders

router.post("/create-orders/user", optionalAuth, createOrder);
router.post("/create-order/guest", createGuestOrder);


router.get('/guest/:trackingId', getGuestOrderByTrackingId);

//authenticated user routes
router.get('/my-orders', authenticateUser, getUserOrders);
router.get('/:orderId', authenticateUser, getOrdersById);
router.patch('/:orderId/cancel', authenticateUser, cancelOrder);

// Admin routes (requires admin authentication)
router.get('/admin/orders', adminAuth, getAllOrders);
router.put('/admin/:orderId', adminAuth, updateOrderStatus);


module.exports = router;