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

router.use(authenticateUser);

router.get('/cart/get', getCart);
router.post('/cart/add', addToCart);
router.put('/cart/update', updateCartItem);
router.delete('/cart/remove/:productId', removeFromCart);
router.delete('/cart/clear', clearCart);

module.exports = router;
