const express = require('express'); //to require express
const router = express.Router(); //to create a new router instance
const { 
    registerUser, 
    loginUser, 
    logoutUser,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword
 } = require('./userController'); //importing user controller functions

//authentication middle ware
const { authenticateUser } = require('./utils'); //importing authentication middleware

// rate limiting middleware
const { 
    loginRateLimit,
    registerRateLimit,
    generalRateLimit,
    emailVerificationRateLimit,
    passwordResetRateLimit
     } = require('../../config/rateLimiter'); //importing rate limiting middleware

// Apply general rate limiting to all user routes
router.use(generalRateLimit); //apply general rate limiting to all user routes


// routes
router.post('/register-user', registerRateLimit, registerUser); //route for user registration
router.post('/login-user', loginRateLimit, loginUser); //route for user login
router.post('/logout-user', authenticateUser, logoutUser); //route for user logout

// Email verification routes
router.get('/verify-email/:token',  verifyEmail); //route for email verification
router.post('/resend-verification-email', emailVerificationRateLimit, resendVerificationEmail); //route to resend verification email

//password reset routes
router.post('/forgot-password', passwordResetRateLimit ,forgotPassword) //route for forgot password
router.post('/reset-password', passwordResetRateLimit ,resetPassword) //route for reset password


// Export the router
module.exports = router; //exporting the router instance