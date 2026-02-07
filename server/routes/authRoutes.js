const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiters');

// 🔒 SECURITY: Strict rate limiting on authentication endpoints (Section 2.5)
// POST /api/auth/signup - Register new user (5 attempts per 15 min)
router.post('/signup', authLimiter, authController.signup);

// POST /api/auth/login - Login user (5 attempts per 15 min)
router.post('/login', authLimiter, authController.login);

// PUT /api/auth/profile - Update user profile (protected)
router.put('/profile', authMiddleware.verifyToken, authController.updateProfile);

// PUT /api/auth/change-password - Change user password (protected)
router.put('/change-password', authMiddleware.verifyToken, authController.changePassword);

// GET /api/auth/stats - Get user stats (protected)
router.get('/stats', authMiddleware.verifyToken, authController.getUserStats);

module.exports = router;
