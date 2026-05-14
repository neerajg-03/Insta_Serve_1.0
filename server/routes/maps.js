const express = require('express');
const router = express.Router();

// @route   GET /api/maps/distance-matrix
// @desc    Proxy for Google Maps Distance Matrix API to avoid CORS issues
// @access  Public
router.get('/distance-matrix', async (req, res) => {
  try {
    const { origins, destinations, units = 'metric' } = req.query;
    
    if (!origins || !destinations) {
      return res.status(400).json({ 
        error: 'Missing required parameters: origins and destinations' 
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured' 
      });
    }

    // Make request to Google Maps API
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${origins}&` +
      `destinations=${destinations}&` +
      `key=${apiKey}&` +
      `units=${units}`;

    const response = await fetch(googleMapsUrl);
    const data = await response.json();

    // Handle Google Maps API errors
    if (data.status === 'REQUEST_DENIED' && data.error_message) {
      console.error('Google Maps API Error:', data.error_message);
      return res.status(400).json({
        error: 'Google Maps API access denied',
        message: 'Please check your API key configuration',
        details: data.error_message
      });
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      return res.status(429).json({
        error: 'Google Maps API quota exceeded',
        message: 'Please try again later'
      });
    }

    // Return the Google Maps response
    res.json(data);
  } catch (error) {
    console.error('Distance Matrix proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate distance',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/maps/geocode
// @desc    Proxy for Google Maps Geocoding API to avoid CORS issues
// @access  Public
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ 
        error: 'Missing required parameter: address' 
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured' 
      });
    }

    // Make request to Google Maps API
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(address)}&` +
      `key=${apiKey}`;

    const response = await fetch(googleMapsUrl);
    const data = await response.json();

    // Handle Google Maps API errors
    if (data.status === 'REQUEST_DENIED' && data.error_message) {
      console.error('Google Maps API Error:', data.error_message);
      return res.status(400).json({
        error: 'Google Maps API access denied',
        message: 'Please check your API key configuration',
        details: data.error_message
      });
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      return res.status(429).json({
        error: 'Google Maps API quota exceeded',
        message: 'Please try again later'
      });
    }

    // Return the Google Maps response
    res.json(data);
  } catch (error) {
    console.error('Geocoding proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to geocode address',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/maps/reverse-geocode
// @desc    Proxy for Google Maps Reverse Geocoding API to avoid CORS issues
// @access  Public
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { latlng } = req.query;
    
    if (!latlng) {
      return res.status(400).json({ 
        error: 'Missing required parameter: latlng' 
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Google Maps API key not configured' 
      });
    }

    // Make request to Google Maps API
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/geocode/json?` +
      `latlng=${latlng}&` +
      `key=${apiKey}`;

    const response = await fetch(googleMapsUrl);
    const data = await response.json();

    // Handle Google Maps API errors
    if (data.status === 'REQUEST_DENIED' && data.error_message) {
      console.error('Google Maps API Error:', data.error_message);
      return res.status(400).json({
        error: 'Google Maps API access denied',
        message: 'Please check your API key configuration',
        details: data.error_message
      });
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      return res.status(429).json({
        error: 'Google Maps API quota exceeded',
        message: 'Please try again later'
      });
    }

    // Return the Google Maps response
    res.json(data);
  } catch (error) {
    console.error('Reverse geocoding proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to reverse geocode',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
