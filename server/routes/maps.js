const express = require('express');
const router = express.Router();
const axios = require('axios');

// @route   GET /api/maps/distance
// @desc    Calculate distance using Google Maps Distance Matrix API
// @access  Private
router.get('/distance', async (req, res) => {
  try {
    const { origins, destinations } = req.query;
    
    if (!origins || !destinations) {
      return res.status(400).json({ 
        error: 'Missing required parameters: origins and destinations' 
      });
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured on server' 
      });
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${encodeURIComponent(origins)}&` +
      `destinations=${encodeURIComponent(destinations)}&` +
      `key=${GOOGLE_MAPS_API_KEY}&` +
      `units=metric`;

    console.log(`[DEBUG] Making Google Maps API call: ${url.replace(/key=[^&]+/, 'key=***')}`);

    const response = await axios.get(url);
    
    res.json(response.data);
  } catch (error) {
    console.error('Google Maps API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch distance data from Google Maps',
      details: error.response?.data || error.message
    });
  }
});

// @route   GET /api/maps/geocode
// @desc    Geocode address to coordinates
// @access  Private
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ 
        error: 'Missing required parameter: address' 
      });
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured on server' 
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(address)}&` +
      `key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url);
    
    res.json(response.data);
  } catch (error) {
    console.error('Google Maps Geocoding error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to geocode address',
      details: error.response?.data || error.message
    });
  }
});

// @route   GET /api/maps/static
// @desc    Get static map image URL
// @access  Private
router.get('/static', async (req, res) => {
  try {
    const { center, zoom, size, markers } = req.query;
    
    if (!center) {
      return res.status(400).json({ 
        error: 'Missing required parameter: center' 
      });
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured on server' 
      });
    }

    let url = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${encodeURIComponent(center)}&` +
      `zoom=${zoom || 15}&` +
      `size=${size || '600x400'}&` +
      `key=${GOOGLE_MAPS_API_KEY}`;

    if (markers) {
      url += `&markers=${encodeURIComponent(markers)}`;
    }

    // Return the URL (client will fetch the image)
    res.json({ url });
  } catch (error) {
    console.error('Static map error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate static map URL',
      details: error.message
    });
  }
});

module.exports = router;
