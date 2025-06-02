const express = require('express');
const router = express.Router();
const productController = require('./productController');

router.get('/getProduct', productController.getAllProduct);
router.get('/latest', productController.latestCollection);
router.get('/bestseller', productController.bestSeller);
router.get('/related', productController.relatedProduct);

module.exports = router;
