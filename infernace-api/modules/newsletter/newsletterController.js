const Newsletter = require('./Newsletter');	
const crypto = require('crypto');
const { 
    sendConfirmationEmail, 
    sendNewsletterEmail
} = require('./newsletterMailer');

//subscribe to newsletter
exports.subscribe = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if email already exists
        const existingSubscriber = await Newsletter.findOne({ email });
        
        if (existingSubscriber) {
            if (existingSubscriber.isConfirmed && existingSubscriber.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already subscribed'
                });
            }
            
            // If exists but not confirmed, resend confirmation
            if (!existingSubscriber.isConfirmed) {
                await sendConfirmationEmail(email, existingSubscriber.confirmationToken);
                return res.status(200).json({
                    success: true,
                    message: 'Confirmation email has been resent. Please check your email.'
                });
            }
        }

        // Generate tokens
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');

        // Create new subscriber
        const subscriber = new Newsletter({
            email,
            confirmationToken,
            unsubscribeToken,
            isConfirmed: false,
            isActive: true
        });

        await subscriber.save();

        // Send confirmation email
        await sendConfirmationEmail(email, confirmationToken);

        res.status(201).json({
            success: true,
            message: 'Subscription successful! Please check your email to confirm your subscription.'
        });

    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
}

//confirm subscription
exports.confirmSubscription = async (req, res) => {
    try {
        const { token } = req.params;

        const subscriber = await Newsletter.findOne({ confirmationToken: token });

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired confirmation token'
            });
        }

        if (subscriber.isConfirmed) {
            return res.status(400).json({
                success: false,
                message: 'Email is already confirmed'
            });
        }

        // Confirm subscription
        subscriber.isConfirmed = true;
        subscriber.confirmationToken = null;
        await subscriber.save();

        res.status(200).json({
            success: true,
            message: 'Email confirmed successfully! You are now subscribed to our newsletter.'
        });

    } catch (error) {
        console.error('Confirm subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// Send newsletter to all confirmed subscribers
exports.sendNewsletter = async (req, res) => {
    try {
        const { subject, htmlContent } = req.body;

        if (!subject || !htmlContent) {
            return res.status(400).json({
                success: false,
                message: 'Subject and content are required'
            });
        }

        // Get all confirmed and active subscribers
        const subscribers = await Newsletter.find({ 
            isConfirmed: true, 
            isActive: true 
        }).select('email unsubscribeToken');

        if (subscribers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active subscribers found'
            });
        }

        // Send newsletter
        await sendNewsletterEmail(subscribers, subject, htmlContent);

        res.status(200).json({
            success: true,
            message: `Newsletter sent successfully to ${subscribers.length} subscribers`
        });

    } catch (error) {
        console.error('Send newsletter error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send newsletter. Please try again later.'
        });
    }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
    try {
        const { token } = req.params;

        const subscriber = await Newsletter.findOne({ unsubscribeToken: token });

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Invalid unsubscribe token'
            });
        }

        if (!subscriber.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Email is already unsubscribed'
            });
        }

        // Unsubscribe
        subscriber.isActive = false;
        await subscriber.save();

        res.status(200).json({
            success: true,
            message: 'Successfully unsubscribed from newsletter'
        });

    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
}