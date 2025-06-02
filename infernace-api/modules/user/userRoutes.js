const express = require('express'); //to require express
const router = express.Router(); //to create a new router instance
const { 
    registerUser, 
    loginUser, 
    logoutUser
 } = require('./userController'); //importing user controller functions

//authentication middle ware
const { authenticateUser } = require('./utils'); //importing authentication middleware

// rate limiting middleware
const { 
    loginRateLimit,
    registerRateLimit,
    generalRateLimit
     } = require('../../config/rateLimiter'); //importing rate limiting middleware

// Apply general rate limiting to all user routes
router.use(generalRateLimit); //apply general rate limiting to all user routes


// routes
router.post('/register-user', registerRateLimit, registerUser); //route for user registration
router.post('/login-user', loginRateLimit, loginUser); //route for user login
router.post('/logout-user', authenticateUser, logoutUser); //route for user logout


// Export the router
module.exports = router; //exporting the router instance