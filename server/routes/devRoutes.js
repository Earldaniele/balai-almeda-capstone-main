const express = require('express');
const router = express.Router();
const devController = require('../controllers/devController');

/**
 * Development Routes
 * 
 * ⚠️ WARNING: These routes should ONLY be available in development/testing environments
 * They provide tools to simulate payment states and debug bookings
 * 
 * Mount this router with an environment check in server.js:
 * if (process.env.NODE_ENV !== 'production') {
 *   app.use('/api/dev', devRoutes);
 * }
 */

/**
 * POST /api/dev/simulate-payment/:referenceCode
 * Simulate a payment success or failure for testing
 * 
 * @param {string} referenceCode - Booking reference code (e.g., BKG-ABC123)
 * @body {
 *   status: 'paid' | 'failed'
 * }
 * 
 * @example
 * POST /api/dev/simulate-payment/BKG-ABC123
 * Body: { "status": "paid" }
 * 
 * This will update the booking status from Pending_Payment to Confirmed
 */
router.post('/simulate-payment/:referenceCode', devController.simulatePayment);

/**
 * GET /api/dev/pending-bookings
 * Get all bookings with status 'Pending_Payment'
 * 
 * Useful for finding which bookings need payment simulation
 * 
 * @example
 * GET /api/dev/pending-bookings
 */
router.get('/pending-bookings', devController.getPendingBookings);

/**
 * GET /api/dev/all-bookings
 * Get all bookings (or filter by status)
 * 
 * @query {string} status - Optional: Filter by status (Pending_Payment, Confirmed, etc.)
 * @query {number} limit - Optional: Max results (default: 50)
 * 
 * @example
 * GET /api/dev/all-bookings
 * GET /api/dev/all-bookings?status=Confirmed
 * GET /api/dev/all-bookings?limit=10
 */
router.get('/all-bookings', devController.getAllBookings);

module.exports = router;
