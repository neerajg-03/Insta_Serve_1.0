const nodemailer = require('nodemailer');

// In-memory OTP storage for email (in production, use Redis)
const emailOTPStore = new Map();

// OTP expiration time in minutes
const OTP_EXPIRY_MINUTES = 5;

// Check if email credentials are properly configured
const isEmailConfigured = () => {
  return process.env.EMAIL_USER && 
         process.env.EMAIL_PASS && 
         process.env.EMAIL_PASS !== 'your_gmail_app_password_here';
};

// Create transporter for sending emails (same as contact page)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'admin.instaserve@gmail.com',
      pass: process.env.EMAIL_PASS // Use App Password, not regular password
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });
};

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to email address
 * @param {string} email - Email address
 * @param {string} purpose - Purpose of OTP (login/signup)
 * @returns {Promise<Object>} - Response with success status and message
 */
const sendEmailOTP = async (email, purpose = 'login') => {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return {
        success: false,
        message: 'Invalid email address'
      };
    }

    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('Email credentials not configured. Using mock OTP for testing.');
      // For testing without email credentials
      const mockOTP = generateOTP();
      emailOTPStore.set(email, {
        otp: mockOTP,
        expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
        attempts: 0,
        purpose
      });
      console.log(`Mock Email OTP for ${email}: ${mockOTP}`);
      return {
        success: true,
        message: 'OTP sent successfully (mock mode)',
        otp: mockOTP, // Only return OTP in mock mode for testing
        mockMode: true
      };
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration
    emailOTPStore.set(email, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
      attempts: 0,
      purpose
    });

    // Create email transporter
    const transporter = createTransporter();

    // Determine email content based on purpose
    const subject = purpose === 'signup' 
      ? 'Verify your email - InstaServe Registration'
      : 'Login OTP - InstaServe';
    
    const htmlContent = purpose === 'signup'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7C3AED;">Welcome to InstaServe!</h2>
          <p>Thank you for registering with InstaServe. Please verify your email address using the OTP below:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #7C3AED;">${otp}</span>
          </div>
          <p><strong>This OTP will expire in 5 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email or contact our support team.</p>
          <p style="margin-top: 30px;">Best regards,<br>The InstaServe Team</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7C3AED;">Login OTP - InstaServe</h2>
          <p>You requested to login to your InstaServe account. Use the OTP below to complete your login:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #7C3AED;">${otp}</span>
          </div>
          <p><strong>This OTP will expire in 5 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email or contact our support team immediately.</p>
          <p style="margin-top: 30px;">Best regards,<br>The InstaServe Team</p>
        </div>
      `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'admin.instaserve@gmail.com',
      to: email,
      subject: subject,
      html: htmlContent
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`Email OTP sent to ${email}: ${otp}`);

    return {
      success: true,
      message: 'OTP sent successfully to your email',
      mockMode: false
    };
  } catch (error) {
    console.error('Error sending email OTP:', error);
    
    // Fallback to mock mode if email sending fails
    console.warn('Email sending failed, falling back to mock mode');
    const mockOTP = generateOTP();
    emailOTPStore.set(email, {
      otp: mockOTP,
      expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
      attempts: 0,
      purpose
    });
    console.log(`Fallback Mock Email OTP for ${email}: ${mockOTP}`);
    
    return {
      success: true,
      message: 'OTP sent successfully (fallback mode)',
      otp: mockOTP,
      mockMode: true,
      fallback: true
    };
  }
};

/**
 * Verify OTP for email
 * @param {string} email - Email address
 * @param {string} otp - OTP to verify
 * @returns {Promise<Object>} - Response with success status and message
 */
const verifyEmailOTP = (email, otp) => {
  try {
    // Validate inputs
    if (!email || !otp) {
      return {
        success: false,
        message: 'Email and OTP are required'
      };
    }

    // Check if OTP exists for this email
    const storedData = emailOTPStore.get(email);

    if (!storedData) {
      return {
        success: false,
        message: 'No OTP sent to this email. Please request a new OTP.'
      };
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiresAt) {
      emailOTPStore.delete(email);
      return {
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      };
    }

    // Check if too many attempts
    if (storedData.attempts >= 3) {
      emailOTPStore.delete(email);
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      };
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      emailOTPStore.set(email, storedData);
      return {
        success: false,
        message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
      };
    }

    // OTP verified successfully - remove from store
    emailOTPStore.delete(email);

    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    };
  }
};

/**
 * Clean up expired OTPs (run periodically)
 */
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, data] of emailOTPStore.entries()) {
    if (now > data.expiresAt) {
      emailOTPStore.delete(email);
      console.log(`Cleaned up expired OTP for ${email}`);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  sendEmailOTP,
  verifyEmailOTP,
  generateOTP
};
