const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ProviderWallet = require('../models/ProviderWallet');
const { protect } = require('../middleware/auth');
const passport = require('../config/googleAuth');
const nodemailer = require('nodemailer');
const { sendOTP, verifyOTP, verifyOTPWithWidget } = require('../services/otpService');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage(
        'Name must be between 2 and 50 characters'
      ),

    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage(
        'Please provide a valid email'
      ),

    body('password')
      .isLength({ min: 6 })
      .withMessage(
        'Password must be at least 6 characters long'
      ),

    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage(
        'Please provide a valid 10-digit phone number'
      ),

    body('role')
      .isIn(['customer', 'provider'])
      .withMessage(
        'Role must be either customer or provider'
      )
  ],

  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        email,
        password,
        phone,
        role,
        address
      } = req.body;

      const existingUser = await User.findOne({
        $or: [{ email }, { phone }]
      });

      if (existingUser) {
        return res.status(400).json({
          message:
            'User with this email or phone number already exists'
        });
      }

      const user = new User({
        name,
        email,
        password,
        phone,
        role: role || 'customer',
        address
      });

      await user.save();

      // Provider signup bonus
      if (user.role === 'provider') {
        try {
          const wallet =
            await ProviderWallet.getOrCreateWallet(
              user._id
            );

          await wallet.addBonus(
            300,
            'Signup bonus - Welcome to InstaServe!'
          );

          console.log(
            `💰 Added 300 Rs signup bonus to provider wallet: ${user.email}`
          );
        } catch (walletError) {
          console.error(
            'Wallet bonus error:',
            walletError
          );
        }
      }

      const token = generateToken(user._id);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: user.getProfile()
      });
    } catch (error) {
      console.error(
        'Registration error:',
        error
      );

      res.status(500).json({
        message:
          'Server error during registration'
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage(
        'Please provide a valid email'
      ),

    body('password')
      .notEmpty()
      .withMessage(
        'Password is required'
      )
  ],

  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({
        email
      }).select('+password');

      if (!user) {
        return res.status(401).json({
          message:
            'Invalid email or password'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          message:
            'Account is deactivated'
        });
      }

      const isPasswordValid =
        await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          message:
            'Invalid email or password'
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        message: 'Login successful',
        token,
        user: user.getProfile()
      });
    } catch (error) {
      console.error('Login error:', error);

      res.status(500).json({
        message:
          'Server error during login'
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(
      req.user._id
    );

    res.json({
      user: user.getProfile()
    });
  } catch (error) {
    console.error(
      'Get user error:',
      error
    );

    res.status(500).json({
      message: 'Server error'
    });
  }
});

// ===============================
// GOOGLE OAUTH ROUTES
// ===============================

// @route   GET /api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get(
  '/google',

  (req, res, next) => {
    console.log('========== GOOGLE AUTH INIT ==========');
    console.log('Query params:', req.query);

    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET
    ) {
      return res.status(503).json({
        message:
          'Google OAuth is not configured'
      });
    }

    next();
  },

  (req, res, next) => {
    // Store callback_url in session state for later use
    const callbackUrl = req.query.callback_url || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`;
    
    console.log('Frontend callback URL:', callbackUrl);
    console.log('Server callback URL (for Google):', process.env.GOOGLE_CALLBACK_URL);
    
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: encodeURIComponent(callbackUrl)
    })(req, res, next);
  }
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', (req, res, next) => {
  console.log('========== GOOGLE CALLBACK HIT ==========');
  console.log('Request URL:', req.originalUrl);
  console.log('Query params:', req.query);
  console.log('Configured callback URL:', process.env.GOOGLE_CALLBACK_URL);

  passport.authenticate(
    'google',
    { session: false },
    async (err, user, info) => {
      try {
        console.log(
          '========== GOOGLE CALLBACK =========='
        );

        console.log('ERROR:', err);
        console.log('USER:', user);
        console.log('INFO:', info);

        if (err) {
          console.error(
            'FULL GOOGLE ERROR:',
            err
          );

          // Check for specific OAuth errors
          if (err.code === 'invalid_grant') {
            console.error('❌ INVALID_GRANT ERROR - Redirect URI mismatch detected');
            console.error('Expected callback URL:', process.env.GOOGLE_CALLBACK_URL);
            console.error('This error usually means the redirect URI in Google Cloud Console does not match the callback URL in server configuration.');
            
            const callbackUrl = decodeURIComponent(req.query.state || '') || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`;
            const errorUrl = `${callbackUrl}?error=google_auth_failed&message=redirect_uri_mismatch`;
            return res.redirect(errorUrl);
          }

          return res.status(500).json({
            message:
              'Google authentication failed',
            error: err.message,
            stack: err.stack,
            details: err
          });
        }

        if (!user) {
          return res.status(401).json({
            message:
              'No user returned from Google'
          });
        }

        const token = generateToken(
          user._id
        );

        user.lastLogin = new Date();
        await user.save();

        const userProfile = user.getProfile();
        
        // Add isNewUser flag for new users who haven't completed their profile
        // Users with placeholder phone starting with '999' need to complete profile
        if (user.authMethod === 'google' && (!user.phone || user.phone.startsWith('999'))) {
          userProfile.isNewUser = true;
        }

        // Get callback URL from state parameter, default to frontend URL
        const callbackUrl = decodeURIComponent(req.query.state || '') || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`;
        
        const redirectUrl = `${callbackUrl}?token=${token}&user=${encodeURIComponent(
          JSON.stringify(
            userProfile
          )
        )}`;

        console.log(
          '✅ GOOGLE LOGIN SUCCESS - Redirecting to:',
          redirectUrl
        );

        return res.redirect(redirectUrl);
      } catch (callbackError) {
        console.error(
          'CALLBACK PROCESS ERROR:',
          callbackError
        );

        return res.status(500).json({
          message:
            'Callback processing failed',
          error: callbackError.message,
          stack: callbackError.stack
        });
      }
    }
  )(req, res, next);
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post(
  '/logout',
  protect,
  (req, res) => {
    res.json({
      message: 'Logout successful'
    });
  }
);

// @route   POST /api/auth/google/complete
// @desc    Complete Google sign-up with additional info
// @access  Public
router.post(
  '/google/complete',
  async (req, res) => {
    try {
      const {
        googleData,
        phone,
        password,
        role,
        address
      } = req.body;

      if (!googleData || !googleData.googleId || !googleData.email) {
        return res.status(400).json({
          message: 'Invalid Google data'
        });
      }

      if (!phone) {
        return res.status(400).json({
          message: 'Phone number is required'
        });
      }

      // Prevent users from using placeholder phone pattern (starts with 999)
      if (phone.startsWith('999')) {
        return res.status(400).json({
          message: 'Phone number cannot start with 999'
        });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters long'
        });
      }

      if (!role || !['customer', 'provider'].includes(role)) {
        return res.status(400).json({
          message: 'Valid role is required'
        });
      }

      // Check if user already exists
      let user = await User.findOne({
        googleId: googleData.googleId
      });

      if (user) {
        // Check if phone number is already taken by another user
        const phoneExists = await User.findOne({
          phone,
          _id: { $ne: user._id }
        });

        if (phoneExists) {
          return res.status(400).json({
            message: 'This phone number is already registered with another account'
          });
        }

        // Update existing user with new info
        user.phone = phone;
        user.password = password;
        user.role = role;
        if (address) {
          user.address = address;
        }
        await user.save();
      } else {
        // Check if phone number is already taken
        const phoneExists = await User.findOne({ phone });

        if (phoneExists) {
          return res.status(400).json({
            message: 'This phone number is already registered with another account'
          });
        }

        // Create new user with Google data and additional info
        const newUser = new User({
          googleId: googleData.googleId,
          email: googleData.email,
          name: googleData.name,
          profilePicture: googleData.profilePicture || '',
          authMethod: 'google',
          emailVerified: true,
          password,
          phone,
          role,
          address
        });

        await newUser.save();
        user = newUser;
      }

      // Provider signup bonus
      if (user.role === 'provider') {
        try {
          const wallet =
            await ProviderWallet.getOrCreateWallet(
              user._id
            );

          await wallet.addBonus(
            300,
            'Signup bonus - Welcome to InstaServe!'
          );

          console.log(
            `💰 Added 300 Rs signup bonus to provider wallet: ${user.email}`
          );
        } catch (walletError) {
          console.error(
            'Wallet bonus error:',
            walletError
          );
        }
      }

      const token = generateToken(user._id);

      res.status(201).json({
        message: 'Google sign-up completed successfully',
        token,
        user: user.getProfile()
      });
    } catch (error) {
      console.error(
        'Google completion error:',
        error
      );

      res.status(500).json({
        message:
          'Server error during Google sign-up completion'
      });
    }
  }
);

// @route   GET /api/auth/smtp-test
// @desc    Test SMTP connection
// @access  Public
router.get('/smtp-test', async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_gmail_app_password_here') {
      return res.status(500).send('Email not configured');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });

    await transporter.verify();
    res.send('SMTP OK');
  } catch (err) {
    console.error('SMTP Test Error:', err);
    res.status(500).send(err.message);
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset link to registered email
// @access  Public
router.post(
  '/forgot-password',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Find user by email
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          message: 'No account found with this email address'
        });
      }

      // Check if email is configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_gmail_app_password_here') {
        console.error('Email not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
        return res.status(500).json({
          message: 'Email service not configured. Please set up Gmail App Password in server environment variables.'
        });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

      // Save reset token to user
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetTokenExpiry;
      await user.save();

      // Create reset link
      const resetLink = `https://insta-serve-1-0.onrender.com/reset-password?token=${resetToken}`;

      // Create email transporter
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });

      // Verify SMTP connection before sending
      try {
        await new Promise((resolve, reject) => {
          transporter.verify((error, success) => {
            if (error) {
              console.error('SMTP Verify Error:', error);
              reject(error);
            } else {
              console.log('SMTP Server Ready');
              resolve(success);
            }
          });
        });
      } catch (verifyError) {
        console.error('SMTP connection verification failed:', verifyError);
        return res.status(500).json({
          message: 'Unable to connect to email server. Please try again later.'
        });
      }

      // Send reset link to user's email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset - InstaServe',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #7C3AED;">Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You requested to reset your password for your InstaServe account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #7C3AED; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style="background: #f3f4f6; padding: 15px; border-radius: 8px; word-break: break-all; font-size: 14px;">
              ${resetLink}
            </p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this, please ignore this email or contact our support team.</p>
            <p>Best regards,<br>The InstaServe Team</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      console.log(`Password reset link sent to email: ${user.email}`);

      res.json({
        message: 'Password reset link has been sent to your registered email address'
      });
    } catch (error) {
      console.error('Forgot password error:', error);

      res.status(500).json({
        message: 'Server error while sending reset link. Please try again later.'
      });
    }
  }
);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { token, password } = req.body;

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          message: 'Invalid or expired reset token. Please request a new password reset link.'
        });
      }

      // Update password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      console.log(`Password reset successful for user: ${user.email}`);

      res.json({
        message: 'Password has been reset successfully. You can now login with your new password.'
      });
    } catch (error) {
      console.error('Reset password error:', error);

      res.status(500).json({
        message: 'Server error while resetting password. Please try again later.'
      });
    }
  }
);

// ===============================
// OTP AUTHENTICATION ROUTES
// ===============================

// @route   POST /api/auth/otp/send
// @desc    Send OTP to mobile number
// @access  Public
router.post(
  '/otp/send',
  [
    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid 10-digit phone number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { phone } = req.body;

      // Send OTP
      const result = await sendOTP(phone);

      if (result.success) {
        res.json({
          message: result.message,
          // Only include OTP in response for testing/mock mode
          ...(result.otp && { otp: result.otp })
        });
      } else {
        res.status(500).json({
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        message: 'Server error while sending OTP'
      });
    }
  }
);

// @route   POST /api/auth/otp/verify
// @desc    Verify OTP and login/register user
// @access  Public
router.post(
  '/otp/verify',
  [
    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid 10-digit phone number'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { phone, otp, name, role, address } = req.body;

      // Verify OTP using MSG91 Widget
      const verificationResult = await verifyOTPWithWidget(phone, otp);

      if (!verificationResult.success) {
        return res.status(400).json({
          message: verificationResult.message
        });
      }

      // Check if user exists
      let user = await User.findOne({ phone });

      if (user) {
        // Existing user - login
        if (!user.isActive) {
          return res.status(401).json({
            message: 'Account is deactivated'
          });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);

        res.json({
          message: 'Login successful',
          token,
          user: user.getProfile(),
          isNewUser: false
        });
      } else {
        // New user - register with OTP
        if (!name) {
          return res.status(400).json({
            message: 'Name is required for new user registration'
          });
        }

        const newUser = new User({
          name,
          phone,
          role: role || 'customer',
          address,
          authMethod: 'otp',
          isVerified: true // Phone verified via OTP
        });

        await newUser.save();

        // Provider signup bonus
        if (newUser.role === 'provider') {
          try {
            const wallet = await ProviderWallet.getOrCreateWallet(newUser._id);
            await wallet.addBonus(300, 'Signup bonus - Welcome to InstaServe!');
            console.log(`💰 Added 300 Rs signup bonus to provider wallet: ${newUser.phone}`);
          } catch (walletError) {
            console.error('Wallet bonus error:', walletError);
          }
        }

        const token = generateToken(newUser._id);

        res.status(201).json({
          message: 'Registration successful',
          token,
          user: newUser.getProfile(),
          isNewUser: true
        });
      }
    } catch (error) {
      console.error('OTP verify error:', error);
      res.status(500).json({
        message: 'Server error during OTP verification'
      });
    }
  }
);

// @route   POST /api/auth/otp/login
// @desc    Login with OTP (for existing users only)
// @access  Public
router.post(
  '/otp/login',
  [
    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid 10-digit phone number'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { phone, otp } = req.body;

      // Verify OTP using MSG91 Widget
      const verificationResult = await verifyOTPWithWidget(phone, otp);

      if (!verificationResult.success) {
        return res.status(400).json({
          message: verificationResult.message
        });
      }

      // Check if user exists
      const user = await User.findOne({ phone });

      if (!user) {
        return res.status(404).json({
          message: 'No account found with this phone number. Please register first.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          message: 'Account is deactivated'
        });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        message: 'Login successful',
        token,
        user: user.getProfile()
      });
    } catch (error) {
      console.error('OTP login error:', error);
      res.status(500).json({
        message: 'Server error during OTP login'
      });
    }
  }
);

// @route   POST /api/push-token
// @desc    Save push notification token
// @access  Private
router.post('/push-token', protect, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Push token is required'
      });
    }

    // Update user's push token
    await User.findByIdAndUpdate(
      req.user._id,
      { pushToken: token },
      { new: true }
    );

    console.log(`✅ Push token saved for user: ${req.user._id}`);

    res.json({
      message: 'Push token saved successfully'
    });
  } catch (error) {
    console.error('Push token save error:', error);
    res.status(500).json({
      message: 'Server error while saving push token'
    });
  }
});

// @route   DELETE /api/auth/delete-account
// @desc    Delete user account
// @access  Private
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: 'Password is required to delete account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid password'
      });
    }

    // Delete user account (cascade delete will handle related data)
    await User.findByIdAndDelete(req.user._id);

    console.log(`✅ Account deleted for user: ${user.email}`);

    res.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      message: 'Server error while deleting account'
    });
  }
});

module.exports = router;
