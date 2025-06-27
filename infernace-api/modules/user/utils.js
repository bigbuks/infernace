const jwt = require('jsonwebtoken');
const User = require('./User');

// Middleware to check if user is authenticated
exports.authenticateUser = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided. Please log in and include Authorization header with Bearer token.'
            });
        }

        // Extract token from Bearer header
        const token = authHeader.split(' ')[1];

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

        // Check if user account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Your account has been deactivated.'
            });
        }

        // Attach user data to the request
        req.user = user;
        next();

    } catch (error) {
        console.error('Authentication error:', error);

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