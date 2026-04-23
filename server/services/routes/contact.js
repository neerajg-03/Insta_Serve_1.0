const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User');

// @route   POST /api/contact/admin
// @desc    Send message to admin
// @access  Public
router.post('/admin', async (req, res) => {
  try {
    const { name, email, subject, message, timestamp, type } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        message: 'All required fields must be filled' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    // Log the message for admin to review
    console.log('=== NEW ADMIN MESSAGE ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('From:', name);
    console.log('Email:', email);
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('Type:', type || 'user_concern');
    console.log('========================');

    // Store message in database (optional - you could create a Message model)
    // For now, we'll just log it and send email notification

    // Get admin users to notify them
    const adminUsers = await User.find({ role: 'admin' });
    
    // Configure email transporter (use environment variables for production)
    let transporter = null;
    let emailEnabled = false;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your-app-password-here') {
      try {
        transporter = nodemailer.createTransporter({
          service: 'gmail', // or your email service
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        emailEnabled = true;
        console.log('Email service configured');
      } catch (error) {
        console.warn('Failed to configure email service:', error.message);
      }
    } else {
      console.log('Email service not configured - running in development mode');
    }

    // Email content for admin notification
    const adminEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Admin Message</h1>
          <p style="color: white; margin: 5px 0 0;">Insta Serve Contact Form</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Message Details</h2>
            
            <div style="margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>From:</strong> ${name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Type:</strong> ${type || 'user_concern'}</p>
            </div>
            
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Message:</h3>
              <p style="white-space: pre-wrap; margin: 0;">${message}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${email}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reply to User
              </a>
            </div>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">This message was sent from the Insta Serve contact form</p>
          <p style="margin: 5px 0 0; font-size: 12px;">© 2024 Insta Serve. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send email to admin(s)
    const adminEmails = adminUsers.map(admin => admin.email).filter(email => email);
    const primaryAdminEmail = process.env.ADMIN_EMAIL || 'admin@instaserve.com';
    
    // Add primary admin email if no admin users found
    if (adminEmails.length === 0) {
      adminEmails.push(primaryAdminEmail);
    }

    let emailNotificationsSent = 0;
    let failedEmails = 0;

    // Send notification emails to all admins (only if email is configured)
    if (emailEnabled && transporter) {
      const emailPromises = adminEmails.map(adminEmail => 
        transporter.sendMail({
          from: process.env.EMAIL_USER || 'noreply@instaserve.com',
          to: adminEmail,
          subject: `New Admin Message: ${subject}`,
          html: adminEmailContent
        }).catch(error => {
          console.error(`Failed to send email to ${adminEmail}:`, error);
          failedEmails++;
          return { error: true, message: error.message };
        })
      );

      const emailResults = await Promise.all(emailPromises);
      emailNotificationsSent = emailResults.length - failedEmails;

      if (failedEmails > 0) {
        console.warn(`Failed to send ${failedEmails} admin notifications`);
      }

      // Send confirmation email to user (optional)
      try {
        const userConfirmationContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Message Received</h1>
              <p style="color: white; margin: 5px 0 0;">Insta Serve Support</p>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Thank you for contacting us!</h2>
                
                <p style="color: #666; line-height: 1.6;">
                  We have received your message and our admin team will review it shortly. 
                  We typically respond within 24 hours during business days.
                </p>
                
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Your Message Summary:</h3>
                  <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
                  <p style="margin: 5px 0;"><strong>Message:</strong> ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #666; font-size: 14px;">
                    For urgent matters, please call us at: <strong>+91 1800-123-4567</strong>
                  </p>
                </div>
              </div>
            </div>
            
            <div style="background: #333; color: white; padding: 20px; text-align: center;">
              <p style="margin: 0;">© 2024 Insta Serve. All rights reserved.</p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_USER || 'noreply@instaserve.com',
          to: email,
          subject: 'We received your message - Insta Serve Support',
          html: userConfirmationContent
        });
        console.log('Confirmation email sent to user');
      } catch (userEmailError) {
        console.warn('Failed to send confirmation email to user:', userEmailError.message);
        // Don't fail the request if user confirmation fails
      }
    } else {
      console.log('Email notifications skipped - email service not configured');
      console.log('Admin message details (for manual review):');
      console.log(`- Would notify ${adminEmails.length} admin(s): ${adminEmails.join(', ')}`);
      console.log(`- Would send confirmation to: ${email}`);
    }

    res.status(200).json({ 
      message: 'Message sent to admin successfully',
      notifiedAdmins: adminEmails.length,
      emailNotificationsSent: emailNotificationsSent,
      emailEnabled: emailEnabled
    });

  } catch (error) {
    console.error('Error sending message to admin:', error);
    res.status(500).json({ 
      message: 'Failed to send message. Please try again later.' 
    });
  }
});

// @route   GET /api/contact/messages
// @desc    Get all contact messages (admin only)
// @access  Private (Admin)
router.get('/messages', async (req, res) => {
  try {
    // This would require authentication middleware to verify admin role
    // For now, return a placeholder response
    res.status(200).json({
      message: 'Contact messages endpoint - requires admin authentication',
      note: 'Implement message storage and retrieval system'
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ 
      message: 'Failed to fetch messages' 
    });
  }
});

module.exports = router;
