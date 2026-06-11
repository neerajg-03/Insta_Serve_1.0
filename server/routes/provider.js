const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @route   PUT /api/provider/availability
// @desc    Toggle provider availability status
// @access  Private (Provider)
router.put('/availability', protect, authorize('provider'), async (req, res) => {
  try {
    const { isAvailable, locationSharingEnabled } = req.body;

    const updateData = {};
    
    if (typeof isAvailable === 'boolean') {
      updateData.isAvailable = isAvailable;
    }
    
    if (typeof locationSharingEnabled === 'boolean') {
      updateData.locationSharingEnabled = locationSharingEnabled;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Availability updated successfully',
      user
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/provider/location
// @desc    Update provider's current location
// @access  Private (Provider)
router.put('/location', protect, authorize('provider'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const timestamp = new Date().toISOString();
    
    console.log('=== REAL-TIME LOCATION UPDATE ===');
    console.log('Provider:', req.user.name, '(', req.user._id, ')');
    console.log('New Coordinates:', { lat, lng });
    console.log('Update Time:', timestamp);
    console.log('Previous Location:', req.user.currentLocation);
    console.log('Is Available:', req.user.isAvailable);
    console.log('Location Sharing Enabled:', req.user.locationSharingEnabled);
    console.log('=== END LOCATION UPDATE ===');

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        currentLocation: {
          lat,
          lng,
          lastUpdated: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    console.log('LOCATION SUCCESSFULLY UPDATED IN DATABASE:', {
      providerId: req.user._id,
      providerName: req.user.name,
      savedCoordinates: user.currentLocation,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Location updated successfully',
      user
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/provider/status
// @desc    Get provider's current availability and location status
// @access  Private (Provider)
router.get('/status', protect, authorize('provider'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .lean();

    res.json({
      isAvailable: user.isAvailable || false,
      locationSharingEnabled: user.locationSharingEnabled || false,
      currentLocation: user.currentLocation || null,
      lastLocationUpdate: user.currentLocation?.lastUpdated || null
    });
  } catch (error) {
    console.error('Get provider status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/provider/nearby
// @desc    Get nearby available providers for a service (internal use)
// @access  Private
router.get('/nearby', protect, async (req, res) => {
  try {
    const { lat, lng, category, radius = 7 } = req.query;

    if (!lat || !lng || !category) {
      return res.status(400).json({ message: 'Latitude, longitude, and category are required' });
    }

    // Find available providers with approved services in this category
    const Service = require('../models/Service');
    const servicesWithProviders = await Service.find({
      category,
      isApproved: true,
      isActive: true,
      provider: { $exists: true, $ne: null }
    }).populate('provider', 'name email isAvailable currentLocation locationSharingEnabled kycVerificationPhoto').lean();

    // Filter by availability and distance
    const EARTH_RADIUS = 6371; // Earth's radius in kilometers
    const nearbyProviders = [];

    servicesWithProviders.forEach(service => {
      if (!service.provider) return;
      
      const provider = service.provider;
      
      // Check if provider is available and has location sharing enabled
      if (!provider.isAvailable || !provider.locationSharingEnabled) {
        return;
      }

      // Check if provider has valid coordinates
      if (!provider.currentLocation || 
          !provider.currentLocation.lat || 
          !provider.currentLocation.lng) {
        return;
      }

      // Calculate distance using Haversine formula
      const lat1 = parseFloat(lat) * Math.PI / 180;
      const lon1 = parseFloat(lng) * Math.PI / 180;
      const lat2 = provider.currentLocation.lat * Math.PI / 180;
      const lon2 = provider.currentLocation.lng * Math.PI / 180;
      
      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;
      
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = EARTH_RADIUS * c;
      
      if (distance <= parseFloat(radius)) {
        nearbyProviders.push({
          providerId: provider._id,
          name: provider.name,
          email: provider.email,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          lastLocationUpdate: provider.currentLocation.lastUpdated
        });
      }
    });

    // Sort by distance
    nearbyProviders.sort((a, b) => a.distance - b.distance);

    res.json({
      nearbyProviders,
      totalFound: nearbyProviders.length,
      searchRadius: parseFloat(radius)
    });
  } catch (error) {
    console.error('Get nearby providers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/provider/change-password
// @desc    Change provider password
// @access  Private (Provider)
router.put(
  '/change-password',
  protect,
  authorize('provider'),
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
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

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id).select('+password');

      if (!user) {
        return res.status(404).json({
          message: 'Provider not found'
        });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      console.log(`✅ Password changed for provider: ${user.email}`);

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        message: 'Server error while changing password'
      });
    }
  }
);

// @route   DELETE /api/provider/delete-account
// @desc    Delete provider account
// @access  Private (Provider)
router.delete(
  '/delete-account',
  protect,
  authorize('provider'),
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required to delete account')
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

      const { password } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id).select('+password');

      if (!user) {
        return res.status(404).json({
          message: 'Provider not found'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Invalid password'
        });
      }

      // Delete provider account (cascade delete will handle related data)
      await User.findByIdAndDelete(req.user._id);

      console.log(`✅ Account deleted for provider: ${user.email}`);

      res.json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        message: 'Server error while deleting account'
      });
    }
  }
);

module.exports = router;
