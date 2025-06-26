const jwt = require('jsonwebtoken');
const Admin = require('./Admin');

//middleware to check if user is authenticated
exports.adminAuth = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided. Please log in.' 
            });
        }

        // Extract token from "Bearer <token>"
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. Invalid token format.' 
            });
        }

        // Verify token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the admin exists in the database
        const admin = await Admin.findById(decodedToken.id).select('-password');

        if (!admin) {
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