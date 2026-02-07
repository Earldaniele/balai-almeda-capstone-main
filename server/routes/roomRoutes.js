const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// GET /api/rooms - Get all rooms
router.get('/', roomController.getAllRooms);

// GET /api/rooms/available - Get only available rooms
router.get('/available', roomController.getAvailableRooms);

// GET /api/rooms/:slug/check-availability - Check room availability
router.get('/:slug/check-availability', roomController.checkAvailability);

// GET /api/rooms/:slug - Get room by slug
router.get('/:slug', roomController.getRoomBySlug);

module.exports = router;
