const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booking = require('../models/Booking');

// 🔒 SECURITY: JWT Secret (Section 2.1)
// No fallback - server will fail if JWT_SECRET is not set (validated on startup)
const JWT_SECRET = process.env.JWT_SECRET;

// Phone number validation regex for PH mobile numbers
const phoneRegex = /^(09|\+639|639)\d{9}$/;

// 🔒 SECURITY: Email validation regex (Section 2.7)
// Strict RFC 5322 compliant email validation
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * 🔒 SECURITY: Validate password strength (Section 2.6)
 * Enforces strong password policy:
 * - Minimum 8 characters
 * - At least 1 number
 * - At least 1 special character (!@#$%^&*(),.?":{}|<>)
 * 
 * @param {string} password - The password to validate
 * @returns {boolean} True if password meets all requirements
 */
const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return false;
  }
  
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasNumber && hasSpecial;
};

/**
 * 🔒 SECURITY: Validate email format (Section 2.7)
 * Uses strict regex validation to prevent invalid/malicious emails
 * 
 * @param {string} email - The email to validate
 * @returns {boolean} True if email is valid
 */
const validateEmailFormat = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  return emailRegex.test(email.trim());
};

/**
 * Normalize phone number to standard format (09xxxxxxxxx)
 * Accepts: 09xxxxxxxxx, 639xxxxxxxxx, +639xxxxxxxxx
 * Returns: 09xxxxxxxxx
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all spaces, dashes, and parentheses
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Normalize to 09xxxxxxxxx format
  if (cleanPhone.startsWith('+639')) {
    cleanPhone = '0' + cleanPhone.substring(3); // +639171234567 -> 09171234567
  } else if (cleanPhone.startsWith('639')) {
    cleanPhone = '0' + cleanPhone.substring(2); // 639171234567 -> 09171234567
  }
  
  return cleanPhone;
};

/**
 * Validate phone number format
 * Returns true if valid PH mobile number
 */
const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone);
};

// Register a new user
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Trim whitespace from names
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    // 🔒 SECURITY: Email validation (Section 2.7)
    if (!validateEmailFormat(email)) {
      console.warn(`⚠️ SECURITY: Invalid email format attempt: ${email}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Validate name lengths (prevent buffer overflow)
    if (trimmedFirstName.length > 50 || trimmedLastName.length > 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Names must not exceed 50 characters' 
      });
    }

    if (trimmedFirstName.length === 0 || trimmedLastName.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Names cannot be empty' 
      });
    }

    // Validate phone number format
    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number format. Please use a valid PH mobile number (e.g., 0917... or +639...)' 
      });
    }

    // Normalize phone number to 09xxxxxxxxx format
    const normalizedPhone = normalizePhoneNumber(phone);

    // 🔒 SECURITY: Strong password policy (Section 2.6)
    if (!validatePasswordStrength(password)) {
      console.warn(`⚠️ SECURITY: Weak password attempt for email: ${email}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be 8+ chars with a number and special character' 
      });
    }

    // Validate password length (8-64 characters)
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters' 
      });
    }

    if (password.length > 64) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must not exceed 64 characters' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user - Map camelCase input to snake_case database columns
    const user = await User.create({
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      email,
      phone: normalizedPhone,
      password: hashedPassword,
      role: 'Guest'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { firstName, lastName, email, phone } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, and email are required' 
      });
    }

    // Trim whitespace from names
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    // Validate name lengths (prevent buffer overflow)
    if (trimmedFirstName.length > 50 || trimmedLastName.length > 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Names must not exceed 50 characters' 
      });
    }

    if (trimmedFirstName.length === 0 || trimmedLastName.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Names cannot be empty' 
      });
    }

    // Validate phone number if provided
    let normalizedPhone = null;
    if (phone && phone.trim()) {
      if (!validatePhoneNumber(phone)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid phone number format. Please use a valid PH mobile number (e.g., 0917... or +639...)' 
        });
      }
      normalizedPhone = normalizePhoneNumber(phone);
    }

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use by another account' 
        });
      }
    }

    // Update user - Map camelCase to snake_case
    await user.update({
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      email,
      phone: normalizedPhone || user.phone
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Change user password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    // Validate new password strength (8-64 characters)
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 8 characters long' 
      });
    }

    if (newPassword.length > 64) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must not exceed 64 characters' 
      });
    }

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({
      password: hashedPassword
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Get user stats (registration year and total bookings)
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get total bookings count (excluding Cancelled bookings)
    const totalBookings = await Booking.count({
      where: {
        guest_id: userId,
        status: ['Pending_Payment', 'Confirmed', 'Checked_In', 'Completed']
      }
    });

    // Extract registration year from created_at
    const registrationYear = user.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();

    res.status(200).json({
      success: true,
      stats: {
        memberSince: registrationYear,
        totalBookings: totalBookings
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};
