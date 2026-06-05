const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const ContactMessage = require('../models/ContactMessage');

// Check if email credentials are properly configured
const isEmailConfigured = () => {
  return process.env.EMAIL_USER && 
         process.env.EMAIL_PASS && 
         process.env.EMAIL_PASS !== 'your_gmail_app_password_here';
};

// Create transporter for sending emails
const createTransporter = () => {
  // For production, use environment variables
  // For development, you can use Gmail with App Password
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'admin.instaserve@gmail.com',
      pass: process.env.EMAIL_PASS // Use App Password, not regular password
    },
    // Add timeout settings for better error handling
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });
};

// Send contact email to admin
router.post('/admin', async (req, res) => {
  try {
    const { name, email, subject, message, timestamp, type } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email, and message' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    // Store message in database first (always do this)
    const contactMessage = new ContactMessage({
      name,
      email,
      subject: subject || 'No subject',
      message,
      type: type || 'user_concern',
      timestamp: timestamp || new Date().toISOString()
    });

    await contactMessage.save();
    console.log('✅ Contact message saved to database:', contactMessage._id);

    // Try to send email if credentials are configured
    let emailSent = false;
    let emailError = null;

    if (isEmailConfigured()) {
      try {
        const transporter = createTransporter();

        // Email to admin
        const mailOptionsToAdmin = {
          from: email, // User's email as sender
          to: 'admin.instaserve@gmail.com',
          subject: subject || `Contact Form Submission from ${name}`,
          text: `
You have received a new contact form submission.

Name: ${name}
Email: ${email}
Subject: ${subject || 'Not specified'}
Type: ${type || 'user_concern'}
Timestamp: ${timestamp || new Date().toISOString()}

Message:
${message}

---
This email was sent from the InstaServe contact form.
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #7C3AED;">New Contact Form Submission</h2>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Subject:</strong> ${subject || 'Not specified'}</p>
                <p><strong>Type:</strong> ${type || 'user_concern'}</p>
                <p><strong>Timestamp:</strong> ${timestamp || new Date().toISOString()}</p>
              </div>
              <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This email was sent from the InstaServe contact form.
              </p>
            </div>
          `
        };

        // Send email
        await transporter.sendMail(mailOptionsToAdmin);
        emailSent = true;
        console.log('✅ Email sent successfully to admin');

        // Optional: Send confirmation email to user
        const mailOptionsToUser = {
          from: 'admin.instaserve@gmail.com',
          to: email,
          subject: 'Thank you for contacting InstaServe',
          text: `
Dear ${name},

Thank you for contacting InstaServe. We have received your message and will get back to you within 24 hours.

Your message:
${message}

If you have any urgent concerns, please contact us directly at admin.instaserve@gmail.com.

Best regards,
InstaServe Team
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #7C3AED;">Thank you for contacting InstaServe</h2>
              <p>Dear ${name},</p>
              <p>Thank you for contacting InstaServe. We have received your message and will get back to you within 24 hours.</p>
              <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <p>If you have any urgent concerns, please contact us directly at <a href="mailto:admin.instaserve@gmail.com">admin.instaserve@gmail.com</a>.</p>
              <p style="margin-top: 30px;">Best regards,<br>InstaServe Team</p>
            </div>
          `
        };

        // Send confirmation email to user (optional, can be removed if not needed)
        try {
          await transporter.sendMail(mailOptionsToUser);
          console.log('✅ Confirmation email sent to user');
        } catch (error) {
          console.error('Error sending confirmation email to user:', error);
          // Don't fail the request if confirmation email fails
        }

      } catch (emailError) {
        emailError = emailError.message;
        console.error('❌ Error sending email:', emailError);
        // Don't throw error, continue to return success since message is saved in DB
      }
    } else {
      console.log('⚠️ Email credentials not configured, skipping email send');
      emailError = 'Email credentials not configured';
    }

    // Update contact message status
    contactMessage.status = emailSent ? 'sent' : 'pending';
    contactMessage.emailSent = emailSent;
    if (emailError) {
      contactMessage.emailError = emailError;
    }
    await contactMessage.save();

    // Return success even if email fails (message is saved in database)
    res.status(200).json({ 
      success: true, 
      message: emailSent 
        ? 'Message sent successfully' 
        : 'Message saved successfully. We will review it shortly.',
      emailSent,
      storedInDatabase: true
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process message. Please try again later.' 
    });
  }
});

// Get all contact messages (admin only)
router.get('/messages', async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Delete a contact message (admin only)
router.delete('/messages/:id', async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

module.exports = router;
