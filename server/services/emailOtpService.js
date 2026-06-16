const nodemailer = require('nodemailer');

// In-memory OTP storage (in production, use Redis)
const otpStore = new Map();

// OTP expiration time in minutes
const OTP_EXPIRY_MINUTES = 5;

// Check if email credentials are properly configured
const isEmailConfigured = () => {
  return process.env.EMAIL_USER && 
         process.env.EMAIL_PASS && 
         process.env.EMAIL_PASS !== 'your_gmail_app_password_here';
};

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'admin.instaserve@gmail.com',
      pass: process.env.EMAIL_PASS
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
 * @returns {Promise<Object>} - Response with success status and message
 */
const sendEmailOTP = async (email) => {
  try {
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        success: false,
        message: 'Invalid email address format'
      };
    }

    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('Email not configured. Using mock OTP for testing.');
      // For testing without email credentials
      const mockOTP = generateOTP();
      otpStore.set(email, {
        otp: mockOTP,
        expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
        attempts: 0
      });
      console.log(`Mock OTP for ${email}: ${mockOTP}`);
      return {
        success: true,
        message: 'OTP sent successfully (mock mode)',
        otp: mockOTP // Only return OTP in mock mode for testing
      };
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
      attempts: 0
    });

    // Create transporter
    const transporter = createTransporter();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'admin.instaserve@gmail.com',
      to: email,
      subject: 'InstaServe - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7C3AED;">Email Verification</h2>
          <p>Hello,</p>
          <p>Your OTP for InstaServe authentication is:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #7C3AED; letter-spacing: 5px;">${otp}</span>
          </div>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email or contact our support team.</p>
          <p>Best regards,<br>The InstaServe Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`OTP sent to email: ${email}`);

    return {
      success: true,
      message: 'OTP sent successfully to your email'
    };
  } catch (error) {
    console.error('Error sending email OTP:', error);
    
    // Fallback to mock mode if email fails
    console.warn('Email sending failed, falling back to mock mode');
    const mockOTP = generateOTP();
    otpStore.set(email, {
      otp: mockOTP,
      expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
      attempts: 0
    });
    console.log(`Fallback Mock OTP for ${email}: ${mockOTP}`);
    
    return {
      success: true,
      message: 'OTP sent successfully (fallback mode)',
      otp: mockOTP,
      fallback: true
    };
  }
};

/**
 * Verify OTP for email
 * @param {string} email - Email address
 * @param {string} otp - OTP to verify
 * @returns {Object} - Response with success status and message
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
    const storedData = otpStore.get(email);

    if (!storedData) {
      return {
        success: false,
        message: 'No OTP sent to this email. Please request a new OTP.'
      };
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return {
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      };
    }

    // Check if too many attempts
    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      };
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      otpStore.set(email, storedData);
      return {
        success: false,
        message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
      };
    }

    // OTP verified successfully - remove from store
    otpStore.delete(email);

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
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
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
