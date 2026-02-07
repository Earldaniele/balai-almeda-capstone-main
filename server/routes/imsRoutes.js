const express = require('express');
const router = express.Router();
const imsController = require('../controllers/imsController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * IMS Admin Routes
 * All routes require staff authentication (Admin, FrontDesk, Housekeeping, Manager)
 * 
 * Base path: /api/ims
 */

// --- AUTH (no token required) ---
router.post('/auth/login', imsController.adminLogin);

// --- DASHBOARD ---
router.get('/dashboard/stats', verifyToken, imsController.getDashboardStats);

// --- ROOMS ---
router.get('/rooms', verifyToken, imsController.getAllRooms);
router.patch('/rooms/:id/status', verifyToken, imsController.updateRoomStatus);

// --- BOOKINGS ---
router.get('/bookings', verifyToken, imsController.getAllBookings);
router.patch('/bookings/:id/status', verifyToken, imsController.updateBookingStatus);
router.post('/bookings/walk-in', verifyToken, imsController.createWalkInBooking);

// --- STAFF ---
router.get('/staff', verifyToken, imsController.getAllStaff);

// --- MENU / POS ---
router.get('/menu', verifyToken, imsController.getMenuItems);
router.post('/orders', verifyToken, imsController.createOrder);

// --- SHIFT ---
router.get('/shift/current', verifyToken, imsController.getCurrentShift);
router.post('/shift/submit', verifyToken, imsController.submitShiftReport);

module.exports = router;
