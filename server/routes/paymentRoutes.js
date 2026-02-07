const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/payment/create-checkout - Create PayMongo checkout session
// ⚠️ SECURITY: Now requires authentication to prevent guest_id manipulation
router.post('/create-checkout', verifyToken, paymentController.createCheckoutSession);

// POST /api/payment/webhook - Handle PayMongo webhook events
router.post('/webhook', paymentController.handleWebhook);

// GET /api/payment/verify/:referenceCode - Verify payment status
router.get('/verify/:referenceCode', paymentController.verifyPayment);

// GET /api/payment/booking/:referenceCode - Get booking details by reference code
router.get('/booking/:referenceCode', paymentController.getBookingByReference);

// GET /api/payment/my-bookings - Get all bookings for authenticated user
router.get('/my-bookings', verifyToken, paymentController.getUserBookings);

// GET /api/payment/cleanup-stale-bookings - Cancel abandoned bookings older than 5 minutes
router.get('/cleanup-stale-bookings', paymentController.cancelStaleBookings);

module.exports = router;
