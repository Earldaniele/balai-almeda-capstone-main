const { Room, RoomImage, Booking } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { cleanUpStaleBookingsInternal } = require('./paymentController');

// Get all rooms - Returns one representative per room type
exports.getAllRooms = async (req, res) => {
  try {
    console.log('=== GET ALL ROOMS ===');
    
    const rooms = await Room.findAll({
      where: {
        status: ['Available', 'Occupied'] // Exclude rooms under maintenance or dirty
      },
      include: [{
        model: RoomImage,
        as: 'images',
        required: false // Left join (rooms without images won't be excluded)
      }],
      order: [['type', 'ASC'], ['base_rate_3hr', 'ASC']] // Order by type, then price
    });

    console.log(`Found ${rooms.length} physical rooms in database`);

    // Group rooms by type and return only one representative per type
    const roomsByType = {};
    
    rooms.forEach(room => {
      const type = room.type;
      // Keep the first room of each type (which will have the lowest rate due to ordering)
      if (!roomsByType[type]) {
        roomsByType[type] = room;
        console.log(`  - Type "${type}": Using ${room.room_number} as representative`);
      }
    });

    console.log(`Grouped into ${Object.keys(roomsByType).length} unique room types`);

    // Format rooms for frontend - generic slugs per type
    const formattedRooms = Object.values(roomsByType).map(room => {
      const genericSlug = room.type.toLowerCase() + '-room';
      
      return {
        id: genericSlug,              // ✅ Generic slug (e.g., "standard-room")
        name: `${room.type} Room`,    // ✅ Generic name (e.g., "Standard Room")
        slug: genericSlug,
        tagline: room.tagline || '',
        description: room.description || '',
        capacity: room.capacity || '2 Adults',
        size: room.size || '25m²',
        rates: {
          '3h': parseFloat(room.base_rate_3hr),
          '6h': parseFloat(room.base_rate_6hr),
          '12h': parseFloat(room.base_rate_12hr),
          '24h': parseFloat(room.base_rate_24hr)
        },
        amenities: room.amenities || [],
        image: room.image || 'bg-gray-300',
        images: room.images ? room.images.map(img => ({
          id: img.image_id,
          path: img.image_path,
          isPrimary: img.is_primary
        })) : [],
        type: room.type
      };
    });

    console.log(`Returning ${formattedRooms.length} room type(s) to frontend`);
    formattedRooms.forEach(r => console.log(`  - ${r.id} (${r.name})`));

    res.status(200).json({
      success: true,
      rooms: formattedRooms
    });
  } catch (error) {
    console.error('Get all rooms error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get room by slug or ID - Accepts generic slugs (e.g., "standard-room")
exports.getRoomBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Map generic slug to room type
    const slugToType = {
      'value-room': 'Value',
      'standard-room': 'Standard',
      'deluxe-room': 'Deluxe',
      'superior-room': 'Superior',
      'suite-room': 'Suite'
    };

    let room;
    
    // First, try to find by the exact slug (for backward compatibility)
    room = await Room.findOne({
      where: { slug },
      include: [{
        model: RoomImage,
        as: 'images',
        required: false
      }]
    });

    // If not found, try to map generic slug to type
    if (!room && slugToType[slug]) {
      room = await Room.findOne({
        where: { type: slugToType[slug] },
        include: [{
          model: RoomImage,
          as: 'images',
          required: false
        }]
      });
    }

    // If still not found, try direct type match
    if (!room) {
      const type = slug.charAt(0).toUpperCase() + slug.slice(1).replace('-room', '');
      room = await Room.findOne({
        where: { type: type },
        include: [{
          model: RoomImage,
          as: 'images',
          required: false
        }]
      });
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Format room for frontend with generic slug
    const genericSlug = room.type.toLowerCase() + '-room';
    
    const formattedRoom = {
      id: genericSlug,
      name: `${room.type} Room`,
      slug: genericSlug,
      tagline: room.tagline || '',
      description: room.description || '',
      capacity: room.capacity || '2 Adults',
      size: room.size || '25m²',
      rates: {
        '3h': parseFloat(room.base_rate_3hr),
        '6h': parseFloat(room.base_rate_6hr),
        '12h': parseFloat(room.base_rate_12hr),
        '24h': parseFloat(room.base_rate_24hr)
      },
      amenities: room.amenities || [],
      image: room.image || 'bg-gray-300',
      images: room.images ? room.images.map(img => ({
        id: img.image_id,
        path: img.image_path,
        isPrimary: img.is_primary
      })) : [],
      type: room.type
    };

    res.status(200).json({
      success: true,
      room: formattedRoom
    });
  } catch (error) {
    console.error('Get room by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get available rooms (for booking)
exports.getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: {
        status: 'Available'
      },
      include: [{
        model: RoomImage,
        as: 'images',
        required: false
      }],
      order: [['base_rate_3hr', 'ASC']]
    });

    const formattedRooms = rooms.map(room => ({
      id: room.slug || room.type.toLowerCase(),
      name: room.name || `${room.type} Room`,
      slug: room.slug || room.type.toLowerCase(),
      type: room.type,
      rates: {
        '3h': parseFloat(room.base_rate_3hr),
        '6h': parseFloat(room.base_rate_6hr),
        '12h': parseFloat(room.base_rate_12hr),
        '24h': parseFloat(room.base_rate_24hr)
      },
      roomNumber: room.room_number,
      images: room.images ? room.images.map(img => ({
        id: img.image_id,
        path: img.image_path,
        isPrimary: img.is_primary
      })) : []
    }));

    res.status(200).json({
      success: true,
      rooms: formattedRooms
    });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Check room availability - Finds ALL available physical rooms of the requested type
exports.checkAvailability = async (req, res) => {
  try {
    console.log('=== CHECK AVAILABILITY ===');
    
    // 🧹 SELF-CLEANING: Auto-sweep stale bookings before checking availability
    await cleanUpStaleBookingsInternal();

    const { slug } = req.params;
    const { checkInDate, checkInTime, duration } = req.query;

    console.log(`Requested slug: ${slug}`);
    console.log(`Check-in: ${checkInDate} ${checkInTime}, Duration: ${duration}`);

    // Validate required parameters
    if (!checkInDate || !checkInTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: checkInDate, checkInTime, duration'
      });
    }

    // Validate 5-minute increment rule
    const [hours, minutes] = checkInTime.split(':').map(Number);
    if (minutes % 5 !== 0) {
      return res.status(400).json({
        success: false,
        message: 'Check-in time must be in 5-minute increments (e.g., 14:00, 14:05, 14:10)'
      });
    }

    // Map generic slug to room type
    const slugToType = {
      'value-room': 'Value',
      'standard-room': 'Standard',
      'deluxe-room': 'Deluxe',
      'superior-room': 'Superior',
      'suite-room': 'Suite'
    };

    let roomType = slugToType[slug];
    
    // If slug not in map, try to extract type from slug
    if (!roomType) {
      roomType = slug.charAt(0).toUpperCase() + slug.slice(1).replace('-room', '');
    }

    // Find ALL physical rooms of this type
    const roomsOfType = await Room.findAll({
      where: { 
        type: roomType,
        status: ['Available', 'Occupied'] // Exclude maintenance/dirty rooms
      }
    });

    console.log(`Found ${roomsOfType.length} physical rooms of type "${roomType}"`);

    if (roomsOfType.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room type not found'
      });
    }

    // Parse duration to hours
    const durationHours = parseInt(duration.replace('h', ''));
    
    // Create check-in and check-out datetime
    const checkIn = new Date(`${checkInDate}T${checkInTime}`);
    const checkOut = new Date(checkIn.getTime() + (durationHours * 60 * 60 * 1000));

    // Get Booking model
    const Booking = sequelize.models.Booking || require('../models/Booking');
    const CLEANING_GAP_MINUTES = 30;

    // Collect ALL available rooms (not just the first one)
    const availableRooms = [];

    console.log(`Checking availability for each physical room...`);

    for (const room of roomsOfType) {
      // Check if room is currently locked (soft lock)
      if (room.lock_expiration && new Date(room.lock_expiration) > new Date()) {
        console.log(`  - Room ${room.room_number}: LOCKED (expires ${room.lock_expiration})`);
        continue; // Skip this room, try next
      }

      // Check for conflicting bookings for this specific physical room
      const conflictingBookings = await Booking.findAll({
        where: {
          room_id: room.room_id,
          status: {
            [Op.in]: ['Pending_Payment', 'Confirmed', 'Checked_In']
          }
        }
      });

      // Check each existing booking for conflicts, accounting for 30-min cleaning time
      let hasConflict = false;
      for (const booking of conflictingBookings) {
        const existingCheckIn = new Date(booking.check_in_time);
        const existingCheckOut = new Date(booking.check_out_time);
        
        // Add 30-minute cleaning buffer to checkout time
        const existingCheckOutWithCleaning = new Date(existingCheckOut.getTime() + CLEANING_GAP_MINUTES * 60000);
        
        // Check for overlap:
        // 1. New booking starts before existing ends (with cleaning)
        // 2. New booking ends after existing starts
        const hasOverlap = (
          checkIn < existingCheckOutWithCleaning && 
          checkOut > existingCheckIn
        );
        
        if (hasOverlap) {
          hasConflict = true;
          break;
        }
      }

      // If no conflict found, add this room to available list
      if (!hasConflict) {
        availableRooms.push({
          id: room.room_id,              // Physical room database ID for booking
          number: room.room_number,      // Display number (e.g., "201S")
          name: room.name                // Full name (e.g., "Standard Room 201S")
        });
        console.log(`  - Room ${room.room_number}: AVAILABLE ✓`);
      } else {
        console.log(`  - Room ${room.room_number}: BOOKED (conflict found)`);
      }
    }

    console.log(`Result: ${availableRooms.length} room(s) available`);

    // Get a representative room for display info (first one of the type)
    const representativeRoom = roomsOfType[0];
    const genericSlug = representativeRoom.type.toLowerCase() + '-room';

    // Return availability status with ALL available rooms
    if (availableRooms.length > 0) {
      res.status(200).json({
        success: true,
        available: true,
        message: `${availableRooms.length} ${representativeRoom.type} Room${availableRooms.length > 1 ? 's' : ''} available for your selected time!`,
        availableRooms: availableRooms, // ✅ Array with { id, number, name }
        roomId: availableRooms[0].id, // First available room ID (for backward compatibility)
        room: {
          id: genericSlug,
          name: `${representativeRoom.type} Room`,
          type: representativeRoom.type,
          image: representativeRoom.image,
          rates: {
            '3h': parseFloat(representativeRoom.base_rate_3hr),
            '6h': parseFloat(representativeRoom.base_rate_6hr),
            '12h': parseFloat(representativeRoom.base_rate_12hr),
            '24h': parseFloat(representativeRoom.base_rate_24hr)
          },
          capacity: representativeRoom.capacity,
          tagline: representativeRoom.tagline
        },
        booking: {
          checkInDate,
          checkInTime,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          duration,
          durationHours
        }
      });
    } else {
      res.status(200).json({
        success: true,
        available: false,
        message: `All ${representativeRoom.type} rooms are fully booked for the selected time. Please note: rooms require a 30-minute cleaning period between bookings.`,
        availableRooms: [], // Empty list
        room: {
          id: genericSlug,
          name: `${representativeRoom.type} Room`,
          type: representativeRoom.type,
          image: representativeRoom.image
        },
        booking: {
          checkInDate,
          checkInTime,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          duration,
          durationHours
        }
      });
    }
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking availability.'
    });
  }
};
