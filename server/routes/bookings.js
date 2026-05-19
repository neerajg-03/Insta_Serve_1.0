const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const ProviderWallet = require('../models/ProviderWallet');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image and audio uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;
    if (file.mimetype.startsWith('audio/')) {
      uploadDir = path.join(__dirname, '../uploads/voice-notes');
    } else {
      uploadDir = path.join(__dirname, '../uploads/service-images');
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images and audio files
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'), false);
    }
  }
});

// @route   GET /api/bookings
// @desc    Get user bookings (customer or provider)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      dateFrom, 
      dateTo,
      sortBy = 'scheduledDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
      // Add status filter for customers
      if (status) query.status = status;
    } else if (req.user.role === 'provider') {
      // For providers, get both assigned bookings AND broadcast bookings sent to them
      query.$or = [
        { provider: req.user._id }, // Their assigned bookings
        { 
          status: 'broadcast',
          'broadcastTo': req.user._id // Broadcast bookings sent to them
        }
      ];
      
      // Apply status filter within the $or conditions for providers
      if (status) {
        query.$or = [
          { 
            provider: req.user._id,
            status: status 
          },
          { 
            status: status,
            'broadcastTo': req.user._id 
          }
        ];
      }
    }
    if (dateFrom || dateTo) {
      query.scheduledDate = {};
      if (dateFrom) query.scheduledDate.$gte = new Date(dateFrom);
      if (dateTo) query.scheduledDate.$lte = new Date(dateTo);
    }

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const bookings = await Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'title category price images')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/reviews
// @desc    Get reviews from completed bookings for home page
// @access  Public
router.get('/reviews', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    // Find completed bookings with reviews
    const bookingsWithReviews = await Booking.find({
      status: 'completed',
      'review.rating': { $exists: true, $ne: null }
    })
    .populate('customer', 'name')
    .populate('service', 'title')
    .populate('provider', 'name')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    // Transform bookings into testimonial format
    const testimonials = bookingsWithReviews.map(booking => ({
      _id: booking._id,
      name: booking.customer?.name || 'Anonymous Customer',
      service: booking.service?.title || 'Service',
      provider: booking.provider?.name || 'Service Provider',
      rating: booking.review?.rating || 5,
      content: booking.review?.comment || 'Excellent service!',
      date: booking.createdAt,
      verified: true
    }));

    res.json({
      success: true,
      testimonials,
      count: testimonials.length
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('provider', 'name email phone address ratings')
      .populate('service', 'title category description price images provider');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    if (
      booking.customer._id.toString() !== req.user._id.toString() &&
      (!booking.provider || booking.provider._id.toString() !== req.user._id.toString()) &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    // Get Socket.IO instance and add user to booking room for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Find all connected sockets for this user and add them to booking room
      const sockets = await io.in(`user_${req.user._id}`).allSockets();
      sockets.forEach(socketId => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.join(`booking_${req.params.id}`);
          console.log(`📋 User ${req.user.name} (${req.user.role}) auto-joined booking room: ${req.params.id}`);
        }
      });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/upload-voice
// @desc    Upload voice note for booking
// @access  Private (Customer)
router.post('/upload-voice', protect, authorize('customer'), upload.single('voiceNote'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No voice note file uploaded' });
    }

    // Return the full URL path for accessing the voice note
    const voiceNotePath = `/uploads/voice-notes/${req.file.filename}`;
    
    console.log('Voice note uploaded:', voiceNotePath);
    
    res.status(200).json({
      success: true,
      voiceNotePath: voiceNotePath
    });
  } catch (error) {
    console.error('Voice note upload error:', error);
    res.status(500).json({ message: 'Server error during voice note upload' });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking (customer only)
// @access  Private (Customer)
router.post('/', protect, authorize('customer'), async (req, res) => {
  try {
    const {
      service, // Changed from serviceId to service
      scheduledDate,
      duration,
      address,
      notes,
      voiceNote
    } = req.body;

    // Validate service
    const serviceData = await Service.findById(service);
    if (!serviceData) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (!serviceData.isActive || !serviceData.isApproved) {
      return res.status(400).json({ message: 'Service is not available' });
    }

    // For broadcast booking, find AVAILABLE providers within 7km range
    const bookingCoordinates = address.coordinates;
    let nearbyProviders = [];

    if (bookingCoordinates && bookingCoordinates.lat && bookingCoordinates.lng) {
      // Find all AVAILABLE providers with the SPECIFIC service title being booked
      // and ensure they have location sharing enabled
      const providersWithServices = await Service.find({
        title: serviceData.title,  // Match the exact service title
        isApproved: true,
        isActive: true,
        provider: { $exists: true, $ne: null }
      }).populate('provider', 'name email isActive kycStatus address isAvailable locationSharingEnabled currentLocation').lean();

      // Group providers by ID for distance filtering first (wallet check comes later)
      const providerMap = new Map();

      console.log(`\n=== SERVICE TITLE MATCHING ===`);
      console.log(`Requested service title: ${serviceData.title}`);
      console.log(`Found ${providersWithServices.length} services with this title`);

      providersWithServices.forEach(service => {
        if (!service.provider) {
          return;
        }

        const providerId = service.provider._id.toString();

        console.log(`\nChecking service: ${service.title} (provider: ${service.provider?.name})`);
        console.log(`  - Service title: ${service.title}`);
        console.log(`  - isApproved: ${service.isApproved}`);
        console.log(`  - isActive: ${service.isActive}`);
        console.log(`  - Provider isActive: ${service.provider?.isActive}`);
        console.log(`  - Provider kycStatus: ${service.provider?.kycStatus}`);

        // Only include active providers with approved KYC
        if (!service.provider.isActive) {
          console.log(`  ❌ Provider not active, skipping`);
          return;
        }

        if (service.provider.kycStatus !== 'approved') {
          console.log(`  ❌ Provider KYC not approved (status: ${service.provider.kycStatus}), skipping`);
          return;
        }

        // Only add provider if they have an approved and active service with this exact title
        if (service.title === serviceData.title && service.isApproved && service.isActive) {
          if (!providerMap.has(providerId)) {
            providerMap.set(providerId, service.provider);
            console.log(`  ✅ Added provider ${service.provider.name} to map`);
          } else {
            console.log(`  ℹ️ Provider ${service.provider.name} already in map`);
          }
        } else {
          console.log(`  ❌ Service doesn't match criteria`);
        }
      });
      
      console.log(`\n=== PROVIDER MAP AFTER FILTERING ===`);
      console.log(`Total providers in map: ${providerMap.size}`);
      providerMap.forEach((provider, id) => {
        console.log(`  - ${provider.name} (${id})`);
      });
      
      // Get Socket.IO instance to access live provider locations from booking room
      const io = req.app.get('io');
      const liveProviderLocations = new Map();
      
      // Extract live provider locations from connected users in booking room
      if (io) {
        // Get all connected users and their locations from the server's userLocations map
        const connectedUsers = Array.from(io.sockets.sockets.values())
          .map(socket => {
            const userData = socket.handshake.auth || socket.userData;
            return {
              socketId: socket.id,
              userId: userData?.userId,
              name: userData?.name,
              role: userData?.role
            };
          })
          .filter(user => user.role === 'provider' && user.userId);
        
        console.log(`Found ${connectedUsers.length} connected providers`);
        
        // Get live locations from the server's userLocations map
        const serverUserLocations = req.app.get('userLocations') || new Map();
        serverUserLocations.forEach((locationData, userId) => {
          if (locationData.userRole === 'provider' && locationData.location) {
            liveProviderLocations.set(userId.toString(), {
              lat: locationData.location.lat,
              lng: locationData.location.lng,
              timestamp: locationData.timestamp,
              source: 'LIVE (booking room)',
              isRealTime: true
            });
          }
        });
        
        console.log(`Found ${liveProviderLocations.size} providers with live locations`);
      }
      
      // First filter providers by distance (within 7km), then apply wallet balance filtering
      const EARTH_RADIUS = 6371; // Earth's radius in kilometers
      
      // Step 1: Find all providers within 7km range
      console.log(`\n=== DISTANCE FILTERING ===`);
      console.log(`Booking coordinates: ${bookingCoordinates.lat}, ${bookingCoordinates.lng}`);
      
      const providersWithin7km = Array.from(providerMap.values())
        .filter(provider => {
          let providerLocation = null;
          let locationSource = '';
          
          // PRIORITY 1: Use LIVE location from booking room if available
          const liveLocation = liveProviderLocations.get(provider._id.toString());
          if (liveLocation) {
            providerLocation = {
              lat: liveLocation.lat,
              lng: liveLocation.lng
            };
            locationSource = 'LIVE (Socket.IO)';
          }
          // PRIORITY 2: Use database currentLocation if live location not available
          else if (provider.currentLocation && 
                   provider.currentLocation.lat && 
                   provider.currentLocation.lng) {
            // Check if location data is fresh enough for 7km filter
            const locationAge = Date.now() - new Date(provider.currentLocation.lastUpdated).getTime();
            const ageInMinutes = Math.floor(locationAge / (1000 * 60));
            
            console.log(`  Provider ${provider.name} currentLocation age: ${ageInMinutes} minutes`);
            
            // Skip stale locations for 7km filter (older than 30 minutes)
            if (ageInMinutes > 30) {
              console.log(`  ❌ ${provider.name}: location too old (${ageInMinutes}min > 30min), checking address fallback`);
              // Don't return false here, let it fall through to address check
            } else {
              providerLocation = provider.currentLocation;
              locationSource = 'DATABASE currentLocation';
            }
          }
          
          // PRIORITY 3: Use address coordinates as final fallback
          if (!providerLocation && provider.address && 
                     provider.address.coordinates && 
                     provider.address.coordinates.lat && 
                     provider.address.coordinates.lng) {
            providerLocation = provider.address.coordinates;
            locationSource = 'ADDRESS coordinates';
          }
          
          if (!providerLocation) {
            console.log(`  ❌ ${provider.name}: no valid location found`);
            return false;
          }
          
          // Calculate distance using Haversine formula
          const lat1 = bookingCoordinates.lat * Math.PI / 180;
          const lon1 = bookingCoordinates.lng * Math.PI / 180;
          const lat2 = providerLocation.lat * Math.PI / 180;
          const lon2 = providerLocation.lng * Math.PI / 180;
          
          const dLat = lat2 - lat1;
          const dLon = lon2 - lon1;
          
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1) * Math.cos(lat2) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = EARTH_RADIUS * c;
          
          console.log(`  ${provider.name}: ${distance.toFixed(2)}km away (source: ${locationSource})`);
          console.log(`    Provider location: ${providerLocation.lat}, ${providerLocation.lng}`);
          
          const isWithinRange = distance <= 7;
          console.log(`    Within 7km: ${isWithinRange ? 'YES ✅' : 'NO ❌'}`);
          
          return isWithinRange;
        });

      console.log(`Found ${providersWithin7km.length} providers within 7km range before wallet filtering`);

      // Step 2: Apply wallet balance filtering to providers within 7km
      if (providersWithin7km.length > 0) {
        // Get wallet information for providers within 7km
        const providerIds = providersWithin7km.map(p => p._id);
        
        const providerWallets = await ProviderWallet.find({ 
          provider: { $in: providerIds } 
        }).lean();
        
        const walletMap = new Map();
        providerWallets.forEach(wallet => {
          walletMap.set(wallet.provider.toString(), wallet);
        });
        
        // Filter by wallet balance
        nearbyProviders = providersWithin7km.filter(provider => {
          const providerId = provider._id.toString();
          const wallet = walletMap.get(providerId);
          
          // Check wallet balance
          const currentBalance = wallet?.balance ?? 0;
          const minimumBalance = wallet?.minimumBalance ?? 200;
          
          if (currentBalance < minimumBalance) {
            console.log(`Provider ${provider.name}: insufficient balance (current: ${currentBalance}, required: ${minimumBalance})`);
            return false;
          }
          
          console.log(`Provider ${provider.name}: passed wallet check (${currentBalance} >= ${minimumBalance})`);
          return true;
        }).map(provider => provider._id);
      } else {
        nearbyProviders = [];
      }

      console.log('7km Range Filter Results:');
      console.log('  - Available Providers within 7km:', nearbyProviders.length);
      console.log('  - Nearby Provider IDs:', nearbyProviders);

      // Step 3: Filter providers by service approval (must have approved service with requested title)
      if (nearbyProviders.length > 0) {
        console.log('\n=== SERVICE APPROVAL FILTERING ===');
        console.log(`Requested service title: ${serviceData.title}`);

        // Get all providers with their services
        const providersWithServices = await User.find({
          _id: { $in: nearbyProviders },
          role: 'provider'
        }).populate('services').lean();

        const approvedProviders = providersWithServices.filter(provider => {
          // Check if provider has the specific approved service with the requested title
          const hasApprovedService = provider.services && provider.services.some((service) => {
            return service.title === serviceData.title &&
                   service.isActive === true &&
                   service.isApproved === true;
          });

          if (!hasApprovedService) {
            console.log(`  ❌ ${provider.name}: no approved service with title ${serviceData.title}`);
            return false;
          }

          console.log(`  ✅ ${provider.name}: has approved service with title ${serviceData.title}`);
          return true;
        });

        nearbyProviders = approvedProviders.map(p => p._id);
        
        console.log('Service Approval Filter Results:');
        console.log('  - Providers with approved services:', nearbyProviders.length);
        console.log('  - Approved Provider IDs:', nearbyProviders);
      }
      
      // If no providers found within 7km, return error (no expanded search)
      if (nearbyProviders.length === 0) {
        return res.status(404).json({ 
          message: 'No available providers found within 7km radius. All nearby providers either have insufficient wallet balance or are not online.' 
        });
      }
      
    } else {
      // Fallback: If no coordinates provided, return error
      return res.status(400).json({ 
        message: 'Booking coordinates are required. Please enable location services and try again.' 
      });
    }

    // Calculate price
    let totalPrice = serviceData.price;
    if (serviceData.priceType === 'hourly') {
      totalPrice = serviceData.price * duration.value;
    }

    // Create broadcast booking (no provider assigned initially)
    const booking = new Booking({
      customer: req.user._id,
      provider: null, // No provider assigned for broadcast
      service: service,
      scheduledDate: new Date(scheduledDate),
      duration,
      address,
      notes,
      voiceNote: voiceNote || null, // Store voice note file path if provided
      status: 'broadcast', // Broadcast status
      price: {
        basePrice: totalPrice,
        additionalCharges: 0,
        totalPrice: totalPrice,
        currency: 'INR'
      },
      serviceArea: serviceData.serviceArea,
      paymentMethod: req.body.paymentMethod || 'cash', // Store payment method
      broadcastTo: nearbyProviders, // Only providers within 7km range
      broadcastSentAt: new Date()
    });

    await booking.save();

    // Populate and return
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'title category price images');

    // Emit Socket.IO broadcast to approved providers only
    const io = req.app.get('io');
    if (io) {
      const broadcastData = {
        bookingId: booking._id,
        customerId: req.user._id,
        customerName: req.user.name,
        serviceTitle: serviceData.title,
        serviceCategory: serviceData.category,
        scheduledDate: booking.scheduledDate,
        address: booking.address,
        price: totalPrice,
        voiceNote: booking.voiceNote, // Include voice note in broadcast
        notes: booking.notes, // Include notes in broadcast
        broadcastTo: nearbyProviders,
        timestamp: new Date()
      };
      
      // Send only to specific providers in broadcastTo array
      nearbyProviders.forEach(providerId => {
        io.to(`user_${providerId}`).emit('new_service_request', broadcastData);
      });
      
      console.log(`Broadcast sent to ${nearbyProviders.length} providers:`, nearbyProviders);
      console.log(`Voice note included: ${booking.voiceNote ? 'YES' : 'NO'}`);
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking status (provider/customer)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isProvider = booking.provider && booking.provider.toString() === req.user._id.toString();
    const isBroadcastProvider = booking.status === 'broadcast' && booking.broadcastTo && booking.broadcastTo.includes(req.user._id.toString());

    if (!isCustomer && !isProvider && !isBroadcastProvider && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Validate status transitions
    const validTransitions = {
      broadcast: ['confirmed', 'cancelled'],  // Broadcast can be confirmed or cancelled
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['completed'],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${booking.status} to ${status}` 
      });
    }

    // Update booking
    booking.status = status;
    
    // If provider is accepting a broadcast booking, assign them and notify others
    if (isBroadcastProvider && status === 'confirmed') {
      // Store original broadcastTo before clearing it
      const originalBroadcastTo = booking.broadcastTo || [];
      
      booking.provider = req.user._id;
      booking.broadcastAcceptedAt = new Date();
      booking.broadcastAcceptedBy = req.user._id;
      booking.acceptedAt = new Date();
      
      // Remove from broadcastTo array so other providers can't see it
      booking.broadcastTo = [];
      
      // Emit Socket.IO notification to all providers that this booking is no longer available
      const io = req.app.get('io');
      if (io) {
        const bookingClosedData = {
          bookingId: booking._id,
          message: 'This booking has been accepted by another provider',
          status: 'accepted_by_other',
          timestamp: new Date()
        };
        
        // Send to all providers who were originally broadcasted to
        // except the one who accepted it
        originalBroadcastTo.forEach(providerId => {
          if (providerId.toString() !== req.user._id.toString()) {
            io.to(`user_${providerId}`).emit('booking_no_longer_available', bookingClosedData);
          }
        });
        
        console.log(`Notified ${originalBroadcastTo.length - 1} other providers that booking ${booking._id} is no longer available`);
      }
    }
    
    if (notes) {
      if (isCustomer) {
        booking.customerNotes = notes;
      } else if (isProvider || isBroadcastProvider) {
        booking.providerNotes = notes;
      }
    }

    // Add timeline entry
    booking.timeline.push({
      status,
      timestamp: new Date(),
      note: notes,
      updatedBy: req.user._id
    });

    // Handle specific status changes
    if (status === 'in_progress') {
      booking.actualStartTime = new Date();
    } else if (status === 'completed') {
      booking.actualEndTime = new Date();
    } else if (status === 'cancelled') {
      booking.cancelledBy = req.user._id;
      booking.cancelledAt = new Date();
      if (notes) {
        booking.cancellationReason = notes;
      }
    }

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'title category price images');

    res.json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isProvider = booking.provider.toString() === req.user._id.toString();

    if (!isCustomer && !isProvider && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if booking can be cancelled
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    if (reason) {
      booking.cancellationReason = reason;
    }

    // Add timeline entry
    booking.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || 'Booking cancelled',
      updatedBy: req.user._id
    });

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'title category price images');

    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/:id/complete-customer
// @desc    Complete a booking and add review (customer only)
// @access  Private (Customer)
router.post('/:id/complete-customer', protect, authorize('customer'), async (req, res) => {
  try {
    const { rating, comment, completionPhotos } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to customer
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this booking' });
    }

    // Check if booking can be completed (allow both in_progress and completed for reviews)
    if (booking.status !== 'in_progress' && booking.status !== 'completed') {
      return res.status(400).json({ message: 'Booking must be in progress or completed to add a review' });
    }
    
    // If booking is already completed, just add the review
    if (booking.status === 'completed') {
      // Add review if provided
      if (rating) {
        booking.review = {
          rating,
          comment: comment || '',
          reviewedAt: new Date()
        };

        // Update service rating
        const Service = require('../models/Service');
        const service = await Service.findById(booking.service);
        if (service) {
          service.reviews.push({
            customer: req.user._id,
            booking: booking._id,
            rating,
            comment: comment || '',
            createdAt: new Date()
          });

          // Calculate new average rating
          const totalRating = service.reviews.reduce((sum, review) => sum + review.rating, 0);
          service.ratings.average = totalRating / service.reviews.length;
          service.ratings.count = service.reviews.length;
          service.bookingCount += 1;

          await service.save();
        }
      }

      // Add timeline entry for review
      booking.timeline.push({
        status: 'completed',
        timestamp: new Date(),
        note: 'Customer added review',
        updatedBy: req.user._id
      });

      await booking.save();

      const updatedBooking = await Booking.findById(booking._id)
        .populate('customer', 'name email phone')
        .populate('provider', 'name email phone')
        .populate('service', 'title category price images');

      res.json({
        message: 'Review added successfully',
        booking: updatedBooking
      });
      return;
    }

    // Update booking
    booking.status = 'completed';
    booking.actualEndTime = new Date();
    if (completionPhotos && completionPhotos.length > 0) {
      booking.completionPhotos = completionPhotos;
    }

    // Add review if provided
    if (rating) {
      booking.review = {
        rating,
        comment: comment || '',
        reviewedAt: new Date()
      };

      // Update service rating
      const Service = require('../models/Service');
      const service = await Service.findById(booking.service);
      if (service) {
        service.reviews.push({
          customer: req.user._id,
          booking: booking._id,
          rating,
          comment: comment || '',
          createdAt: new Date()
        });

        // Calculate new average rating
        const totalRating = service.reviews.reduce((sum, review) => sum + review.rating, 0);
        service.ratings.average = totalRating / service.reviews.length;
        service.ratings.count = service.reviews.length;
        service.bookingCount += 1;

        await service.save();
      }

      // Update provider ratings
      const User = require('../models/User');
      const provider = await User.findById(booking.provider);
      if (provider) {
        const currentTotal = provider.ratings.average * provider.ratings.count;
        const newCount = provider.ratings.count + 1;
        const newAverage = (currentTotal + rating) / newCount;
        
        provider.ratings.average = Math.round(newAverage * 10) / 10; // Round to 1 decimal
        provider.ratings.count = newCount;
        await provider.save();
        
        console.log(`Updated provider ${booking.provider} rating: ${newAverage.toFixed(1)} (${newCount} reviews)`);
      }
    }

    // Add timeline entry
    booking.timeline.push({
      status: 'completed',
      timestamp: new Date(),
      note: 'Booking completed',
      updatedBy: req.user._id
    });

    await booking.save();

    // Deduct commission from provider wallet (20% of total price)
    try {
      const commissionAmount = booking.price.totalPrice * 0.2; // 20% commission
      const wallet = await ProviderWallet.getOrCreateWallet(booking.provider);
      await wallet.deductCommission(
        booking._id,
        commissionAmount,
        `Commission for completed booking: ${booking.service?.title || 'Service'}`
      );
      console.log(`Commission of ₹${commissionAmount} deducted from provider ${booking.provider} wallet`);
    } catch (walletError) {
      console.error('Failed to deduct commission from provider wallet:', walletError);
      // Don't fail booking completion if wallet deduction fails
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'title category price images');

    res.json({
      message: 'Booking completed successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/upload-service-images
// @desc    Upload service completion images
// @access  Private (Provider)
router.post('/upload-service-images', protect, authorize('provider'), upload.array('images', 5), async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to provider
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload images for this booking' });
    }

    // Process uploaded images
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imageUrls.push(`/uploads/service-images/${file.filename}`);
      });
    }

    res.json({
      message: 'Images uploaded successfully',
      imageUrls: imageUrls
    });
  } catch (error) {
    console.error('Upload service images error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate random completion code
const generateCompletionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    if (i === 3) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper function to generate random start code
const generateStartCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    if (i === 3) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// @route   POST /api/bookings/:id/complete
// @desc    Generate completion code for booking (Provider only)
// @access  Private (Provider)
router.post('/:id/complete', protect, authorize('provider'), async (req, res) => {
  try {
    const { images } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to provider
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this booking' });
    }

    // Check if booking can be completed
    if (booking.status !== 'in_progress') {
      return res.status(400).json({ message: 'Booking must be in progress to be completed' });
    }

    // Generate completion code
    const completionCode = generateCompletionCode();
    
    // Update booking with completion code (don't mark as completed yet)
    booking.completionCode = completionCode;
    booking.completionCodeGeneratedAt = new Date();
    
    // Add service completion images if provided
    if (images && images.length > 0) {
      booking.completionPhotos = images;
    }

    // Add timeline entry
    booking.timeline.push({
      status: 'in_progress',
      timestamp: new Date(),
      note: `Completion code generated: ${completionCode}`,
      updatedBy: req.user._id
    });

    await booking.save();

    // Emit Socket.IO notification to customer about completion code
    const io = req.app.get('io');
    if (io) {
      const completionCodeData = {
        bookingId: booking._id,
        customerId: booking.customer,
        providerName: req.user.name || 'Service Provider',
        serviceTitle: booking.service?.title || 'Service',
        completionCode: completionCode,
        timestamp: new Date()
      };
      
      io.to(`user_${booking.customer}`).emit('completion_code_generated', completionCodeData);
      console.log(`Completion code ${completionCode} sent to customer ${booking.customer} for booking ${booking._id}`);
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'title category price images');

    res.json({
      message: 'Completion code generated successfully',
      completionCode: completionCode,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Provider complete booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/:id/verify-completion-code
// @desc    Verify completion code and complete booking (Provider only)
// @access  Private (Provider)
router.post('/:id/verify-completion-code', protect, authorize('provider'), async (req, res) => {
  try {
    const { completionCode } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to provider
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to verify this booking' });
    }

    // Check if completion code exists
    if (!booking.completionCode) {
      return res.status(400).json({ message: 'No completion code generated for this booking' });
    }

    // Verify completion code
    if (booking.completionCode !== completionCode) {
      return res.status(400).json({ message: 'Invalid completion code' });
    }

    // Mark booking as completed
    booking.status = 'completed';
    booking.actualEndTime = new Date();
    booking.completedAt = new Date();

    // Add timeline entry
    booking.timeline.push({
      status: 'completed',
      timestamp: new Date(),
      note: 'Booking completed with completion code verification',
      updatedBy: req.user._id
    });

    await booking.save();

    // Update ratings if review exists
    if (booking.review && booking.review.rating) {
      try {
        // Update provider ratings
        const User = mongoose.model('User');
        const provider = await User.findById(booking.provider);
        if (provider) {
          const currentTotal = provider.ratings.average * provider.ratings.count;
          const newCount = provider.ratings.count + 1;
          const newAverage = (currentTotal + booking.review.rating) / newCount;
          
          provider.ratings.average = Math.round(newAverage * 10) / 10; // Round to 1 decimal
          provider.ratings.count = newCount;
          await provider.save();
          
          console.log(`Updated provider ${booking.provider} rating: ${newAverage.toFixed(1)} (${newCount} reviews)`);
        }

        // Update service ratings
        const Service = mongoose.model('Service');
        const service = await Service.findById(booking.service);
        if (service) {
          const currentTotal = service.ratings.average * service.ratings.count;
          const newCount = service.ratings.count + 1;
          const newAverage = (currentTotal + booking.review.rating) / newCount;
          
          service.ratings.average = Math.round(newAverage * 10) / 10; // Round to 1 decimal
          service.ratings.count = newCount;
          
          // Add review to service reviews
          service.reviews.push({
            customer: booking.customer,
            booking: booking._id,
            rating: booking.review.rating,
            comment: booking.review.comment || '',
            createdAt: new Date()
          });
          
          await service.save();
          
          console.log(`Updated service ${booking.service} rating: ${newAverage.toFixed(1)} (${newCount} reviews)`);
        }
      } catch (ratingError) {
        console.error('Failed to update ratings:', ratingError);
        // Don't fail the booking completion if rating update fails
      }
    }

    // Deduct commission from provider wallet (20% of total price)
    try {
      const commissionAmount = booking.price.totalPrice * 0.2; // 20% commission
      const wallet = await ProviderWallet.getOrCreateWallet(booking.provider);
      await wallet.deductCommission(
        booking._id,
        commissionAmount,
        `Commission for completed booking: ${booking.service?.title || 'Service'}`
      );
      console.log(`Commission of ₹${commissionAmount} deducted from provider ${booking.provider} wallet`);
    } catch (walletError) {
      console.error('Failed to deduct commission from provider wallet:', walletError);
      // Don't fail booking completion if wallet deduction fails
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`booking_${booking._id}`).emit('booking_update', {
        bookingId: booking._id,
        status: 'completed',
        customerId: booking.customer,
        providerId: booking.provider,
        message: 'Service has been completed',
        timestamp: new Date()
      });
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'title category price images');

    res.json({
      message: 'Booking completed successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Verify completion code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/:id/reject-broadcast
// @desc    Remove provider from broadcast list (provider rejects broadcast request)
// @access  Private (Provider)
router.post('/:id/reject-broadcast', protect, authorize('provider'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is in broadcast status and provider is in broadcastTo list
    if (booking.status !== 'broadcast') {
      return res.status(400).json({ message: 'Booking is not in broadcast status' });
    }

    if (!booking.broadcastTo || !booking.broadcastTo.includes(req.user._id)) {
      return res.status(403).json({ message: 'You are not authorized to reject this broadcast request' });
    }

    // Remove provider from broadcastTo array
    booking.broadcastTo = booking.broadcastTo.filter(providerId => 
      providerId.toString() !== req.user._id.toString()
    );

    // Add timeline entry
    booking.timeline.push({
      status: 'broadcast_rejected',
      timestamp: new Date(),
      note: `Provider ${req.user.name} rejected this broadcast request`,
      updatedBy: req.user._id
    });

    await booking.save();

    res.json({
      message: 'Broadcast request rejected successfully',
      booking
    });
  } catch (error) {
    console.error('Reject broadcast request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/:id/generate-start-code
// @desc    Generate start code for booking (Provider only)
// @access  Private (Provider)
router.post('/:id/generate-start-code', protect, authorize('provider'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to provider
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to generate start code for this booking' });
    }

    // Check if booking can be started
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking must be confirmed to generate start code' });
    }

    // Generate start code
    const startCode = generateStartCode();
    
    // Update booking with start code
    booking.startCode = startCode;
    booking.startCodeGeneratedAt = new Date();
    
    // Add timeline entry
    booking.timeline.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: `Start code generated: ${startCode}`,
      updatedBy: req.user._id
    });

    await booking.save();

    // Emit Socket.IO notification to customer about start code
    const io = req.app.get('io');
    if (io) {
      const startCodeData = {
        bookingId: booking._id,
        customerId: booking.customer,
        providerName: req.user.name || 'Service Provider',
        serviceTitle: booking.service?.title || 'Service',
        startCode: startCode,
        timestamp: new Date()
      };
      
      io.to(`user_${booking.customer}`).emit('start_code_generated', startCodeData);
      console.log(`Start code ${startCode} sent to customer ${booking.customer} for booking ${booking._id}`);
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'title category price images');

    res.json({
      message: 'Start code generated successfully',
      startCode: startCode,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Generate start code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/:id/verify-start-code
// @desc    Verify start code and start service (Provider only)
// @access  Private (Provider)
router.post('/:id/verify-start-code', protect, authorize('provider'), async (req, res) => {
  try {
    const { startCode } = req.body;
    console.log('🔍 Verifying start code:', startCode, 'for booking:', req.params.id);
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('📋 Booking found, status:', booking.status, 'startCode:', booking.startCode);

    // Check if booking belongs to provider
    if (booking.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to verify this booking' });
    }

    // Check if start code exists
    if (!booking.startCode) {
      console.log('❌ No start code found in booking');
      return res.status(400).json({ message: 'No start code generated for this booking. Please generate a start code first.' });
    }

    // Verify start code (case-insensitive)
    if (booking.startCode.toUpperCase() !== startCode.toUpperCase()) {
      console.log('❌ Code mismatch. Expected:', booking.startCode, 'Received:', startCode);
      return res.status(400).json({ message: 'Invalid start code. Please check the code provided by the customer.' });
    }

    console.log('✅ Start code verified successfully');

    // Mark booking as in progress
    booking.status = 'in_progress';
    booking.actualStartTime = new Date();

    // Clear the start code after verification
    booking.startCode = null;
    booking.startCodeGeneratedAt = null;

    // Add timeline entry
    booking.timeline.push({
      status: 'in_progress',
      timestamp: new Date(),
      note: 'Service started with start code verification',
      updatedBy: req.user._id
    });

    await booking.save();

    // Emit Socket.IO notification to customer that service has started
    const io = req.app.get('io');
    if (io) {
      io.to(`booking_${booking._id}`).emit('booking_update', {
        bookingId: booking._id,
        status: 'in_progress',
        customerId: booking.customer,
        providerId: booking.provider,
        message: 'Service has been started',
        timestamp: new Date()
      });
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('provider', 'name email phone')
      .populate('service', 'title category price images');

    res.json({
      message: 'Service started successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Verify start code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
