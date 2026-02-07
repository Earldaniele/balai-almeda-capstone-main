/**
 * Custom Error Class for Operational Errors
 * Distinguishes between operational errors (expected) and programming bugs
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Mark as operational (not a programming bug)
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
