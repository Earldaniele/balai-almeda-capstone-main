/**
 * Input Sanitization Middleware (Section 2.4)
 * 
 * Sanitizes all string values in request body to prevent XSS attacks.
 * Strips HTML tags, script tags, and other potentially malicious content.
 */

const validator = require('validator');

/**
 * Recursively sanitize an object's string values
 * @param {any} obj - The object to sanitize
 * @returns {any} - Sanitized object
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle strings - strip HTML tags and trim
  if (typeof obj === 'string') {
    // Use validator to escape HTML, then strip tags
    let sanitized = validator.stripLow(obj); // Remove control characters
    sanitized = validator.escape(sanitized); // Escape HTML entities
    
    // Additionally, use a simple regex to remove any remaining HTML-like tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    return sanitized.trim();
  }

  // Handle arrays - sanitize each element
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  // Handle objects - sanitize each property
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  // Return primitive values as-is (numbers, booleans)
  return obj;
}

/**
 * Express middleware to sanitize request body
 */
function sanitizeRequestBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    // Log original vs sanitized for security monitoring (only in development)
    if (process.env.NODE_ENV !== 'production') {
      const hasUnsafeContent = JSON.stringify(req.body).includes('<') || 
                               JSON.stringify(req.body).includes('>') ||
                               JSON.stringify(req.body).includes('script');
      
      if (hasUnsafeContent) {
        console.warn('⚠️ SECURITY: Potentially unsafe content detected in request body - sanitizing...');
      }
    }

    // Sanitize the entire request body
    req.body = sanitizeObject(req.body);
  }

  next();
}

module.exports = sanitizeRequestBody;
