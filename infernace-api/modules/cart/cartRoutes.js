const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../user/utils');
const { 
    getCart, 
    addToCart, 
    updateCartItem, 
    removeFromCart, 
    clearCart
} = require('./cartController');


router.get('/cart/get', authenticateUser ,getCart);
router.post('/cart/add', authenticateUser ,addToCart);
router.put('/cart/update', authenticateUser ,updateCartItem);
router.delete('/cart/remove/:productId', authenticateUser ,removeFromCart);
router.delete('/cart/clear', authenticateUser , clearCart);

module.exports = router;
