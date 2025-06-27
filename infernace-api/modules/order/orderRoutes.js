const express = require('express');
const router = express.Router();
const { authenticateUser} = require('../user/utils') 
const { adminAuth } = require('../admin/utils');
const {
    createOrder,
    getUserOrders,
    getOrdersById,
    getGuestOrderByTrackingId,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
    createGuestOrder
} = require('./orderController');

// ------ Create Orders

router.post("/create-order/user", authenticateUser , createOrder);
router.post("/create-order/by-guest", createGuestOrder);


router.get('/guest/:trackingId', getGuestOrderByTrackingId);

//authenticated user routes
router.get('/my-orders', authenticateUser, getUserOrders);
router.get('/:orderId', authenticateUser, getOrdersById);
router.patch('/:orderId/cancel', authenticateUser, cancelOrder);

// Admin routes (requires admin authentication)
router.get('/admin/orders', adminAuth, getAllOrders);
router.put('/admin/:orderId', adminAuth, updateOrderStatus);


module.exports = router;