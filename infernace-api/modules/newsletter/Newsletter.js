const mongoose = require('mongoose');

const NewsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    confirmationToken: {
        type: String,
        default: null
    }, 
    isConfirmed: {
        type: Boolean,
        default: false
    },
    unsubcribeToken: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Newsletter', NewsletterSchema);