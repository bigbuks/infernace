const User = require('./User');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// function to generate JWT token
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// Register a new user
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide username, email, and password' 
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid email' 
            });
        }

        // Validate password strength
        if (!validator.isLength(password, { min: 8 })) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 8 characters long' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User registration failed. Please try different credentials.' 
            });
        }


        // Hash password
        const saltRounds = 14;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = new User({
            username,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        // Create JWT token
        const token = createToken(savedUser._id);

         const jwtExpiryMs = 2 * 60 * 60 * 1000; // 2 hours
        const cookieExpiryMs = jwtExpiryMs + (5 * 60 * 1000); // JWT + 5 minutes buffer

        // Set cookie
        res.cookie('userToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: cookieExpiryMs,
            path: '/'
        });

        // Send response (exclude password)
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                cart: savedUser.cart,
                createdAt: savedUser.createdAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'User registration failed. Please try different credentials.' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Registration service temporarily unavailable. Please try again later.' 
        });
    }
};

// login a user
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password' 
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide valid credentials' 
            });
        }

        // Add artificial delay to prevent timing attacks
        const startTime = Date.now();
        
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        let isPasswordValid = false;

        if (user) {
            // Compare password
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
            // Perform dummy hash comparison to prevent timing attacks
            await bcrypt.compare(password, '$2b$14$dummy.hash.to.prevent.timing.attacks.12345678901234567890123456');
        }

        // Ensure consistent response time (minimum 500ms)
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 500) {
            await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
        }

        // Generic error for both invalid user and invalid password
        if (!user || !isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Create JWT token
        const token = createToken(user._id);

        // SECURITY FIX: Cookie expires 5 minutes after JWT
        const jwtExpiryMs = 2 * 60 * 60 * 1000; // 2 hours
        const cookieExpiryMs = jwtExpiryMs + (5 * 60 * 1000); // JWT + 5 minutes buffer

        // Set secure cookie
        res.cookie('userToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: cookieExpiryMs,
            path: '/'
        });

        // Send response (exclude password)
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                cart: user.cart,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Authentication service temporarily unavailable' 
        });
    }
};

// logout a user
exports.logoutUser = async (req, res) => {
    try {
        // Clear the cookie
        res.cookie('userToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0, // Set to expire immediately
            path: '/'
        });

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'logout service temporarily unavailable' 
        });
    }
};