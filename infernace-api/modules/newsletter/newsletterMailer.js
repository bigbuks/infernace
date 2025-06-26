const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // service provider
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

//send confirmation email
exports.sendConfirmationEmail = async (email, confirmationToken) => {
    const confirmationUrl = `${process.env.BASE_URL}/api/confirm/${confirmationToken}`;
    
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Inference Newsletter!</h2>
            <p>Thank you for subscribing to our newsletter. Please confirm your subscription by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Confirm Subscription
                </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
            <p>If you didn't subscribe to this newsletter, please ignore this email.</p>
        </div>
    `;

    const mailOptions = {
        from: `"Inference Newsletter" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Please confirm your newsletter subscription',
        html: htmlContent
    };

    await transporter.sendMail(mailOptions);
};

//send newsletter to all subscribers
exports.sendNewsletterEmail = async (recipients, subject, htmlContent) => {
    const unsubscribePlaceholder = '{{UNSUBSCRIBE_URL}}';
    
    // Send emails in batches to avoid rate limiting
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
        const emailPromises = batch.map(async (recipient) => {
            const unsubscribeUrl = `${process.env.BASE_URL}/api/unsubscribe/${recipient.unsubscribeToken}`;
            const personalizedContent = htmlContent.replace(unsubscribePlaceholder, unsubscribeUrl);
            
            const mailOptions = {
                from: `"Inference Newsletter" <${process.env.SMTP_USER}>`,
                to: recipient.email,
                subject,
                html: personalizedContent + `
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
                        <p>You're receiving this email because you subscribed to our newsletter.</p>
                        <p><a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a></p>
                    </div>
                `
            };

            return transporter.sendMail(mailOptions);
        });

        await Promise.all(emailPromises);
        
        // Add delay between batches to avoid rate limiting
        if (batch !== batches[batches.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
};
