const jwt = require('jsonwebtoken');
const User = require('./User');

// Cookie name
const COOKIE_NAME = 'userToken';

// Middleware to check if user is authenticated
exports.authenticateUser = async (req, res, next) => {
    try {
        // Try to get token from cookie first, then fall back to Authorization header
        let token = req.cookies?.[COOKIE_NAME];

        // If no cookie token, check Authorization header (for API clients)
        if (!token) {
            const authHeader = req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        // Check if token is present
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided. Please log in.'
            });
        }

        // Verify token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the user exists in the database
        const user = await User.findById(decodedToken.id).select('-password');

        if (!user) {
            // Clear invalid cookie if it exists
            if (req.cookies?.[COOKIE_NAME]) {
                res.clearCookie(COOKIE_NAME, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
                    path: '/'
                });
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied. User not found.'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Please verify your email address first.',
                emailVerificationRequired: true
            });
        }

        // Attach user data to the request
        req.user = user;
        next();

    } catch (error) {
        console.error('Authentication error:', error);

        // Clear invalid cookie if it exists
        if (req.cookies?.[COOKIE_NAME]) {
            res.clearCookie(COOKIE_NAME, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
                path: '/'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please log in again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication error. Please try again.'
        });
    }
};