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
io.on('connection', (socket) => {

  console.log('🔌 User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });

});

/* =========================================================
   EXPORT SOCKET
========================================================= */
app.set('io', io);

/* =========================================================
   START SERVER
========================================================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔌 Socket.IO enabled`);

});
