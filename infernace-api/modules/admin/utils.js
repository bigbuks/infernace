const jwt = require('jsonwebtoken');
const Admin = require('./Admin');


//cookie name
const COOKIE_NAME = 'adminToken';

//middleware to check if user is authenticated
exports.adminAuth = async (req, res, next) => {
    try {
        // Try to get token from cookie first, then fall back to Authorization header
        let token = req.cookies?.[COOKIE_NAME] ;

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

        // Check if the admin exists in the database
        const admin = await Admin.findById(decodedToken.id).select('-password');

        if (!admin) {
            // Clear invalid cookie if it exists
            if (req.cookies?.[COOKIE_NAME]) {
                res.clearCookie(COOKIE_NAME, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/'
                });
            }
            
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin not found.' 
            });
        }

        // Attach admin data to the request
        req.user = admin;
        next();

    } catch (error) {
        console.error('Authentication error:', error);

        // Clear invalid cookie if it exists
        if (req.cookies?.[COOKIE_NAME]) {
            res.clearCookie(COOKIE_NAME, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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


