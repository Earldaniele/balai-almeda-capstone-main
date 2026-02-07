const jwt = require('jsonwebtoken');

// 🔒 SECURITY: JWT Secret (Section 2.1)
// No fallback - server will fail if JWT_SECRET is not set (validated on startup)
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user ID to request
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};
