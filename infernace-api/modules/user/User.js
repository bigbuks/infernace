const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,  
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
    },
    password: { 
        type: String, 
        required: true 
    },
    cart: {
        type: Array, 
        default: [] 
    },
    isEmailVerified: { 
        type: Boolean, 
        default: false 
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationExpires: {
        type: Date,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
}, { timestamps: true });

//index for email verification token
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ emailVerificationExpires: 1 });

//index for password reset token
userSchema.index({passwordResetToken: 1});
userSchema.index({passwordResetExpires: 1});

//method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
    const crypto = require('crypto'); // require crypto

    //generate a random token
    const token = crypto.randomBytes(32).toString('hex');

    //set token and expiration (24 hours)
    this.emailVerificationToken = token;
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    return token;
};

//method to clear email verification token
userSchema.methods.clearEmailVerificationToken = function() {
    this.emailVerificationToken = null;
    this.emailVerificationExpires = null;
};

//method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
    const crypto = require('crypto'); //require crypto

    //generate a random token 
    const token = crypto.randomBytes(32).toString('hex');

    //set token and expiration (1 hour)
    this.passwordResetToken = token;
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    return token;
};

//method to clear password reset token
userSchema.methods.clearPasswordResetToken = function() {
    this.passwordResetToken = null;
    this.passwordResetExpires = null;
};

module.exports = mongoose.model('User', userSchema);
