const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ProviderWallet = require('../models/ProviderWallet');
const { protect } = require('../middleware/auth');
const passport = require('../config/googleAuth');

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
        
        // Add isNewUser flag for new users
        if (user.authMethod === 'google' && (!user.phone || user.phone === '9999999999')) {
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
        // Update existing user with new info
        user.phone = phone;
        user.password = password;
        user.role = role;
        if (address) {
          user.address = address;
        }
        await user.save();
      } else {
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

module.exports = router;
