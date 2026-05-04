const express = require('express');
const router = express.Router();
const axios = require('axios');

// @route   GET /api/maps/distance
// @desc    Calculate distance and ETA using OpenStreetMap (OSRM API)
// @access  Private
router.get('/distance', async (req, res) => {
  try {
    const { origins, destinations } = req.query;
    
    if (!origins || !destinations) {
      return res.status(400).json({ 
        error: 'Missing required parameters: origins and destinations' 
      });
    }

    // Parse coordinates (expecting "lat,lng" format)
    const [originLat, originLng] = origins.split(',').map(coord => parseFloat(coord.trim()));
    const [destLat, destLng] = destinations.split(',').map(coord => parseFloat(coord.trim()));

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      return res.status(400).json({ 
        error: 'Invalid coordinate format. Expected lat,lng format.' 
      });
    }

    console.log(`[DEBUG] Calculating route from (${originLat},${originLng}) to (${destLat},${destLng}) using OSRM`);

    // Use OSRM (Open Source Routing Machine) API for routing
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false&alternatives=false`;

    const response = await axios.get(osrmUrl);
    
    if (response.data.code !== 'Ok' || !response.data.routes || response.data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = response.data.routes[0];
    const distance = route.distance; // in meters
    const duration = route.duration; // in seconds

    // Convert to Google Maps format for compatibility
    const result = {
      status: 'OK',
      rows: [{
        elements: [{
          distance: {
            text: `${(distance / 1000).toFixed(1)} km`,
            value: distance
          },
          duration: {
            text: `${Math.round(duration / 60)} mins`,
            value: duration
          },
          status: 'OK'
        }]
      }],
      source: 'osrm'
    };

    console.log(`[DEBUG] OSRM route calculated: ${(distance / 1000).toFixed(1)}km, ${Math.round(duration / 60)}mins`);
    res.json(result);
  } catch (error) {
    console.error('OSRM API error:', error.response?.data || error.message);
    
    // Fallback to Haversine calculation
    try {
      console.log('[DEBUG] Falling back to Haversine calculation');
      const { origin_lat, origin_lng, dest_lat, dest_lng } = req.query;
      
      const R = 6371; // Earth's radius in kilometers
      const dLat = (parseFloat(dest_lat) - parseFloat(origin_lat)) * Math.PI / 180;
      const dLng = (parseFloat(dest_lng) - parseFloat(origin_lng)) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(parseFloat(origin_lat) * Math.PI / 180) * Math.cos(parseFloat(dest_lat) * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in kilometers
      const duration = distance / 40 * 60; // Assuming 40 km/h average speed

      res.json({
        status: 'OK',
        rows: [{
          elements: [{
            distance: {
              text: `${distance.toFixed(1)} km`,
              value: distance * 1000
            },
            duration: {
              text: `${Math.round(duration)} mins`,
              value: duration * 60
            },
            status: 'OK'
          }]
        }],
        source: 'haversine_fallback'
      });
    } catch (fallbackError) {
      console.error('Fallback calculation also failed:', fallbackError.message);
      res.status(500).json({ 
        error: 'Failed to calculate distance using both OSRM and fallback',
        details: error.message
      });
    }
  }
});

// @route   GET /api/maps/geocode
// @desc    Geocode address to coordinates using OpenStreetMap Nominatim
// @access  Private
router.get('/geocode', async (req, res) => {
  try {
    const { address, latlng } = req.query;
    
    if (!address && !latlng) {
      return res.status(400).json({ 
        error: 'Missing required parameter: address or latlng' 
      });
    }

    // Use OpenStreetMap Nominatim API
    if (address) {
      // Forward geocoding (address to coordinates)
      try {
        console.log(`[DEBUG] Geocoding address with Nominatim: ${address}`);
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(address)}&` +
          `format=json&` +
          `limit=1&` +
          `countrycodes=in&` +
          `addressdetails=1`;

        const nominatimResponse = await axios.get(nominatimUrl, {
          headers: {
            'User-Agent': 'InstaServe/1.0 (location service)'
          }
        });

        if (nominatimResponse.data && nominatimResponse.data.length > 0) {
          const result = nominatimResponse.data[0];
          return res.json({
            status: 'OK',
            results: [{
              geometry: {
                location: {
                  lat: parseFloat(result.lat),
                  lng: parseFloat(result.lon)
                }
              },
              formatted_address: result.display_name,
              address_components: result.address,
              source: 'nominatim'
            }]
          });
        }
      } catch (nominatimError) {
        console.error('Nominatim geocoding failed:', nominatimError.message);
      }
    } else if (latlng) {
      // Reverse geocoding (coordinates to address)
      try {
        console.log(`[DEBUG] Reverse geocoding coordinates with Nominatim: ${latlng}`);
        const [lat, lng] = latlng.split(',').map(coord => parseFloat(coord.trim()));
        
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?` +
          `lat=${lat}&` +
          `lon=${lng}&` +
          `format=json&` +
          `addressdetails=1`;

        const nominatimResponse = await axios.get(nominatimUrl, {
          headers: {
            'User-Agent': 'InstaServe/1.0 (location service)'
          }
        });

        if (nominatimResponse.data) {
          return res.json({
            status: 'OK',
            results: [{
              geometry: {
                location: {
                  lat: parseFloat(nominatimResponse.data.lat),
                  lng: parseFloat(nominatimResponse.data.lon)
                }
              },
              formatted_address: nominatimResponse.data.display_name,
              address_components: nominatimResponse.data.address,
              source: 'nominatim'
            }]
          });
        }
      } catch (nominatimError) {
        console.error('Nominatim reverse geocoding failed:', nominatimError.message);
      }
    }

    return res.status(404).json({ 
      error: 'Location not found',
      status: 'ZERO_RESULTS'
    });
  } catch (error) {
    console.error('Geocoding error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to geocode address',
      details: error.response?.data || error.message
    });
  }
});

// @route   GET /api/maps/distance-haversine
// @desc    Calculate distance using Haversine formula (fallback)
// @access  Private
router.get('/distance-haversine', async (req, res) => {
  try {
    const { origin_lat, origin_lng, dest_lat, dest_lng } = req.query;
    
    if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
      return res.status(400).json({ 
        error: 'Missing required parameters: origin_lat, origin_lng, dest_lat, dest_lng' 
      });
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = (parseFloat(dest_lat) - parseFloat(origin_lat)) * Math.PI / 180;
    const dLng = (parseFloat(dest_lng) - parseFloat(origin_lng)) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(parseFloat(origin_lat) * Math.PI / 180) * Math.cos(parseFloat(dest_lat) * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    const duration = distance / 40 * 60; // Assuming 40 km/h average speed

    res.json({
      status: 'OK',
      rows: [{
        elements: [{
          distance: {
            text: `${distance.toFixed(1)} km`,
            value: distance * 1000 // convert to meters
          },
          duration: {
            text: `${Math.round(duration)} mins`,
            value: duration * 60 // convert to seconds
          },
          status: 'OK'
        }]
      }],
      source: 'haversine'
    });
  } catch (error) {
    console.error('Haversine distance error:', error.message);
    res.status(500).json({ 
      error: 'Failed to calculate distance',
      details: error.message
    });
  }
});

// @route   GET /api/maps/static
// @desc    Get static map URL using OpenStreetMap (via staticmap provider)
// @access  Private
router.get('/static', async (req, res) => {
  try {
    const { center, zoom, size, markers } = req.query;
    
    if (!center) {
      return res.status(400).json({ 
        error: 'Missing required parameter: center' 
      });
    }

    // Use OpenStreetMap static map provider (free alternative to Google Maps)
    let baseUrl = 'https://staticmap.openstreetmap.de/staticmap.php';
    
    let params = new URLSearchParams();
    params.append('center', center);
    params.append('zoom', zoom || '15');
    params.append('size', size || '600x400');
    params.append('maptype', 'mapnik');
    
    // Add markers if provided
    if (markers) {
      // Parse markers and convert to OSM format
      // Expected format: "color:label|lat,lng|color:label|lat,lng..."
      const markerList = markers.split('|');
      markerList.forEach((marker, index) => {
        if (marker.includes(',')) {
          const [lat, lng] = marker.split(',').map(coord => coord.trim());
          params.append(`markers[${index}]`, `${lat},${lng},red`);
        }
      });
    }
    
    const staticMapUrl = `${baseUrl}?${params.toString()}`;
    console.log(`[DEBUG] Generated OSM static map URL: ${staticMapUrl}`);

    res.json({ url: staticMapUrl });
  } catch (error) {
    console.error('Static map error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate static map URL',
      details: error.message
    });
  }
});

// @route   GET /api/maps/navigation
// @desc    Get navigation URL for provider using OpenStreetMap
// @access  Private
router.get('/navigation', async (req, res) => {
  try {
    const { origin_lat, origin_lng, dest_lat, dest_lng } = req.query;
    
    if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
      return res.status(400).json({ 
        error: 'Missing required parameters: origin_lat, origin_lng, dest_lat, dest_lng' 
      });
    }

    // Generate OSM navigation URL (using BRouter web interface)
    const navigationUrl = `https://brouter.de/brouter?` +
      `lonlats=${origin_lng},${origin_lat}|${dest_lng},${dest_lat}&` +
      `profile=fastbike&` +
      `format=gpx&` +
      `alternativeidx=0`;

    // Also provide a simpler web navigation URL
    const webNavigationUrl = `https://www.openstreetmap.org/directions?` +
      `engine=osrm_car&` +
      `route=${origin_lat},${origin_lng};${dest_lat},${dest_lng}`;

    res.json({
      navigationUrl,
      webNavigationUrl,
      source: 'openstreetmap'
    });
  } catch (error) {
    console.error('Navigation URL error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate navigation URL',
      details: error.message
    });
  }
});

module.exports = router;
