const express = require('express');
const router = express.Router();

const {
    subscribe,
    confirmSubscription,
    sendNewsletter,
    unsubscribe
} = require('./newsletterController');


//public route make use of this in the frontend for user
router.post('/subscribe', subscribe);
router.get('/confirm/:token', confirmSubscription);
router.get('/unsubscribe/:token', unsubscribe);

// admin route make use of this in the frontend for the admin 
router.post('/send', sendNewsletter);


module.exports = router;
