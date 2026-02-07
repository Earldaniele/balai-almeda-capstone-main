const { Room, Booking, RoomImage } = require('../models');
const User = require('../models/User');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// ============================================================
// ROOMS — Full CRUD for IMS Admin Dashboard
// ============================================================

/**
 * GET /api/ims/rooms
 * Get ALL physical rooms with current status (for admin dashboard grid/table)
 */
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      order: [['type', 'ASC'], ['room_number', 'ASC']]
    });

    // For occupied rooms, find the active booking to get guest info
    const occupiedRoomIds = rooms
      .filter(r => r.status === 'Occupied')
      .map(r => r.room_id);

    let activeBookings = [];
    if (occupiedRoomIds.length > 0) {
      activeBookings = await Booking.findAll({
        where: {
          room_id: { [Op.in]: occupiedRoomIds },
          status: 'Checked_In'
        },
        include: [{
          model: User,
          as: 'guest',
          attributes: ['first_name', 'last_name']
        }]
      });
    }

    // Create a lookup map: room_id -> booking
    const bookingMap = {};
    activeBookings.forEach(b => {
      bookingMap[b.room_id] = b;
    });

    const formatted = rooms.map(room => {
      const r = {
        id: room.room_id,
        number: room.room_number,
        suffix: getSuffix(room.room_number, room.type),
        type: room.type,
        status: room.status,
        price: parseFloat(room.base_rate_3hr),
        rates: {
          '3h': parseFloat(room.base_rate_3hr),
          '6h': parseFloat(room.base_rate_6hr),
          '12h': parseFloat(room.base_rate_12hr),
          '24h': parseFloat(room.base_rate_24hr),
        }
      };

      if (room.status === 'Occupied' && bookingMap[room.room_id]) {
        const bk = bookingMap[room.room_id];
        const guest = bk.guest;
        r.guest = guest
          ? `${guest.first_name.charAt(0)}. ${guest.last_name}`
          : 'Walk-In';
        r.checkIn = bk.check_in_time
          ? new Date(bk.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null;

        // Calculate time left
        const now = new Date();
        let checkout = bk.check_out_time ? new Date(bk.check_out_time) : null;

        // Fallback: calculate checkout from check_in_time + duration_hours
        if (!checkout && bk.check_in_time && bk.duration_hours) {
          checkout = new Date(new Date(bk.check_in_time).getTime() + bk.duration_hours * 60 * 60 * 1000);
        }

        if (checkout) {
          const diffMs = checkout - now;
          if (diffMs > 0) {
            const totalMin = Math.floor(diffMs / 60000);
            const hours = Math.floor(totalMin / 60);
            const mins = totalMin % 60;
            if (hours > 0) {
              r.timeLeft = `${hours}h ${mins}m`;
            } else {
              r.timeLeft = `${mins}m`;
            }
            r.urgent = totalMin <= 10;
          } else {
            r.timeLeft = 'Overdue';
            r.urgent = true;
          }
        } else {
          r.timeLeft = `${bk.duration_hours || '?'}h`;
        }

        r.duration = bk.duration_hours ? `${bk.duration_hours}h` : null;
        r.bookingId = bk.booking_id;
      }

      if (room.status === 'Dirty') {
        r.checkOut = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      if (room.status === 'Maintenance') {
        r.note = 'Under Maintenance';
      }

      return r;
    });

    res.json({ success: true, rooms: formatted });
  } catch (error) {
    console.error('IMS getAllRooms error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  }
};

/**
 * PATCH /api/ims/rooms/:id/status
 * Update a room's status (Available, Occupied, Dirty, Maintenance)
 */
exports.updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Available', 'Occupied', 'Dirty', 'Maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    await room.update({ status });

    res.json({ success: true, message: `Room ${room.room_number} updated to ${status}` });
  } catch (error) {
    console.error('IMS updateRoomStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update room status' });
  }
};

// ============================================================
// BOOKINGS — For Reservations view
// ============================================================

/**
 * GET /api/ims/bookings
 * Get all bookings with room and guest info
 */
exports.getAllBookings = async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    const where = {};
    if (status && status !== 'All') {
      where.status = status;
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Room, as: 'room', attributes: ['room_id', 'room_number', 'type', 'name'] },
        { model: User, as: 'guest', attributes: ['first_name', 'last_name', 'email', 'phone'] }
      ],
      order: [['check_in_time', 'DESC']],
      limit: parseInt(limit)
    });

    const formatted = bookings.map(b => ({
      id: b.reference_code || `BKG-${String(b.booking_id).padStart(3, '0')}`,
      bookingId: b.booking_id,
      guest: b.guest ? `${b.guest.first_name} ${b.guest.last_name}` : 'Walk-In',
      guestEmail: b.guest?.email || null,
      guestPhone: b.guest?.phone || null,
      room: b.room ? `${b.room.room_number}` : 'N/A',
      roomType: b.room?.type || 'N/A',
      checkIn: b.check_in_time ? new Date(b.check_in_time).toISOString() : null,
      checkOut: b.check_out_time ? new Date(b.check_out_time).toISOString() : null,
      duration: `${b.duration_hours}h`,
      adults: b.adults_count,
      children: b.children_count,
      status: formatBookingStatus(b.status),
      source: b.source === 'Walk_in' ? 'Walk-In' : 'Online',
      totalAmount: parseFloat(b.total_amount),
      createdAt: b.created_at
    }));

    res.json({ success: true, bookings: formatted });
  } catch (error) {
    console.error('IMS getAllBookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

/**
 * PATCH /api/ims/bookings/:id/status
 * Update booking status (Check In, Check Out, Cancel)
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Confirmed', 'Checked_In', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const booking = await Booking.findByPk(id, {
      include: [{ model: Room, as: 'room' }]
    });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const updateData = { status };

    // If checking in, set actual check-in time and calculate check-out time
    if (status === 'Checked_In') {
      const now = new Date();
      updateData.check_in_time = now;
      if (booking.duration_hours) {
        updateData.check_out_time = new Date(now.getTime() + booking.duration_hours * 60 * 60 * 1000);
      }
    }

    // If completing, set actual check-out time to now
    if (status === 'Completed') {
      updateData.check_out_time = new Date();
    }

    await booking.update(updateData);

    // If checking in, mark room as Occupied
    if (status === 'Checked_In' && booking.room) {
      await booking.room.update({ status: 'Occupied' });
    }

    // If checking out / completing, mark room as Dirty
    if (status === 'Completed' && booking.room) {
      await booking.room.update({ status: 'Dirty' });
    }

    res.json({ success: true, message: `Booking updated to ${status}` });
  } catch (error) {
    console.error('IMS updateBookingStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
};

/**
 * POST /api/ims/bookings
 * Create a walk-in booking from admin panel
 */
exports.createWalkInBooking = async (req, res) => {
  try {
    const { roomId, guestName, duration, adults, children } = req.body;

    if (!roomId || !duration) {
      return res.status(400).json({ success: false, message: 'Room and duration are required' });
    }

    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const durationKey = `base_rate_${duration}hr`;
    const rate = parseFloat(room[durationKey]);
    if (!rate) return res.status(400).json({ success: false, message: 'Invalid duration' });

    const now = new Date();
    const checkOut = new Date(now.getTime() + duration * 60 * 60 * 1000);

    const refCode = `WLK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const booking = await Booking.create({
      room_id: roomId,
      reference_code: refCode,
      check_in_time: now,
      check_out_time: checkOut,
      duration_hours: parseInt(duration),
      adults_count: adults || 1,
      children_count: children || 0,
      source: 'Walk_in',
      status: 'Checked_In',
      total_amount: rate
    });

    // Mark room as occupied
    await room.update({ status: 'Occupied' });

    res.json({
      success: true,
      message: `Walk-in created for room ${room.room_number}`,
      booking: { id: booking.booking_id, referenceCode: refCode }
    });
  } catch (error) {
    console.error('IMS createWalkInBooking error:', error);
    res.status(500).json({ success: false, message: 'Failed to create walk-in booking' });
  }
};

// ============================================================
// STAFF — For HR view
// ============================================================

/**
 * GET /api/ims/staff
 * Get all staff members (Users with role != Guest)
 */
exports.getAllStaff = async (req, res) => {
  try {
    // Get from users table where role is not Guest
    const users = await User.findAll({
      where: {
        role: { [Op.ne]: 'Guest' }
      },
      attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone', 'role', 'created_at'],
      order: [['role', 'ASC'], ['last_name', 'ASC']]
    });

    // Also get staff table data if it exists
    const [staffRows] = await sequelize.query(
      'SELECT s.staff_id, s.user_id, s.full_name, s.position, s.hourly_rate FROM staff s',
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => [[]]);

    const staffMap = {};
    if (Array.isArray(staffRows)) {
      staffRows.forEach(s => { staffMap[s.user_id] = s; });
    }

    const formatted = users.map((u, i) => {
      const extra = staffMap[u.user_id] || {};
      return {
        id: u.user_id,
        name: `${u.first_name} ${u.last_name}`,
        role: formatRole(u.role),
        rate: extra.hourly_rate ? parseFloat(extra.hourly_rate) : getRateByRole(u.role),
        status: 'Active',
        phone: u.phone || 'N/A',
        email: u.email
      };
    });

    res.json({ success: true, staff: formatted });
  } catch (error) {
    console.error('IMS getAllStaff error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff' });
  }
};

// ============================================================
// MENU ITEMS — For POS view
// ============================================================

/**
 * GET /api/ims/menu
 * Get all menu items grouped by provider
 */
exports.getMenuItems = async (req, res) => {
  try {
    const [items] = await sequelize.query(
      'SELECT item_id, name, category, price, provider, current_stock FROM menu_items ORDER BY provider, category, name'
    );

    const formatted = items.map(item => ({
      id: item.item_id,
      name: item.name,
      category: item.category,
      price: parseFloat(item.price),
      provider: item.provider === 'Partner_JustDrink' ? 'Partner' : 'In-House',
      stock: item.current_stock
    }));

    res.json({ success: true, items: formatted });
  } catch (error) {
    console.error('IMS getMenuItems error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
  }
};

// ============================================================
// ORDERS — For POS view
// ============================================================

/**
 * POST /api/ims/orders
 * Create a room order (charge items to a room)
 */
exports.createOrder = async (req, res) => {
  try {
    const { bookingId, items, totalCost } = req.body;

    if (!bookingId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Booking and items are required' });
    }

    // Create order
    const [orderResult] = await sequelize.query(
      'INSERT INTO room_orders (booking_id, total_cost, status) VALUES (?, ?, ?)',
      { replacements: [bookingId, totalCost, 'Pending'] }
    );
    const orderId = orderResult;

    // Create order details
    for (const item of items) {
      await sequelize.query(
        'INSERT INTO order_details (order_id, item_id, quantity, subtotal) VALUES (?, ?, ?, ?)',
        { replacements: [orderId, item.id, item.qty, item.price * item.qty] }
      );

      // Deduct stock
      await sequelize.query(
        'UPDATE menu_items SET current_stock = current_stock - ? WHERE item_id = ? AND current_stock >= ?',
        { replacements: [item.qty, item.id, item.qty] }
      );
    }

    res.json({ success: true, message: 'Order created', orderId });
  } catch (error) {
    console.error('IMS createOrder error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

// ============================================================
// SHIFT REPORTS — For Shift & Cash view
// ============================================================

/**
 * GET /api/ims/shift/current
 * Get current shift summary data (sales, cash computation)
 */
exports.getCurrentShift = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's confirmed bookings = sales
    const todaysBookings = await Booking.findAll({
      where: {
        check_in_time: { [Op.between]: [today, tomorrow] },
        status: { [Op.in]: ['Confirmed', 'Checked_In', 'Completed'] }
      }
    });

    const cashSales = todaysBookings
      .filter(b => b.source === 'Walk_in')
      .reduce((sum, b) => sum + parseFloat(b.total_amount), 0);

    const onlineSales = todaysBookings
      .filter(b => b.source === 'Web')
      .reduce((sum, b) => sum + parseFloat(b.total_amount), 0);

    // Room order sales today
    const [orderSales] = await sequelize.query(
      `SELECT COALESCE(SUM(total_cost), 0) as total 
       FROM room_orders 
       WHERE DATE(order_time) = CURDATE() AND status != 'Cancelled'`
    );

    const initialCash = 5000; // Default petty cash — can be made configurable

    res.json({
      success: true,
      shift: {
        initialCash,
        cashSales: Math.round(cashSales * 100) / 100,
        onlineSales: Math.round(onlineSales * 100) / 100,
        orderSales: parseFloat(orderSales[0]?.total || 0),
        totalSystemCash: Math.round((initialCash + cashSales + parseFloat(orderSales[0]?.total || 0)) * 100) / 100,
        totalBookings: todaysBookings.length,
        date: today.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('IMS getCurrentShift error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shift data' });
  }
};

/**
 * POST /api/ims/shift/submit
 * Submit end-of-shift report
 */
exports.submitShiftReport = async (req, res) => {
  try {
    const { staffId, physicalCash, expenses, remarks } = req.body;

    const shiftData = await exports.getCurrentShift.__computeInternal?.() || {};

    await sequelize.query(
      `INSERT INTO shift_reports (staff_id, shift_start, shift_end, initial_cash, system_computed_cash, physical_cash_count, variance)
       VALUES (?, NOW(), NOW(), ?, ?, ?, ?)`,
      {
        replacements: [
          staffId || 1,
          5000,
          physicalCash || 0,
          physicalCash || 0,
          (physicalCash || 0) - ((5000 + (shiftData.cashSales || 0)) - (expenses || 0))
        ]
      }
    );

    res.json({ success: true, message: 'Shift report submitted' });
  } catch (error) {
    console.error('IMS submitShiftReport error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit shift report' });
  }
};

// ============================================================
// DASHBOARD STATS
// ============================================================

/**
 * GET /api/ims/dashboard/stats
 * Aggregate dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const rooms = await Room.findAll();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysBookings = await Booking.count({
      where: {
        check_in_time: { [Op.between]: [today, tomorrow] },
        status: { [Op.in]: ['Confirmed', 'Checked_In', 'Completed'] }
      }
    });

    const stats = {
      totalRooms: rooms.length,
      available: rooms.filter(r => r.status === 'Available').length,
      occupied: rooms.filter(r => r.status === 'Occupied').length,
      dirty: rooms.filter(r => r.status === 'Dirty').length,
      maintenance: rooms.filter(r => r.status === 'Maintenance').length,
      occupancyRate: rooms.length > 0
        ? Math.round((rooms.filter(r => r.status === 'Occupied').length / rooms.length) * 100)
        : 0,
      todaysBookings
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('IMS getDashboardStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// ============================================================
// AUTH — Admin login
// ============================================================

/**
 * POST /api/ims/auth/login
 * Login for admin/staff users only
 */
exports.adminLogin = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Must be a staff/admin role
    const staffRoles = ['Admin', 'FrontDesk', 'Housekeeping', 'Manager'];
    if (!staffRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Staff accounts only.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('IMS adminLogin error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// ============================================================
// HELPERS
// ============================================================

function getSuffix(roomNumber, type) {
  const typeMap = { Value: 'V', Standard: 'S', Deluxe: 'D', Superior: 'SU', Suite: 'ST' };
  // Try to extract from room_number if it ends with a letter
  const match = roomNumber.match(/([A-Z]+)$/i);
  if (match) return match[1];
  return typeMap[type] || '';
}

function formatBookingStatus(status) {
  const map = {
    'Pending_Payment': 'Pending',
    'Confirmed': 'Confirmed',
    'Checked_In': 'Checked In',
    'Completed': 'Checked Out',
    'Cancelled': 'Cancelled'
  };
  return map[status] || status;
}

function formatRole(role) {
  const map = {
    'Admin': 'Manager',
    'FrontDesk': 'Front Desk',
    'Housekeeping': 'Housekeeping',
    'Manager': 'Manager'
  };
  return map[role] || role;
}

function getRateByRole(role) {
  const rates = {
    'Admin': 150,
    'Manager': 150,
    'FrontDesk': 85,
    'Housekeeping': 75
  };
  return rates[role] || 75;
}
