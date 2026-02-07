const axios = require('axios');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const AppError = require('../utils/AppError');

// PayMongo API Configuration
const getPayMongoSecretKey = () => {
  const isLive = process.env.PAYMONGO_IS_LIVE === 'true';
  return isLive 
    ? process.env.PAYMONGO_SECRET_KEY_LIVE 
    : process.env.PAYMONGO_TEST_SECRET_KEY;
};

const PAYMONGO_SECRET_KEY = getPayMongoSecretKey();
const PAYMONGO_BASE64_KEY = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';

/**
 * Generate a reference code candidate (internal use)
 * 🔒 COLLISION FIX: Increased random length from 4 to 8 characters
 */
function generateReferenceCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 chars instead of 4
  return `BKG-${timestamp}-${random}`;
}

/**
 * Generate a guaranteed-unique reference code
 * 🔒 COLLISION FIX: Queries database to ensure uniqueness
 * @returns {Promise<string>} A unique reference code
 */
async function generateUniqueReferenceCode() {
  let referenceCode;
  let isUnique = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 10; // Safety limit to prevent infinite loops
  
  do {
    referenceCode = generateReferenceCode();
    
    // Check if this reference code already exists in database
    const existingBooking = await Booking.findOne({
      where: { reference_code: referenceCode },
      attributes: ['reference_code']
    });
    
    isUnique = !existingBooking;
    attempts++;
    
    if (!isUnique) {
      console.warn(`⚠️ Reference code collision detected: ${referenceCode} (attempt ${attempts})`);
    }
    
    // Safety: If we somehow hit max attempts, add extra entropy
    if (attempts >= MAX_ATTEMPTS) {
      console.error(`❌ Max collision retry attempts reached. Adding extra entropy.`);
      const extraRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
      referenceCode = `${referenceCode}-${extraRandom}`;
      break; // Force exit with enhanced code
    }
    
  } while (!isUnique);
  
  if (attempts > 1) {
    console.log(`✅ Generated unique reference code after ${attempts} attempts: ${referenceCode}`);
  }
  
  return referenceCode;
}

/**
 * Check if room is available for the requested time slot
 * Includes 30-minute cleaning gap after checkout
 */
async function checkRoomAvailability(roomId, checkInDateTime, checkOutDateTime) {
  const CLEANING_GAP_MINUTES = 30;
  
  const conflictingBookings = await Booking.findAll({
    where: {
      room_id: roomId,
      status: {
        [Op.in]: ['Pending_Payment', 'Confirmed', 'Checked_In']
      }
    }
  });

  // Check each existing booking for conflicts, accounting for 30-min cleaning time
  for (const booking of conflictingBookings) {
    const existingCheckIn = new Date(booking.check_in_time);
    const existingCheckOut = new Date(booking.check_out_time);
    
    // Add 30-minute cleaning buffer to checkout time
    const existingCheckOutWithCleaning = new Date(existingCheckOut.getTime() + CLEANING_GAP_MINUTES * 60000);
    
    // Check for overlap:
    // 1. New booking starts before existing ends (with cleaning)
    // 2. New booking ends after existing starts
    const hasOverlap = (
      checkInDateTime < existingCheckOutWithCleaning && 
      checkOutDateTime > existingCheckIn
    );
    
    if (hasOverlap) {
      return false; // Room is not available
    }
  }

  return true; // No conflicts found
}

/**
 * Helper function: Find an available room ID for a given room type and time slot
 * Returns the room_id of the first available room, or null if none available
 */
async function findAvailableRoomID(roomType, checkInDateTime, checkOutDateTime) {
  // Find all physical rooms of this type
  const roomsOfType = await Room.findAll({
    where: { 
      type: roomType,
      status: ['Available', 'Occupied'] // Exclude maintenance/dirty rooms
    }
  });

  if (roomsOfType.length === 0) {
    return null; // No rooms of this type exist
  }

  // Loop through each room and check availability
  for (const room of roomsOfType) {
    const isAvailable = await checkRoomAvailability(room.room_id, checkInDateTime, checkOutDateTime);
    if (isAvailable) {
      return room.room_id; // Return the first available room ID
    }
  }

  return null; // No rooms available
}

/**
 * Create PayMongo Checkout Session
 * POST /api/payment/create-checkout
 * 
 * Intelligently assigns an available physical room from the requested room type
 */
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const {
      roomSlug,
      roomId,          // User's manually selected room ID (new parameter)
      selectedRoomId,  // Backward compatibility
      checkInDate,
      checkInTime,
      duration,
      totalAmount,
      guestInfo
    } = req.body;

    console.debug('=== CREATE CHECKOUT SESSION ===');
    console.debug(`Requested room type: ${roomSlug}`);
    
    // � DEBUG: Log the entire request payload to see what frontend sends
    console.log('\n📥 [RAW REQUEST] Full Request Body:', JSON.stringify(req.body, null, 2));
    console.log('📥 [RAW REQUEST] Guest Info:', JSON.stringify(guestInfo, null, 2));
    
    // �🔒 SECURITY FIX: Prevent IDOR - Force guest_id from JWT token
    // Only Admin/Staff can book for other users
    let secureGuestId = req.userId; // Always start with authenticated user's ID
    
    if (guestInfo && guestInfo.guestId && guestInfo.guestId !== 'walk_in') {
      // If a guestId was provided, check if user has permission to use it
      const requestedGuestId = parseInt(guestInfo.guestId);
      
      if (requestedGuestId !== req.userId) {
        // User is trying to book for someone else
        const userRole = req.userRole || 'Guest';
        
        if (userRole === 'Admin' || userRole === 'FrontDesk' || userRole === 'Manager') {
          // Admin/Staff can book for others
          secureGuestId = requestedGuestId;
          console.debug(`🔑 [ADMIN OVERRIDE] ${userRole} booking for guest ID: ${requestedGuestId}`);
        } else {
          // Regular user trying to manipulate guest_id - silently override
          console.log(`⚠️ [SECURITY] User ${req.userId} attempted to book as ${requestedGuestId}. Blocked.`);
          // Don't return error - just use their real ID to prevent enumeration
        }
      }
    }
    
    console.debug(`✅ Secure Guest ID set to: ${secureGuestId}`);
    
    // Support both roomId and selectedRoomId for flexibility
    const userSelectedRoomId = roomId || selectedRoomId;
    
    if (userSelectedRoomId) {
      console.debug(`User manually selected room ID: ${userSelectedRoomId}`);
    } else {
      console.debug(`Auto-assign mode: Will find any available room of type ${roomSlug}`);
    }

    // Validation
    if (!roomSlug || !checkInDate || !checkInTime || !duration || !guestInfo) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // 🔒 SECURITY: Validate duration against allowed values (prevent invalid billing)
    const validDurations = ['3', '6', '12', '24'];
    if (!validDurations.includes(duration.toString())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid duration. Allowed values: 3h, 6h, 12h, 24h' 
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

    // 🔒 DATA INTEGRITY: Date Boundaries (Section 3.3)
    // Construct check-in and check-out times first for validation
    const checkInDateTime = new Date(`${checkInDate}T${checkInTime}`);
    const checkOutDateTime = new Date(checkInDateTime);
    checkOutDateTime.setHours(checkOutDateTime.getHours() + parseInt(duration));

    // Prevent booking in the past (with 5-minute grace period for timezone/clock skew)
    const now = new Date();
    const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
    const cutoffTime = new Date(now.getTime() - GRACE_PERIOD_MS);
    
    if (checkInDateTime < cutoffTime) {
      return next(new AppError('Cannot book dates in the past', 400));
    }

    // Prevent booking too far in the future (1 year maximum)
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (checkInDateTime > oneYearFromNow) {
      return next(new AppError('Bookings limited to 1 year in advance', 400));
    }

    // Map generic slug to room type
    const slugToType = {
      'value-room': 'Value',
      'standard-room': 'Standard',
      'deluxe-room': 'Deluxe',
      'superior-room': 'Superior',
      'suite-room': 'Suite'
    };

    let roomType = slugToType[roomSlug];
    
    // If slug not in map, try to extract type from slug
    if (!roomType) {
      roomType = roomSlug.charAt(0).toUpperCase() + roomSlug.slice(1).replace('-room', '');
    }

    // Find ALL physical rooms of this type
    const roomsOfType = await Room.findAll({
      where: { 
        type: roomType,
        status: ['Available', 'Occupied'] // Exclude maintenance/dirty rooms
      }
    });

    if (roomsOfType.length === 0) {
      return next(new AppError('Room type not found', 404));
    }

    // Date validation is done earlier in the function, dates already constructed
    let availableRoomId;
    let availableRoom;

    // PRIORITY 1: If user manually selected a specific room, verify it's available
    if (userSelectedRoomId) {
      console.debug(`[MANUAL SELECTION] Verifying room ID ${userSelectedRoomId}...`);
      
      // Check if the selected room exists and matches the type
      const selectedRoom = await Room.findOne({
        where: { room_id: parseInt(userSelectedRoomId) }
      });

      if (!selectedRoom) {
        return res.status(400).json({ 
          success: false, 
          message: 'Selected room does not exist.' 
        });
      }

      if (selectedRoom.type !== roomType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Selected room does not match the requested room type.' 
        });
      }

      // Check if the selected room is available for the time slot
      const isAvailable = await checkRoomAvailability(selectedRoom.room_id, checkInDateTime, checkOutDateTime);
      
      if (!isAvailable) {
        return next(new AppError('The selected room is no longer available. Please select a different room or time slot.', 409));
      }

      availableRoomId = selectedRoom.room_id;
      availableRoom = selectedRoom;
      console.debug(`✅ [MANUAL SELECTION] Room ${selectedRoom.room_number} confirmed available`);
    } else {
      // PRIORITY 2: Auto-assign the first available room of the requested type
      console.debug(`[AUTO-ASSIGN] Finding any available ${roomType} room...`);
      availableRoomId = await findAvailableRoomID(roomType, checkInDateTime, checkOutDateTime);
      
      if (!availableRoomId) {
        console.debug(`❌ No available rooms of type ${roomType}`);
        return next(new AppError(`All ${roomType} rooms are fully booked for the selected time. Please note: rooms require a 30-minute cleaning period between bookings.`, 409));
      }

      // Fetch the specific room details for the booking
      availableRoom = await Room.findOne({
        where: { room_id: availableRoomId }
      });

      console.debug(`✅ [AUTO-ASSIGN] Assigned room ${availableRoom.room_number} (${availableRoom.name})`);
    }

    // 🔒 SECURITY FIX: Calculate price SERVER-SIDE (NEVER trust client input)
    // Ignore any totalAmount from request body - always derive from database
    const durationKey = `base_rate_${duration}hr`; // Column names use 'hr' suffix
    const baseRoomPrice = parseFloat(availableRoom[durationKey]);

    if (!baseRoomPrice || isNaN(baseRoomPrice)) {
      console.error(`❌ Invalid rate for duration ${duration}hr: ${availableRoom[durationKey]}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Unable to calculate room rate. Please contact support.' 
      });
    }

    console.log(`💰 [PRICE CALC STEP 1] Base Room Price: ₱${baseRoomPrice}`);

    // 🔒 CHILD POLICY: Extract and validate child data from guestInfo
    let childAddOnPrice = 0; // Initialize to zero

    // --- 1. Extract Counts ---
    let adultsCount = parseInt(guestInfo?.adults) || 1;
    let childrenCount = parseInt(guestInfo?.children) || 0;
    let childAges = [];

    // --- 2. Nuclear Child Age Parser ---
    if (childrenCount > 0 && guestInfo.childAges) {
      // Step A: Force input into a single comma-separated string
      let rawString = '';
      
      if (Array.isArray(guestInfo.childAges)) {
        // Turns ['7,10'] into "7,10" AND [7, 10] into "7,10"
        rawString = guestInfo.childAges.join(','); 
      } else {
        // Turns "7,10" into "7,10"
        rawString = String(guestInfo.childAges);
      }

      // Step B: Clean, Split, and Parse
      childAges = rawString
        .split(',')                 // Split by comma
        .map(s => s.trim())         // Remove whitespace
        .filter(s => s !== '')      // Remove empty strings
        .map(s => parseInt(s))      // Convert to integers
        .filter(n => !isNaN(n));    // Remove invalid numbers
        
      console.log(`👶 Parsed Ages: [${childAges.join(', ')}] (from input: ${JSON.stringify(guestInfo.childAges)})`);
    }

    // --- 3. Safety Validation ---
    // If we have children but parsing failed (or resulted in 0 ages), verify count
    if (childrenCount > 0 && childAges.length !== childrenCount) {
       console.warn(`⚠️ Mismatch detected! Expected ${childrenCount} children, found ${childAges.length} ages.`);
       
       // Fallback: If we have a count but bad data, fill with 0 (Free) to allow booking to proceed
       if (childAges.length === 0) {
         console.warn(`⚠️ Filling with default ages (0) to prevent crash.`);
         childAges = Array(childrenCount).fill(0);
       }
    }

    console.log(`� [GUEST INFO] Adults: ${adultsCount}, Children: ${childrenCount}`);

    // Validate adults count
    if (adultsCount < 1 || adultsCount > 4) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of adults (1-4 allowed)'
      });
    }

    // Validate children count
    if (childrenCount < 0 || childrenCount > 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid number of children (max 2 allowed)'
      });
    }

    // Validate child ages (if provided)
    if (childrenCount > 0 && childAges.length !== childrenCount) {
      console.error(`❌ [VALIDATION] Age count mismatch: expected ${childrenCount}, got ${childAges.length}`);
      return res.status(400).json({
        success: false,
        message: `Children count (${childrenCount}) does not match number of ages provided (${childAges.length})`
      });
    }

    // Validate each age is within 0-13 range
    for (let i = 0; i < childAges.length; i++) {
      const age = childAges[i];
      if (age < 0 || age > 13) {
        console.error(`❌ [VALIDATION] Invalid age: ${age} at index ${i}`);
        return res.status(400).json({
          success: false,
          message: `Child ages must be between 0 and 13 years (got ${age})`
        });
      }
    }

    // 💰 EXPLICIT CHILD FEE CALCULATION
    console.log(`\n💰 [PRICE CALC STEP 2] Calculating child fees...`);
    childAddOnPrice = 0; // Reset to ensure clean calculation
    
    for (let i = 0; i < childAges.length; i++) {
      const age = childAges[i];
      console.log(`   Child ${i + 1}: Age ${age}`);
      
      if (age >= 7 && age <= 13) {
        childAddOnPrice += 150;
        console.log(`      → CHARGEABLE (₱150) | Running total: ₱${childAddOnPrice}`);
      } else {
        console.log(`      → FREE (age 0-6)`);
      }
    }

    if (childrenCount > 0) {
      console.log(`\n👶 [CHILD POLICY SUMMARY]`);
      console.log(`   Total Children: ${childrenCount}`);
      console.log(`   Ages: [${childAges.join(', ')}]`);
      console.log(`   Chargeable Children (7-13): ${childAges.filter(age => age >= 7 && age <= 13).length}`);
      console.log(`   Total Child Add-on Fee: ₱${childAddOnPrice}`);
    } else {
      console.log(`👶 [CHILD POLICY] No children in this booking`);
    }

    // 💰 FINAL PRICE CALCULATION
    const serverCalculatedPrice = baseRoomPrice + childAddOnPrice;

    console.log(`\n💰 [PRICE CALC STEP 3] FINAL CALCULATION:`);
    console.log(`   Base Room Rate: ₱${baseRoomPrice.toFixed(2)}`);
    console.log(`   Child Add-on:   ₱${childAddOnPrice.toFixed(2)}`);
    console.log(`   ─────────────────────────────────`);
    console.log(`   TOTAL:          ₱${serverCalculatedPrice.toFixed(2)}`);
    console.log(`\n🔐 Math Check: { base: ${baseRoomPrice}, childFees: ${childAddOnPrice}, total: ${serverCalculatedPrice} }`);

    // Log if client tried to manipulate price
    if (totalAmount && parseFloat(totalAmount) !== serverCalculatedPrice) {
      console.log(`\n⚠️ [SECURITY] Price manipulation detected!`);
      console.log(`   Client sent:        ₱${parseFloat(totalAmount).toFixed(2)}`);
      console.log(`   Server calculated:  ₱${serverCalculatedPrice.toFixed(2)}`);
      console.log(`   ✅ Enforcing server-calculated price.`);
    }

    // 🔒 COLLISION FIX: Generate guaranteed-unique reference code
    const referenceCode = await generateUniqueReferenceCode();
    const amountInCentavos = Math.round(serverCalculatedPrice * 100);

    const lineItems = [
      {
        name: `${availableRoom.name || availableRoom.type + ' Room'} - ${duration}h`,
        amount: amountInCentavos,
        currency: 'PHP',
        description: `Check-in: ${checkInDate} ${checkInTime}`,
        quantity: 1
      }
    ];

    // 🔒 SECURITY: Dynamic Frontend URL (Section 2.11)
    // Use environment variable with localhost fallback for development
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking-success?reference=${referenceCode}`;

    const checkoutPayload = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: lineItems,
          payment_method_types: ['qrph'],
          description: `Booking Reference: ${referenceCode}`,
          success_url: successUrl,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking?cancelled=true`,
          billing: {
            name: `${guestInfo.firstName} ${guestInfo.lastName}`,
            email: guestInfo.email,
            phone: guestInfo.phone
          },
          metadata: {
            reference_code: referenceCode,
            room_id: availableRoom.room_id.toString(),
            room_number: availableRoom.room_number,
            guest_id: secureGuestId.toString() // 🔒 IDOR FIX: Use JWT-verified ID
          }
        }
      }
    };

    // 🔒 TRANSACTION FIX: Use database transaction to ensure atomicity
    // If PayMongo fails, the booking will be automatically rolled back
    const result = await sequelize.transaction(async (t) => {
      // 🔒 RACE CONDITION FIX (Section 2.12): Pessimistic Locking
      // Lock the room row to prevent concurrent bookings
      const lockedRoom = await Room.findOne({
        where: { room_id: availableRoom.room_id },
        lock: true, // SELECT ... FOR UPDATE - locks the row until transaction completes
        transaction: t
      });

      if (!lockedRoom) {
        throw new Error('Room not found or locked by another transaction');
      }

      // Re-verify availability with the locked room to prevent race conditions
      // This ensures no other transaction can create a booking for this room until we commit
      const isStillAvailable = await checkRoomAvailability(
        lockedRoom.room_id, 
        checkInDateTime, 
        checkOutDateTime
      );

      if (!isStillAvailable) {
        throw new Error('Room is no longer available (booked by another user during your session)');
      }

      console.log(`🔒 Room ${lockedRoom.room_number} locked for booking`);

      // Step 1: Create Pending Booking with the SPECIFIC physical room assigned
      // 🔒 SECURITY: Use secureGuestId (derived from JWT) instead of trusting client input
      const booking = await Booking.create({
        guest_id: secureGuestId, // ✅ IDOR FIX: Always use JWT-verified ID
        room_id: lockedRoom.room_id, // ✅ Use locked room to ensure consistency
        reference_code: referenceCode,
        checkout_session_id: null, // Will be set after PayMongo success
        check_in_time: checkInDateTime,
        check_out_time: checkOutDateTime,
        duration_hours: parseInt(duration),
        adults_count: adultsCount, // ✅ Use validated count from child policy logic
        children_count: childrenCount, // ✅ Use validated count from child policy logic
        child_ages: childrenCount > 0 ? childAges : null, // ✅ Store ages as JSON for verification
        source: 'Web',
        status: 'Pending_Payment',
        total_amount: serverCalculatedPrice // 🔒 PRICE FIX: Always use server-calculated price
      }, { transaction: t });

      console.log(`📝 Pending booking created (in transaction): ${referenceCode}`);
      console.log(`👤 Guest ID: ${secureGuestId} (verified from JWT)`);
      console.log(`🏠 Assigned to: ${lockedRoom.room_number} (Room ID: ${lockedRoom.room_id})`);
      console.log(`�‍👩‍👧‍👦 Guests: ${adultsCount} adult(s), ${childrenCount} child(ren)`);
      if (childrenCount > 0) {
        console.log(`👶 Child Ages Saved: [${childAges.join(', ')}]`);
      }
      console.log(`�💰 Amount: ₱${serverCalculatedPrice} (${duration}h rate - server-verified)`);

      // Step 2: Create PayMongo checkout session
      // If this fails, the transaction will automatically rollback
      let checkoutSession;
      try {
        console.log('⚠️ SENDING PAYMONGO PAYLOAD:', JSON.stringify(checkoutPayload.data.attributes.payment_method_types));
        const response = await axios.post(
          `${PAYMONGO_API_URL}/checkout_sessions`,
          checkoutPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${PAYMONGO_BASE64_KEY}`
            }
          }
        );

        checkoutSession = response.data.data;
        console.log(`✅ PayMongo session created: ${checkoutSession.id}`);
      } catch (paymongoError) {
        console.error('❌ PayMongo API failed:', paymongoError.response?.data || paymongoError.message);
        // Throw error to trigger transaction rollback
        throw new Error('Failed to create PayMongo checkout session');
      }

      // Step 3: Update booking with PayMongo session ID
      await booking.update({
        checkout_session_id: checkoutSession.id
      }, { transaction: t });

      console.log(`💾 Session ID saved to DB: ${checkoutSession.id}`);

      // Return the checkout session for use outside transaction
      return checkoutSession;
    });

    res.status(200).json({
      success: true,
      checkoutUrl: result.attributes.checkout_url,
      referenceCode: referenceCode
    });

  } catch (error) {
    console.error('Create checkout error:', error.response?.data || error.message);
    // Pass to global error handler
    next(new AppError(error.message || 'Failed to create checkout session', 500));
  }
};

/**
 * Handle PayMongo Webhook Events
 * POST /api/payment/webhook
 * 
 * 🔒 SECURITY (Section 2.13): Verifies webhook signature to prevent fake payment confirmations
 * PayMongo sends HMAC SHA256 signature in 'Paymongo-Signature' header
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Step 1: Get the signature from headers
    const signature = req.headers['paymongo-signature'];
    
    if (!signature) {
      console.error('⚠️ SECURITY: Webhook rejected - Missing Paymongo-Signature header');
      return res.status(401).json({ 
        success: false,
        error: 'Missing signature' 
      });
    }

    // Step 2: Get the webhook secret from environment
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ CRITICAL: PAYMONGO_WEBHOOK_SECRET not set in environment');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error' 
      });
    }

    // Step 3: Calculate expected signature using HMAC SHA256
    // req.body is a Buffer (raw bytes) because we used express.raw() middleware
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    // Step 4: Compare signatures using timing-safe comparison (prevents timing attacks)
    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (err) {
      // timingSafeEqual throws if lengths don't match
      console.error('⚠️ SECURITY: Webhook signature length mismatch');
      isValid = false;
    }

    if (!isValid) {
      console.error('⚠️ SECURITY: Webhook rejected - Invalid signature');
      console.error(`   Expected: ${expectedSignature.substring(0, 20)}...`);
      console.error(`   Received: ${signature.substring(0, 20)}...`);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid signature' 
      });
    }

    // Step 5: Signature is valid - parse the webhook payload
    const payload = JSON.parse(req.body.toString());
    console.log('✅ Webhook signature verified successfully');
    console.log('📨 Webhook event:', payload.data?.attributes?.type || 'unknown');

    // Step 6: Process the webhook event
    const eventType = payload.data?.attributes?.type;
    const eventData = payload.data?.attributes?.data;

    if (eventType === 'checkout_session.payment.paid') {
      // Payment was successful
      const checkoutSessionId = eventData?.attributes?.checkout_session_id;
      const referenceCode = eventData?.attributes?.metadata?.reference_code;

      console.log(`💰 Payment confirmed for checkout session: ${checkoutSessionId}`);
      console.log(`📋 Reference code: ${referenceCode}`);

      if (referenceCode) {
        // Update booking status to Confirmed
        const booking = await Booking.findOne({
          where: { reference_code: referenceCode }
        });

        if (booking) {
          await booking.update({ status: 'Confirmed' });
          console.log(`✅ Booking ${referenceCode} confirmed via webhook`);
        } else {
          console.warn(`⚠️ Booking not found for reference: ${referenceCode}`);
        }
      }
    } else if (eventType === 'checkout_session.expired') {
      // Checkout session expired without payment
      const referenceCode = eventData?.attributes?.metadata?.reference_code;
      console.log(`⏰ Checkout session expired: ${referenceCode}`);
      
      if (referenceCode) {
        const booking = await Booking.findOne({
          where: { reference_code: referenceCode }
        });

        if (booking && booking.status === 'Pending_Payment') {
          await booking.update({ status: 'Cancelled' });
          console.log(`❌ Booking ${referenceCode} cancelled (session expired)`);
        }
      }
    } else {
      console.log(`ℹ️ Unhandled webhook event type: ${eventType}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    // Still return 200 to prevent PayMongo from retrying
    res.status(200).json({ received: true, error: error.message });
  }
};

/**
 * Verify Payment Status
 * GET /api/payment/verify/:referenceCode
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { referenceCode } = req.params;

    console.debug(`🔍 Verifying payment for ${referenceCode}...`);

    // 1. Find Booking
    const booking = await Booking.findOne({
      where: { reference_code: referenceCode },
      include: [{ model: Room, as: 'room' }]
    });

    if (!booking) {
      console.error(`❌ Booking not found: ${referenceCode}`);
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // 2. If Pending, ask PayMongo using the saved ID
    if (booking.status === 'Pending_Payment') {
      const sessionId = booking.checkout_session_id;

      if (sessionId) {
        console.debug(`🔍 Checking PayMongo for ${referenceCode} using DB Session ID: ${sessionId}...`);
        
        try {
          const response = await axios.get(
            `${PAYMONGO_API_URL}/checkout_sessions/${sessionId}`,
            { headers: { Authorization: `Basic ${PAYMONGO_BASE64_KEY}` } }
          );

          const attributes = response.data?.data?.attributes;
          const payments = attributes?.payments || [];
          const sessionStatus = attributes?.status; // e.g., 'active', 'expired'

          // LOGGING FOR DEBUGGING
          console.debug(`🧾 Session Status: ${sessionStatus}`);
          console.debug(`🧾 Payments Found: ${payments.length}`);
          if (payments.length > 0) {
             console.debug('Payment Details:', JSON.stringify(payments[0].attributes, null, 2));
          }

          // 3. CHECK FOR PAID STATUS
          // We look for ANY payment in the list that is 'paid'
          const paidPayment = payments.find(p => p.attributes.status === 'paid');

          if (paidPayment) {
            console.debug(`💳 Payment Confirmed! ID: ${paidPayment.id}`);
            await booking.update({ status: 'Confirmed' });
            booking.status = 'Confirmed';
            console.debug(`✅ Database updated to Confirmed.`);
          } else {
            // 4. CHECK FOR FAILED STATUS
            const failedPayment = payments.find(p => p.attributes.status === 'failed');
            const isSessionExpired = sessionStatus === 'expired';

            if (failedPayment || isSessionExpired) {
              if (failedPayment) {
                console.debug(`❌ Payment Failed! ID: ${failedPayment.id}`);
              }
              if (isSessionExpired) {
                console.debug(`⏰ Session Expired!`);
              }
              
              await booking.update({ status: 'Cancelled' });
              booking.status = 'Cancelled';
              console.debug(`🚫 Database updated to Cancelled.`);
            } else {
              console.debug(`⏳ No successful payment found yet. Status remains Pending.`);
            }
          }

        } catch (pmError) {
          console.error('❌ PayMongo Lookup Error:', pmError.message);
          if (pmError.response) {
            console.error('API Error Data:', JSON.stringify(pmError.response.data, null, 2));
          }
        }
      } else {
        console.debug(`⚠️ No checkout_session_id found in database for ${referenceCode}.`);
      }
    } else {
      console.debug(`✓ Booking ${referenceCode} is already ${booking.status}`);
    }

    // 4. Return Response
    const statusMap = {
      'Pending_Payment': 'pending',
      'Confirmed': 'confirmed',
      'Checked_In': 'confirmed',
      'Completed': 'confirmed',
      'Cancelled': 'cancelled'
    };

    res.status(200).json({
      success: true,
      status: statusMap[booking.status],
      booking: {
        referenceCode: booking.reference_code,
        roomName: booking.room?.name,
        checkInTime: booking.check_in_time,
        checkOutTime: booking.check_out_time,
        durationHours: booking.duration_hours,
        totalAmount: booking.total_amount,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Verify Error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

/**
 * Get Booking by Reference
 */
exports.getBookingByReference = async (req, res) => {
  try {
    const { referenceCode } = req.params;
    const booking = await Booking.findOne({
      where: { reference_code: referenceCode },
      include: [{ model: Room, as: 'room' }]
    });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.status(200).json({
      success: true,
      booking: {
        referenceCode: booking.reference_code,
        roomId: booking.room_id,
        roomName: booking.room?.name,
        checkInTime: booking.check_in_time,
        checkOutTime: booking.check_out_time,
        totalAmount: booking.total_amount,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve booking' });
  }
};

/**
 * Get all bookings for authenticated user
 * @route GET /api/payment/my-bookings
 */
const getUserBookings = async (req, res) => {
  try {
    // FIX 1: Use req.userId (from authMiddleware)
    const userId = req.userId;

    const bookings = await Booking.findAll({
      // FIX 2: Use 'guest_id' instead of 'user_id'
      where: { guest_id: userId },
      include: [{
        model: Room,
        as: 'room',
        // FIX 3: Use correct column names from your Room model
        attributes: ['room_id', 'name', 'type', 'slug', 'image', 'base_rate_3hr']
      }],
      order: [['check_in_time', 'DESC']],
      attributes: [
        'booking_id',
        'reference_code',
        'check_in_time',
        'check_out_time',
        'total_amount',
        'status',
        'source',
        'created_at'
      ]
    });

    const formattedBookings = bookings.map(booking => ({
      id: booking.booking_id,
      referenceCode: booking.reference_code,
      roomId: booking.room?.room_id,
      roomName: booking.room?.name,
      roomType: booking.room?.type,
      roomImage: booking.room?.image,
      checkInTime: booking.check_in_time,
      checkOutTime: booking.check_out_time,
      totalAmount: parseFloat(booking.total_amount),
      status: booking.status,
      paymentStatus: (booking.status === 'Confirmed' || booking.status === 'Checked_In') ? 'paid' : 'pending',
      createdAt: booking.created_at
    }));

    res.status(200).json({
      success: true,
      bookings: formattedBookings
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings'
    });
  }
};

exports.getUserBookings = getUserBookings;

/**
 * Internal helper: Clean up stale bookings (abandoned payment sessions)
 * Returns the count of cancelled bookings
 * Can be called internally without req/res
 */
const cleanUpStaleBookingsInternal = async () => {
  const STALE_THRESHOLD_MINUTES = 5;
  
  // Calculate cutoff time (5 minutes ago)
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - STALE_THRESHOLD_MINUTES);

  // Find all pending bookings older than 5 minutes
  const staleBookings = await Booking.findAll({
    where: {
      status: 'Pending_Payment',
      created_at: {
        [Op.lt]: cutoffTime
      }
    },
    include: [{ model: Room, as: 'room', attributes: ['name', 'type'] }]
  });

  if (staleBookings.length === 0) {
    return 0;
  }

  // Update all stale bookings to Cancelled
  await Booking.update(
    { status: 'Cancelled' },
    {
      where: {
        status: 'Pending_Payment',
        created_at: {
          [Op.lt]: cutoffTime
        }
      }
    }
  );

  console.log(`🧹 Auto-cleanup: Cancelled ${staleBookings.length} abandoned booking(s):`);
  staleBookings.forEach(booking => {
    console.log(`   - ${booking.reference_code} (${booking.room?.name || booking.room?.type})`);
  });

  return staleBookings.length;
};

/**
 * Cancel stale bookings (abandoned payment sessions)
 * GET /api/payment/cleanup-stale-bookings
 */
exports.cancelStaleBookings = async (req, res) => {
  try {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 5);

    console.log(`🧹 Starting stale booking cleanup...`);
    console.log(`⏰ Cutoff time: ${cutoffTime.toISOString()}`);

    const cancelledCount = await cleanUpStaleBookingsInternal();

    if (cancelledCount === 0) {
      console.log(`✨ No stale bookings found.`);
      return res.status(200).json({
        success: true,
        message: 'No stale bookings to clean up',
        cancelled: 0
      });
    }

    // Get the list of cancelled bookings for response
    const cancelledBookings = await Booking.findAll({
      where: {
        status: 'Cancelled',
        updated_at: {
          [Op.gte]: new Date(Date.now() - 10000) // Last 10 seconds
        }
      },
      attributes: ['reference_code'],
      limit: cancelledCount
    });

    const referencesCancelled = cancelledBookings.map(b => b.reference_code);

    res.status(200).json({
      success: true,
      message: `Successfully cancelled ${cancelledCount} abandoned booking(s)`,
      cancelled: cancelledCount,
      bookings: referencesCancelled
    });

  } catch (error) {
    console.error('❌ Stale booking cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up stale bookings'
    });
  }
};

// Export the internal helper for use in other controllers
exports.cleanUpStaleBookingsInternal = cleanUpStaleBookingsInternal;