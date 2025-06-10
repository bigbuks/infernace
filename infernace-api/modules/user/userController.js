const User = require('./User');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../../config/sendEmail'); 

// Cookie name
const COOKIE_NAME = 'userToken';

// Cookie configuration
const cookieConfig = {
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none', // CSRF protection
    maxAge: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    path: '/' // Cookie available for all routes
};

// Generate JWT token
const generateToken = (id) => {
    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not set');
    }

    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '2h'
    });
};

const getEmailVerificationTemplate = (username, verificationLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #4CAF50; text-align: center; margin-bottom: 30px;">Verify Your Email</h1>
                
                <p style="font-size: 16px; margin-bottom: 20px;">Hello ${username},</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Thank you for registering with us! To complete your registration and secure your account, 
                    please verify your email address by clicking the button below:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" 
                    style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; 
                            border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                    If the button doesn't work, you can copy and paste this link into your browser:
                </p>
                <p style="font-size: 14px; color: #666; word-break: break-all; background-color: #f8f8f8; padding: 10px; border-radius: 5px;">
                    ${verificationLink}
                </p>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    This verification link will expire in 24 hours for security reasons.
                </p>
                
                <p style="font-size: 14px; color: #666;">
                    If you didn't create this account, please ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">
                    This is an automated message, please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

const getPasswordResetTemplate = (username, resetLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #FF6B6B; text-align: center; margin-bottom: 30px;">Reset Your Password</h1>
                
                <p style="font-size: 16px; margin-bottom: 20px;">Hello ${username},</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    We received a request to reset your password. If you made this request, 
                    please click the button below to reset your password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" 
                    style="background-color: #FF6B6B; color: white; padding: 12px 30px; text-decoration: none; 
                            border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                    If the button doesn't work, you can copy and paste this link into your browser:
                </p>
                <p style="font-size: 14px; color: #666; word-break: break-all; background-color: #f8f8f8; padding: 10px; border-radius: 5px;">
                    ${resetLink}
                </p>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    This password reset link will expire in 1 hour for security reasons.
                </p>
                
                <p style="font-size: 14px; color: #666;">
                    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">
                    This is an automated message, please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Register a new user
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email'
            });
        }

        // Validate password strength (minimum 8 characters)
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            cart: []
        });

        //generate email verification token
        const verificationToken = newUser.generateEmailVerificationToken();

        const savedUser = await newUser.save();

        // create verification link
        const baseUrl =process.env.BASE_URL || 'http://localhost:5173';
        const verificationLink = `${baseUrl}/api/verify-email?token=${verificationToken}`;

        // Send verification email
        try {
            await sendEmail(
                savedUser.email,
                'Verify Your Email Address',
                getEmailVerificationTemplate(savedUser.username, verificationLink)
            );
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email to verify your account.',
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                cart: savedUser.cart,
                isEmailVerified: savedUser.isEmailVerified,
                createdAt: savedUser.createdAt
            },
            emailSent: true // Indicate that the verification email was sent
        });

    } catch (error) {
        console.error('Error registering user:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `User with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while registering user'
        });
    }
};

// verify email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        //find user with verification token
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() } // Check if token hasn't expired
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        //check if email is already verified
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        //update user verification status
        user.isEmailVerified = true;
        user.clearEmailVerificationToken(); // Clear the token and expiration
        await user.save();

        // Verify email
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now log in.',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
            }
        });
    } catch (error) {
        console.error('Error verifying email:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error while verifying email'
        });
    }
};

//resend verification email
exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is already verified
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // Create verification link
        const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
        const verificationLink = `${baseUrl}/api/verify-email?token=${verificationToken}`;

        // Send verification email
        try {
            await sendEmail(
                user.email,
                'Verify Your Email Address',
                getEmailVerificationTemplate(user.username, verificationLink)
            );
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully. Please check your inbox.',
        });
    } catch (emailError) {
        console.error('Error resending verification email:', emailError);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while resending verification email'
        });
    }
}

// Login a user
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email'
            });
        }

        // Add artificial delay to prevent timing attacks
        const startTime = Date.now();

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            // Perform dummy hash comparison to prevent timing attacks
            await bcrypt.compare(password, '$2b$12$dummy.hash.to.prevent.timing.attacks.12345678901234567890123456');
            
            // Ensure consistent response time (minimum 500ms)
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            // Ensure consistent response time (minimum 500ms)
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
            }

            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                emailVerificationRequired: true
            });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Ensure consistent response time (minimum 500ms)
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 500) {
            await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Set token in cookie
        res.cookie(COOKIE_NAME, token, cookieConfig);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                cart: user.cart,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            },
            token
        });

    } catch (error) {
        console.error('Error logging in user:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error while logging in'
        });
    }
};

// Logout user
exports.logoutUser = async (req, res) => {
    try {
        // Clear the cookie
        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
            path: '/'
        });

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Error logging out user:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error while logging out'
        });
    }
};

//forgot password -send reset email
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email'
            });
        }

        // Add artificial delay to prevent timing attacks
        const startTime = Date.now();

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            // Ensure consistent response time (minimum 500ms)
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
            }

            // Don't reveal that user doesn't exist for security
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, we have sent a password reset link.'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            // Ensure consistent response time (minimum 500ms)
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
            }

            return res.status(403).json({
                success: false,
                message: 'Please verify your email address first before resetting your password.',
                emailVerificationRequired: true
            });
        }

        // Generate password reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Create reset link
        const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        // Send password reset email
        try {
            await sendEmail(
                user.email,
                'Password Reset Request',
                getPasswordResetTemplate(user.username, resetLink)
            );
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
            
            // Clear the reset token if email fails
            user.clearPasswordResetToken();
            await user.save();

            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again.'
            });
        }

        // Ensure consistent response time (minimum 500ms)
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 500) {
            await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
        }

        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, we have sent a password reset link.'
        });

    } catch (error) {
        console.error('Error in forgot password:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error while processing password reset request'
        });
    }
};

//reset password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email'
            });
        }

        // Add artificial delay to prevent timing attacks
        const startTime = Date.now();

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            // Ensure consistent response time (minimum 500ms)
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
            }

            // Don't reveal that user doesn't exist for security
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, we have sent a password reset link.'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            // Ensure consistent response time (minimum 500ms)
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
            }

            return res.status(403).json({
                success: false,
                message: 'Please verify your email address first before resetting your password.',
                emailVerificationRequired: true
            });
        }

        // Generate password reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Create reset link
        const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        // Send password reset email
        try {
            await sendEmail(
                user.email,
                'Password Reset Request',
                getPasswordResetTemplate(user.username, resetLink)
            );
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
            
            // Clear the reset token if email fails
            user.clearPasswordResetToken();
            await user.save();

            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again.'
            });
        }

        // Ensure consistent response time (minimum 500ms)
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 500) {
            await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
        }

        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, we have sent a password reset link.'
        });

    } catch (error) {
        console.error('Error in forgot password:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error while processing password reset request'
        });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        // Validate password strength (minimum 8 characters)
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() } // Check if token hasn't expired
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired password reset token'
            });
        }

        // Hash the new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password and clear reset token
        user.password = hashedPassword;
        user.clearPasswordResetToken();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now log in with your new password.'
        });

    } catch (error) {
        console.error('Error resetting password:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error while resetting password'
        });
    }
};