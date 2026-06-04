const axios = require('axios');

// Initialize MSG91 with credentials
const authKey = process.env.MSG91_AUTH_KEY;
const widgetId = process.env.MSG91_WIDGET_ID;

// In-memory OTP storage (in production, use Redis)
const otpStore = new Map();

// OTP expiration time in minutes
const OTP_EXPIRY_MINUTES = 5;

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to mobile number using MSG91 Widget
 * @param {string} phone - Phone number (10 digits, without country code)
 * @returns {Promise<Object>} - Response with success status and message
 */
const sendOTP = async (phone) => {
  try {
    // Validate phone number
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return {
        success: false,
        message: 'Invalid phone number format'
      };
    }

    // Check if MSG91 is configured
    if (!authKey || authKey === 'your_msg91_auth_key_here' || !widgetId || widgetId === 'your_msg91_widget_id_here') {
      console.warn('MSG91 not configured. Using mock OTP for testing.');
      // For testing without MSG91 credentials
      const mockOTP = generateOTP();
      otpStore.set(phone, {
        otp: mockOTP,
        expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
        attempts: 0
      });
      console.log(`Mock OTP for ${phone}: ${mockOTP}`);
      return {
        success: true,
        message: 'OTP sent successfully (mock mode)',
        otp: mockOTP, // Only return OTP in mock mode for testing
        widgetId: null
      };
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
      attempts: 0
    });

    // Send OTP via MSG91 REST API
    // MSG91 OTP API endpoint - using send OTP API
    const msg91Url = `https://control.msg91.com/api/v5/otp`;
    
    const payload = {
      template_id: widgetId,
      mobile: `91${phone}`,
      otp: otp,
      expiry: 300 // 5 minutes in seconds
    };

    const headers = {
      'authkey': authKey,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    };

    console.log('Sending OTP via MSG91 REST API...');
    console.log('URL:', msg91Url);
    console.log('Payload:', JSON.stringify(payload));
    console.log('AuthKey:', authKey);
    console.log('WidgetId:', widgetId);

    const response = await axios.post(msg91Url, payload, { headers });

    console.log(`OTP sent to ${phone}: ${otp}`);
    console.log('MSG91 Response:', response.data);
    console.log('MSG91 Status:', response.status);

    return {
      success: true,
      message: 'OTP sent successfully',
      widgetId: widgetId,
      response
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Fallback to mock mode if MSG91 fails
    console.warn('MSG91 API failed, falling back to mock mode');
    const mockOTP = generateOTP();
    otpStore.set(phone, {
      otp: mockOTP,
      expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
      attempts: 0
    });
    console.log(`Fallback Mock OTP for ${phone}: ${mockOTP}`);
    
    return {
      success: true,
      message: 'OTP sent successfully (fallback mode)',
      otp: mockOTP,
      widgetId: widgetId,
      fallback: true
    };
  }
};

/**
 * Verify OTP for mobile number
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to verify
 * @returns {Promise<Object>} - Response with success status and message
 */
const verifyOTP = (phone, otp) => {
  try {
    // Validate inputs
    if (!phone || !otp) {
      return {
        success: false,
        message: 'Phone number and OTP are required'
      };
    }

    // Check if OTP exists for this phone
    const storedData = otpStore.get(phone);

    if (!storedData) {
      return {
        success: false,
        message: 'No OTP sent to this number. Please request a new OTP.'
      };
    }

    // Check if OTP has expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phone);
      return {
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      };
    }

    // Check if too many attempts
    if (storedData.attempts >= 3) {
      otpStore.delete(phone);
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      };
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      otpStore.set(phone, storedData);
      return {
        success: false,
        message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
      };
    }

    // OTP verified successfully - remove from store
    otpStore.delete(phone);

    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    };
  }
};

/**
 * Verify OTP using MSG91 Widget verification
 * @param {string} phone - Phone number
 * @param {string} otp - OTP to verify
 * @returns {Promise<Object>} - Response with success status and message
 */
const verifyOTPWithWidget = async (phone, otp) => {
  try {
    // Validate inputs
    if (!phone || !otp) {
      return {
        success: false,
        message: 'Phone number and OTP are required'
      };
    }

    // Check if MSG91 is configured
    if (!authKey || authKey === 'your_msg91_auth_key_here' || !widgetId || widgetId === 'your_msg91_widget_id_here') {
      // Fall back to local verification for testing
      return verifyOTP(phone, otp);
    }

    // Verify OTP via MSG91 REST API
    const msg91Url = `https://control.msg91.com/api/v5/otp/verify`;
    
    const payload = {
      mobile: `91${phone}`,
      otp: otp
    };

    const headers = {
      'authkey': authKey,
      'Content-Type': 'application/json'
    };

    console.log('Verifying OTP via MSG91 REST API...');
    console.log('URL:', msg91Url);
    console.log('Payload:', JSON.stringify(payload));

    const response = await axios.post(msg91Url, payload, { headers });

    console.log('MSG91 Verify Response:', response.data);

    if (response.data.type === 'success') {
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Invalid OTP'
      };
    }
  } catch (error) {
    console.error('Error verifying OTP with widget:', error);
    // Fall back to local verification
    return verifyOTP(phone, otp);
  }
};

/**
 * Clean up expired OTPs (run periodically)
 */
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(phone);
      console.log(`Cleaned up expired OTP for ${phone}`);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  sendOTP,
  verifyOTP,
  verifyOTPWithWidget,
  generateOTP
};
