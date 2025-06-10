const rateLimit = require('express-rate-limit');

// Rate limiter for login attempts
const loginRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    skipSuccessfulRequests: true, // don't count successful login
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 10 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // custom key generator to track by ip + email combinatio for targeted limiting 
    keyGenerator: (req) => {
        return `${req.ip}:${req.body.email || 'unknown'}`;
    }
});

// Rate limiter for registration attempts
const registerRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 2, // Limit each IP to 2 registration requests per hour
    message: {
        success: false,
        message: 'Too many registration attempts, please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General rate limiter for all user routes
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// admin rate limiter for admin routes
const adminRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // stricter for admin endpoints
    message: {
    success: false,
    message: 'Too many requests to admin route, please try again later.'
},
    standardHeaders: true,
    legacyHeaders: false,
});

// admin rate limiter for admin login
const adminLoginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 login requests per windowMs
    skipSuccessfulRequests: true, // don't count successful login
    message: {
        success: false,
        message: 'Too many admin login attempts, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `${req.ip}:${req.body.email || 'unknown'}`;
    }
});

// admin rate limiter for admin registration
const adminRegisterRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1, // Limit each IP to 1 registration request per hour
    message: {
        success: false,
        message: 'Too many admin registration attempts, please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

//email verification rate limiter
const emailVerificationRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Allow 3 resend attempts per hour per IP
    message: {
        success: false,
        message: 'Too many verification email requests. Please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `${req.ip}:${req.body.email || 'unknown'}`;
    }
});

const passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Allow 3 password reset attempts per hour per IP
    message: {
        success: false,
        message: 'Too many password reset requests. Please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `${req.ip}:${req.body.email || req.body.token || 'unknown'}`;
    }
});


// Export the rate limiters
module.exports = {
    loginRateLimit,
    registerRateLimit,
    generalRateLimit, 
    adminRateLimit,
    adminLoginRateLimit,
    adminRegisterRateLimit,
    emailVerificationRateLimit,
    passwordResetRateLimit
};