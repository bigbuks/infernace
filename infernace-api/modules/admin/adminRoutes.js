const express = require("express");
const router = express.Router();
const { upload } = require('../../config/cloudinary');
const { adminAuth } = require('./utils');


//rate limiting middleware
const { 
    adminRateLimit, 
    adminLoginRateLimit,
    adminRegisterRateLimit
} = require('../../config/rateLimiter');

// Apply rate limiting to admin routes
router.use(adminRateLimit); // Apply general rate limiting to all admin routes


const { 
    addproduct, 
    updateproduct, 
    deleteproduct, 
    adminRegister, 
    adminLogin, 
    adminLogout 
} = require("./adminController");

//multer configuration for multiple image fields 
const uploadFields = upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 }
]);


// admin authentication routes
router.post('/register', adminRegisterRateLimit, adminRegister);
router.post('/login', adminLoginRateLimit, adminLogin);
router.post('/logout', adminAuth, adminLogout);

//product management routes
router.post('/addproduct', adminAuth, uploadFields, addproduct);
router.put('/updateproduct/:id', adminAuth, uploadFields, updateproduct);
router.delete('/deleteproduct/:id', adminAuth, deleteproduct);



// Export the router
module.exports = router;