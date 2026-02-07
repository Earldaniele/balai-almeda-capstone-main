const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables first
const validateRequiredEnvVars = require('./config/validateEnv'); // Validate env vars

// 🔒 SECURITY: Environment Validation (Section 2.2)
// Validate all required environment variables before starting server
validateRequiredEnvVars();

const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentController = require('./controllers/paymentController');
const imsRoutes = require('./routes/imsRoutes');

// 🧪 DEV ONLY: Development/Testing routes
const devRoutes = require('./routes/devRoutes');

// 🔒 SECURITY: Middleware imports (Sections 2.4, 2.5)
const sanitizeRequestBody = require('./middleware/sanitize');
const { apiLimiter } = require('./middleware/rateLimiters');

// 🔒 SECURITY: Error Handling (Section 2.8)
const AppError = require('./utils/AppError');
const errorController = require('./controllers/errorController');

// 🔇 PRODUCTION MODE: Suppress verbose logging
if (process.env.NODE_ENV === 'production') {
  console.log = function() {}; // Mute verbose logs
  console.debug = function() {}; // Mute debug logs
  console.info = function() {}; // Mute info logs
  // ⚠️ Keep console.error and console.warn active for critical issues
  console.error('🔒 Production mode: Verbose logging suppressed (errors/warnings still active)');
} else {
  console.log('🔧 Development mode: All console output enabled');
}

const app = express();
const PORT = process.env.PORT || 3000;

// 🔒 SECURITY: CORS Configuration (Section 2.10)
// Only allow requests from authorized origins
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL, process.env.IMS_URL].filter(Boolean) // Only production URLs (filter out undefined)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176']; // Dev URLs

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Allow cookies/auth headers
}));

// 🔒 SECURITY: Webhook Route (Section 2.13)
// Must come BEFORE express.json() to receive raw body for signature verification
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// 🔒 SECURITY: Request Body Size Limits (Section 2.9)
// Prevent DoS attacks via massive JSON/form payloads
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 🔒 SECURITY: Input Sanitization (Section 2.4)
// Strip HTML tags and malicious content from all request bodies
app.use(sanitizeRequestBody);

// Prevent browsers & service workers from caching API responses
app.use('/api/', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// 🔒 SECURITY: Rate Limiting (Section 2.5)
// General API rate limiter - 100 requests per 15 minutes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ims', imsRoutes);

// 🧪 DEV ONLY: Development/Testing routes
// Only mount dev routes in non-production environments
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes);
  console.log('🧪 Dev routes enabled at /api/dev (payment simulator available)');
} else {
  console.log('🔒 Production mode: Dev routes disabled');
}

// 🔒 SECURITY: 404 Handler (Section 2.8)
// Handle all undefined routes with proper error response
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// 🔒 SECURITY: Global Error Handler (Section 2.8)
// Centralized error handling - must be last middleware
app.use(errorController);

// Test Database Connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected to XAMPP MySQL!');
    // Sync models with database
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    console.log('✅ Database models synced');
  })
  .catch(err => console.error('❌ Database connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ error: message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});