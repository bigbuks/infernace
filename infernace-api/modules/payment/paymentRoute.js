const express = require("express");
const router = express.Router();

const { verifyPayment } = require("./payment");

router.get('/payments/verify/:reference/:orderId', verifyPayment);

module.exports = router;