const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const debugRoutes = require('./routes/debugRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const staffRoutes = require('./routes/staffRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Gzip compression for faster responses
app.use(compression());

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'https://cafe-ordering-system-project.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// General rate limiter for all API routes
app.use('/api/', apiLimiter);

// Apply stricter rate limiting to auth routes
app.use('/api/auth/login', authLimiter);

app.use(express.json({ limit: '10kb' })); // Limit body size for security

// Backward compatibility - redirect /api/* to /api/v1/*
app.use('/api', (req, res, next) => {
  // req.path here is the path relative to the mount point ('/api'),
  // so rebuild the target as '/api/v1' + req.path to ensure correct routing.
  const newPath = `/api/v1${req.path}`;
  req.url = newPath;
  next();
});
// Hotfix: also mount key public endpoints at /api/* to support callers using /api/* (pre-rewrite compatibility)
app.use('/api/products', productRoutes);

// API Version 1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/reports', reportRoutes);

// Debug routes (connectivity checks)
app.use('/api/debug', debugRoutes);

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'openapi.yaml'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling Middleware
app.use(errorMiddleware);

module.exports = app;
