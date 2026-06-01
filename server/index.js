const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');

require('dotenv').config();
require('dotenv').config({ path: './server/.env' });

const passport = require('./config/googleAuth');

const app = express();
const server = http.createServer(app);

/* =========================================================
   TRUST PROXY FIX (IMPORTANT FOR RENDER)
========================================================= */
app.set('trust proxy', 1);

/* =========================================================
   ALLOWED ORIGINS
========================================================= */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  'ionic://localhost',
  process.env.FRONTEND_URL
].filter(Boolean);

/* =========================================================
   SOCKET.IO
========================================================= */
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

/* =========================================================
   SOCKET AUTH
========================================================= */
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log('⚠️ No token provided');
      return next();
    }

    console.log('✅ Socket connected with token');
    next();

  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error'));
  }
});

/* =========================================================
   CORS
========================================================= */
app.use(cors({
  origin: function(origin, callback) {

    // allow requests with no origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(null, true);
    }
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ]
}));

/* =========================================================
   HELMET
========================================================= */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },

  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],

      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://checkout.razorpay.com",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com"
      ],

      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],

      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],

      imgSrc: [
        "'self'",
        "data:",
        "https:"
      ],

      mediaSrc: [
        "'self'",
        "blob:"
      ],

      connectSrc: [
        "'self'",
        "https://maps.googleapis.com",
        "https://api.mapbox.com",
        "https://nominatim.openstreetmap.org",
        "https://api.razorpay.com",
        "https://lumberjack.razorpay.com",
        "https://checkout.razorpay.com"
      ],

      frameSrc: [
        "'self'",
        "https://checkout.razorpay.com",
        "https://api.razorpay.com"
      ]
    }
  }
}));

/* =========================================================
   RATE LIMIT
========================================================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,

  message: {
    success: false,
    message: 'Too many requests'
  },

  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

/* =========================================================
   DEBUG LOGS
========================================================= */
app.use((req, res, next) => {

  console.log('🌐 Request:', {
    method: req.method,
    origin: req.headers.origin,
    path: req.path,
    userAgent: req.headers['user-agent']
  });

  next();
});

/* =========================================================
   BODY PARSER
========================================================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

/* =========================================================
   SESSION
========================================================= */
app.use(session({
  secret: process.env.JWT_SECRET || 'secret',

  resave: false,
  saveUninitialized: false,

  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

/* =========================================================
   PASSPORT
========================================================= */
app.use(passport.initialize());
app.use(passport.session());

/* =========================================================
   STATIC FILES
========================================================= */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/* =========================================================
   DATABASE
========================================================= */
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/insta_serve'
)

.then(() => {
  console.log('✅ MongoDB connected');
})

.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

/* =========================================================
   ROUTES
========================================================= */
const ensureProviderLocation = require('./middleware/providerLocation');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/provider', ensureProviderLocation, require('./routes/provider'));
app.use('/api', require('./routes/kyc'));
app.use('/api/razorpay-route', require('./routes/razorpayRoute'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/maps', require('./routes/maps'));
app.use('/api/contact', require('./routes/contact'));

/* =========================================================
   HEALTH
========================================================= */
app.get('/api/health', (req, res) => {

  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });

});

/* =========================================================
   ERROR HANDLER
========================================================= */
app.use((err, req, res, next) => {

  console.error('❌ Error:', err);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });

});

/* =========================================================
   REACT BUILD
========================================================= */
if (process.env.NODE_ENV === 'production') {

  app.use(express.static(
    path.join(__dirname, '../client/build')
  ));

  app.get('*', (req, res) => {

    if (req.path.startsWith('/api/')) {
      return res.status(404).json({
        message: 'API route not found'
      });
    }

    res.sendFile(
      path.join(__dirname, '../client/build/index.html')
    );
  });

}

/* =========================================================
   SOCKET CONNECTION
========================================================= */
// Store connected users and their locations
const connectedUsers = new Map();
const userLocations = new Map();

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  // For now, rely on the authenticate event instead of middleware
  console.log('🔌 Waiting for authentication event...');

  // Handle user authentication and registration
  socket.on('authenticate', (userData, callback) => {
    console.log('🔍 [DEBUG] Authenticate event received:', userData);
    console.log('🔍 [DEBUG] Socket ID:', socket.id);
    
    if (userData && userData.userId) {
      connectedUsers.set(socket.id, userData);
      console.log(`✅ User authenticated: ${userData.name} (${userData.role})`);
      
      // Join user to their personal room for targeted updates
      const roomName = `user_${userData.userId}`;
      socket.join(roomName);
      console.log(`✅ User joined room: ${roomName}`);
      
      // Verify room membership
      const roomMembers = io.sockets.adapter.rooms.get(roomName);
      console.log(`🔍 [DEBUG] Room ${roomName} members:`, roomMembers ? roomMembers.size : 0);
      
      // Join providers to their role room for broadcast requests
      if (userData.role === 'provider') {
        socket.join('providers');
        // Also join providers to a general location room for live tracking
        socket.join('provider_location_room');
        console.log(`📍 Provider ${userData.name} joined provider location room for live tracking`);
      }
      
      // Send acknowledgment back to client
      if (callback) {
        callback({ success: true, room: roomName });
      }
    } else {
      console.log('⚠️ Invalid user data received:', userData);
      if (callback) {
        callback({ success: false, error: 'Invalid user data' });
      }
    }
  });

  // Handle joining booking rooms for targeted location sharing
  socket.on('join_booking_room', (bookingId) => {
    const user = connectedUsers.get(socket.id);
    if (user && bookingId) {
      socket.join(`booking_${bookingId}`);
      console.log(`📋 User ${user.name} joined booking room: ${bookingId}`);
    }
  });

  // Handle joining arbitrary rooms (fallback for user rooms)
  socket.on('join_room', (roomName) => {
    if (roomName) {
      socket.join(roomName);
      console.log(`📋 Socket ${socket.id} joined room: ${roomName}`);
      
      // Verify room membership
      const roomMembers = io.sockets.adapter.rooms.get(roomName);
      console.log(`🔍 [DEBUG] Room ${roomName} members:`, roomMembers ? roomMembers.size : 0);
    }
  });

  // Handle leaving booking rooms
  socket.on('leave_booking_room', (bookingId) => {
    const user = connectedUsers.get(socket.id);
    if (user && bookingId) {
      socket.leave(`booking_${bookingId}`);
      console.log(`📋 User ${user.name} left booking room: ${bookingId}`);
    }
  });

  // Handle location updates
  socket.on('location_update', (locationData) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      // Store user's location
      userLocations.set(user.userId, {
        ...locationData,
        timestamp: new Date(),
        userName: user.name,
        userRole: user.role
      });
      
      console.log(`📍 [DEBUG] Location update from ${user.name} (${user.role}):`, locationData);
      
      // Include bookingId if provided in location data for targeted sharing
      const bookingId = locationData.bookingId;
      
      if (bookingId) {
        console.log(`📍 [DEBUG] Processing targeted location update for booking ${bookingId}`);
        // Share location only between provider and customer of the same booking
        if (user.role === 'provider') {
          // Send provider location to customer of this booking (exclude sender)
          const providerLocationData = {
            providerId: user.userId,
            providerName: user.name,
            location: locationData,
            timestamp: new Date(),
            bookingId: bookingId
          };
          
          const room = `booking_${bookingId}`;
          const roomMembers = io.sockets.adapter.rooms.get(room);
          
          if (roomMembers && roomMembers.size > 0) {
            socket.to(room).emit('provider_location_update', providerLocationData);
            console.log(`📍 [DEBUG] Provider location sent to room ${room}:`, providerLocationData);
          } else {
            // Fallback to broadcast if room is empty
            socket.broadcast.emit('provider_location_update', providerLocationData);
            console.log(`📍 [DEBUG] Room ${room} empty, using broadcast fallback:`, providerLocationData);
          }
        } else if (user.role === 'customer') {
          // Send customer location to provider of this booking (exclude sender)
          const customerLocationData = {
            customerId: user.userId,
            customerName: user.name,
            location: locationData,
            timestamp: new Date(),
            bookingId: bookingId
          };
          
          const room = `booking_${bookingId}`;
          const roomMembers = io.sockets.adapter.rooms.get(room);
          
          if (roomMembers && roomMembers.size > 0) {
            socket.to(room).emit('customer_location_update', customerLocationData);
            console.log(`📍 [DEBUG] Customer location sent to room ${room}:`, customerLocationData);
          } else {
            // Fallback to broadcast if room is empty
            socket.broadcast.emit('customer_location_update', customerLocationData);
            console.log(`📍 [DEBUG] Room ${room} empty, using broadcast fallback:`, customerLocationData);
          }
        }
      } else {
        console.log(`📍 [DEBUG] No bookingId provided, using fallback broadcast`);
        // Fallback: broadcast to all (for testing or when bookingId is not available)
        if (user.role === 'provider') {
          const providerData = {
            providerId: user.userId,
            providerName: user.name,
            location: locationData,
            timestamp: new Date()
          };
          socket.broadcast.emit('provider_location_update', providerData);
          console.log(`📍 [DEBUG] Provider location broadcasted:`, providerData);
        } else if (user.role === 'customer') {
          const customerData = {
            customerId: user.userId,
            customerName: user.name,
            location: locationData,
            timestamp: new Date()
          };
          socket.broadcast.emit('customer_location_update', customerData);
          console.log(`📍 [DEBUG] Customer location broadcasted:`, customerData);
        }
      }
    } else {
      console.log(`⚠️ [DEBUG] Location update received from unauthenticated user:`, locationData);
    }
  });

  // Handle booking status updates
  socket.on('booking_status_update', (bookingData) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      // Broadcast to all relevant parties
      socket.to(`user_${bookingData.customerId}`).emit('booking_update', bookingData);
      socket.to(`user_${bookingData.providerId}`).emit('booking_update', bookingData);
      
      console.log(`📢 Booking update broadcasted: ${bookingData.bookingId} - ${bookingData.status}`);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user && data.bookingId) {
      const typingData = {
        ...data,
        userId: user.userId,
        userName: user.name
      };
      
      // Send typing indicator to booking room
      const bookingRoom = `booking_${data.bookingId}`;
      socket.to(bookingRoom).emit('user_typing', typingData);
      
      console.log(`💬 [DEBUG] Typing indicator sent to room ${bookingRoom}:`, typingData);
    }
  });

  // Handle real-time chat - for backward compatibility
  socket.on('send_message', async (messageData) => {
    console.log('💬 [DEBUG] Socket message received:', messageData);
    const user = connectedUsers.get(socket.id);
    if (user) {
      const message = {
        ...messageData,
        senderName: user.name,
        senderRole: user.role,
        timestamp: new Date()
      };
      
      console.log('💬 [DEBUG] Processed message:', message);
      console.log('💬 [DEBUG] Booking ID:', messageData.bookingId);
      
      // Save message to database
      try {
        const Chat = require('./models/Chat');
        const chat = new Chat({
          booking: messageData.bookingId,
          sender: user.userId,
          recipient: messageData.recipientId,
          message: messageData.message,
          type: messageData.type || 'text'
        });
        await chat.save();
        console.log('💬 [DEBUG] Message saved to database:', chat._id);
        
        // Populate sender and recipient
        await chat.populate('sender', 'name email');
        await chat.populate('recipient', 'name email');
        
        // Create message data for socket emission
        const messageDataForSocket = {
          id: chat._id,
          bookingId: chat.booking,
          senderId: chat.sender._id,
          senderName: chat.sender.name,
          recipientId: chat.recipient._id,
          recipientName: chat.recipient.name,
          message: chat.message,
          timestamp: chat.createdAt,
          type: chat.type
        };
        
        // Send message to recipient's user room
        socket.to(`user_${messageData.recipientId}`).emit('receive_message', messageDataForSocket);
        console.log(`💬 [DEBUG] Message sent to recipient user_${messageData.recipientId}:`, messageDataForSocket);
        
        // Also send to booking room
        const bookingRoom = `booking_${messageData.bookingId}`;
        socket.to(bookingRoom).emit('receive_message', messageDataForSocket);
        console.log(`💬 [DEBUG] Message also sent to booking room ${bookingRoom}:`, messageDataForSocket);
        
      } catch (error) {
        console.error('💬 [ERROR] Failed to save message to database:', error);
      }
    } else {
      console.log('💬 [ERROR] User not found for chat message');
    }
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`🔌 User disconnected: ${user.name} (${user.role})`);
      connectedUsers.delete(socket.id);
      userLocations.delete(user.userId);
    }
  });
});

/* =========================================================
   EXPORT SOCKET
========================================================= */
app.set('io', io);
app.set('userLocations', userLocations);

/* =========================================================
   START SERVER
========================================================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔌 Socket.IO enabled`);

});
