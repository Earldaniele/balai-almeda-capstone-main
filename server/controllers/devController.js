const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { Op } = require('sequelize');

/**
 * Simulate Payment Status for Development/Testing
 * POST /api/dev/simulate-payment/:referenceCode
 * 
 * @body { status: 'paid' | 'failed' }
 * 
 * ⚠️ DEV ONLY - This endpoint should NEVER be available in production
 */
exports.simulatePayment = async (req, res) => {
  try {
    const { referenceCode } = req.params;
    const { status } = req.body;

    console.log(`🧪 [DEV SIMULATOR] Simulating payment for ${referenceCode} with status: ${status}`);

    // Validate status
    if (!status || !['paid', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "paid" or "failed"'
      });
    }

    // Find the booking
    const booking = await Booking.findOne({
      where: { reference_code: referenceCode },
      include: [{ model: Room, as: 'room', attributes: ['name', 'type', 'room_number'] }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking not found: ${referenceCode}`
      });
    }

    // Check if booking is in a valid state to simulate payment
    if (booking.status !== 'Pending_Payment') {
      return res.status(400).json({
        success: false,
        message: `Cannot simulate payment. Booking status is already: ${booking.status}`,
        currentStatus: booking.status
      });
    }

    // Update booking status based on simulated payment result
    let newStatus;
    if (status === 'paid') {
      newStatus = 'Confirmed';
      console.log(`✅ [DEV SIMULATOR] Payment SUCCESS - Confirming booking ${referenceCode}`);
    } else if (status === 'failed') {
      newStatus = 'Cancelled';
      console.log(`❌ [DEV SIMULATOR] Payment FAILED - Cancelling booking ${referenceCode}`);
    }

    await booking.update({ status: newStatus });

    res.status(200).json({
      success: true,
      message: `Payment simulated successfully`,
      booking: {
        referenceCode: booking.reference_code,
        roomName: booking.room?.name,
        roomNumber: booking.room?.room_number,
        previousStatus: 'Pending_Payment',
        newStatus: newStatus,
        totalAmount: booking.total_amount,
        checkInTime: booking.check_in_time,
        checkOutTime: booking.check_out_time
      }
    });

  } catch (error) {
    console.error('❌ [DEV SIMULATOR] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to simulate payment',
      error: error.message
    });
  }
};

/**
 * Get all pending bookings (for testing)
 * GET /api/dev/pending-bookings
 * 
 * ⚠️ DEV ONLY - Helper endpoint to see which bookings need payment simulation
 */
exports.getPendingBookings = async (req, res) => {
  try {
    console.log(`🧪 [DEV SIMULATOR] Fetching all pending bookings...`);

    const pendingBookings = await Booking.findAll({
      where: { 
        status: 'Pending_Payment'
      },
      include: [{
        model: Room,
        as: 'room',
        attributes: ['room_id', 'name', 'type', 'room_number']
      }],
      order: [['created_at', 'DESC']],
      attributes: [
        'booking_id',
        'reference_code',
        'checkout_session_id',
        'check_in_time',
        'check_out_time',
        'duration_hours',
        'total_amount',
        'status',
        'created_at'
      ]
    });

    const formattedBookings = pendingBookings.map(booking => ({
      id: booking.booking_id,
      referenceCode: booking.reference_code,
      sessionId: booking.checkout_session_id,
      roomId: booking.room?.room_id,
      roomName: booking.room?.name,
      roomNumber: booking.room?.room_number,
      roomType: booking.room?.type,
      checkInTime: booking.check_in_time,
      checkOutTime: booking.check_out_time,
      durationHours: booking.duration_hours,
      totalAmount: parseFloat(booking.total_amount),
      status: booking.status,
      createdAt: booking.created_at,
      // Add age in minutes for easier debugging
      ageMinutes: Math.floor((new Date() - new Date(booking.created_at)) / 60000)
    }));

    console.log(`✅ [DEV SIMULATOR] Found ${formattedBookings.length} pending booking(s)`);

    res.status(200).json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings
    });

  } catch (error) {
    console.error('❌ [DEV SIMULATOR] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending bookings',
      error: error.message
    });
  }
};

/**
 * Get all bookings (for testing/debugging)
 * GET /api/dev/all-bookings
 * 
 * ⚠️ DEV ONLY - See all bookings regardless of status
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    console.log(`🧪 [DEV SIMULATOR] Fetching all bookings${status ? ` with status: ${status}` : ''}...`);

    const whereClause = status ? { status } : {};

    const allBookings = await Booking.findAll({
      where: whereClause,
      include: [{
        model: Room,
        as: 'room',
        attributes: ['room_id', 'name', 'type', 'room_number']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    const formattedBookings = allBookings.map(booking => ({
      id: booking.booking_id,
      referenceCode: booking.reference_code,
      sessionId: booking.checkout_session_id,
      guestId: booking.guest_id,
      roomId: booking.room?.room_id,
      roomName: booking.room?.name,
      roomNumber: booking.room?.room_number,
      checkInTime: booking.check_in_time,
      checkOutTime: booking.check_out_time,
      durationHours: booking.duration_hours,
      adultsCount: booking.adults_count,
      childrenCount: booking.children_count,
      totalAmount: parseFloat(booking.total_amount),
      status: booking.status,
      source: booking.source,
      createdAt: booking.created_at
    }));

    res.status(200).json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings
    });

  } catch (error) {
    console.error('❌ [DEV SIMULATOR] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};
