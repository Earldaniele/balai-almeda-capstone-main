/**
 * Rate Limiting Middleware (Section 2.5)
 * 
 * Protects against brute-force attacks, DDoS, and API abuse.
 * Implements different rate limits for general API access and authentication endpoints.
 */

const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 * Applies to all API endpoints
 * 
 * Limit: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    console.warn(`⚠️ SECURITY: Rate limit exceeded for IP ${req.ip} on ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});

/**
 * Strict Authentication Rate Limiter
 * Applies only to login and signup endpoints
 * 
 * Limit: 5 requests per 15 minutes per IP
 * 
 * This strict limit prevents:
 * - Brute force password attacks
 * - Account enumeration
 * - Automated account creation
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Higher limit for development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Skip successful requests from counting against the limit (optional)
  skipSuccessfulRequests: false, // Count all attempts, even successful ones
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    console.warn(`⚠️ SECURITY: Auth rate limit exceeded for IP ${req.ip} on ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again after 15 minutes.'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
