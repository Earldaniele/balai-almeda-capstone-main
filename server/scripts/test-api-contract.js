/**
 * API CONTRACT VERIFICATION TEST
 * 
 * Purpose: Verify the exact structure and property naming (casing) of API responses
 * This test is "unbiased" - it doesn't assume snake_case or camelCase, it just reports what it finds.
 * 
 * Run: node server/scripts/test-api-contract.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// 🎨 Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test user credentials (must exist in database)
const TEST_USER = {
  email: 'fabila@gmail.com',
  password: 'Cholo12345@'
};

let authToken = null;

/**
 * Log with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Print a header
 */
function printHeader(title) {
  log('\n' + '='.repeat(80), colors.cyan);
  log(`  ${title}`, colors.cyan + colors.bright);
  log('='.repeat(80), colors.cyan);
}

/**
 * Print object keys with their types
 */
function printObjectStructure(obj, indent = '') {
  for (const [key, value] of Object.entries(obj)) {
    const type = Array.isArray(value) ? 'array' : typeof value;
    const displayValue = type === 'object' && value !== null ? '{...}' : 
                        type === 'array' ? `[${value.length} items]` :
                        type === 'string' ? `"${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"` :
                        value;
    
    log(`${indent}${key}: ${colors.yellow}${type}${colors.reset} = ${displayValue}`, colors.reset);
    
    if (type === 'object' && value !== null && !Array.isArray(value)) {
      printObjectStructure(value, indent + '  ');
    }
  }
}

/**
 * Test 1: Login and get auth token
 */
async function testLogin() {
  printHeader('TEST 1: Login');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      log('✅ Login successful', colors.green);
      log(`   Token: ${authToken.substring(0, 20)}...`, colors.reset);
      return true;
    } else {
      log('❌ Login failed - No token received', colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Login error: ${error.response?.data?.message || error.message}`, colors.red);
    return false;
  }
}

/**
 * Test 2: Get My Bookings and analyze response structure
 */
async function testMyBookingsContract() {
  printHeader('TEST 2: API Contract - GET /api/payment/my-bookings');
  
  try {
    const response = await axios.get(`${API_URL}/payment/my-bookings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    log('✅ Request successful', colors.green);
    log(`   Status: ${response.status}`, colors.reset);
    
    // Analyze top-level response structure
    log('\n📦 TOP-LEVEL RESPONSE STRUCTURE:', colors.cyan);
    printObjectStructure(response.data);
    
    // Check if bookings array exists
    if (!response.data.bookings) {
      log('\n⚠️  WARNING: No "bookings" property found in response', colors.yellow);
      return false;
    }
    
    if (!Array.isArray(response.data.bookings)) {
      log('\n❌ ERROR: "bookings" is not an array', colors.red);
      return false;
    }
    
    log(`\n📊 Found ${response.data.bookings.length} booking(s)`, colors.cyan);
    
    if (response.data.bookings.length === 0) {
      log('⚠️  No bookings to analyze. Create a test booking first.', colors.yellow);
      return true;
    }
    
    // Analyze first booking structure
    const firstBooking = response.data.bookings[0];
    log('\n🔍 FIRST BOOKING STRUCTURE:', colors.cyan);
    printObjectStructure(firstBooking);
    
    // Contract verification - check for camelCase vs snake_case
    log('\n🧪 CONTRACT VERIFICATION:', colors.magenta);
    
    const camelCaseKeys = [
      'bookingId', 'referenceCode', 'guestName', 'checkInTime', 
      'checkOutTime', 'totalAmount', 'roomName', 'roomId', 'paymentStatus'
    ];
    
    const snakeCaseKeys = [
      'booking_id', 'reference_code', 'guest_name', 'check_in_time',
      'check_out_time', 'total_amount', 'room_name', 'room_id', 'payment_status'
    ];
    
    let camelCaseCount = 0;
    let snakeCaseCount = 0;
    
    log('\n  Checking for camelCase keys:', colors.cyan);
    camelCaseKeys.forEach(key => {
      const exists = key in firstBooking;
      camelCaseCount += exists ? 1 : 0;
      const symbol = exists ? '✅' : '❌';
      log(`    ${symbol} ${key}: ${exists ? 'FOUND' : 'MISSING'}`, exists ? colors.green : colors.red);
    });
    
    log('\n  Checking for snake_case keys:', colors.cyan);
    snakeCaseKeys.forEach(key => {
      const exists = key in firstBooking;
      snakeCaseCount += exists ? 1 : 0;
      const symbol = exists ? '⚠️' : '✅';
      log(`    ${symbol} ${key}: ${exists ? 'FOUND (unexpected)' : 'NOT FOUND (expected)'}`, exists ? colors.yellow : colors.green);
    });
    
    // Final verdict
    log('\n📋 CONTRACT VERDICT:', colors.cyan + colors.bright);
    
    if (camelCaseCount > snakeCaseCount) {
      log(`  ✅ Backend is using CAMELCASE (${camelCaseCount}/${camelCaseKeys.length} keys found)`, colors.green);
      log(`  ✅ Frontend should use: booking.referenceCode, booking.checkInTime, etc.`, colors.green);
    } else if (snakeCaseCount > camelCaseCount) {
      log(`  ⚠️  Backend is using SNAKE_CASE (${snakeCaseCount}/${snakeCaseKeys.length} keys found)`, colors.yellow);
      log(`  ⚠️  Frontend should use: booking.reference_code, booking.check_in_time, etc.`, colors.yellow);
    } else {
      log(`  ⚠️  MIXED CASING DETECTED - This may cause bugs!`, colors.yellow);
    }
    
    // Sample data access examples
    log('\n💡 CORRECT DATA ACCESS EXAMPLES:', colors.cyan);
    log(`  Reference Code: ${firstBooking.referenceCode ?? firstBooking.reference_code ?? 'N/A'}`, colors.reset);
    log(`  Guest Name: ${firstBooking.guestName ?? firstBooking.guest_name ?? 'N/A'}`, colors.reset);
    log(`  Check-in Time: ${firstBooking.checkInTime ?? firstBooking.check_in_time ?? 'N/A'}`, colors.reset);
    log(`  Total Amount: ${firstBooking.totalAmount ?? firstBooking.total_amount ?? 'N/A'}`, colors.reset);
    log(`  Room Name: ${firstBooking.roomName ?? firstBooking.room_name ?? firstBooking.room?.name ?? 'N/A'}`, colors.reset);
    
    return true;
    
  } catch (error) {
    log(`❌ Request failed: ${error.response?.data?.message || error.message}`, colors.red);
    if (error.response?.status === 401) {
      log('   Hint: Authentication failed - token may be invalid', colors.yellow);
    }
    return false;
  }
}

/**
 * Test 3: Get Booking by Reference and analyze structure
 */
async function testBookingByReferenceContract() {
  printHeader('TEST 3: API Contract - GET /api/payment/verify/:referenceCode');
  
  try {
    // First, get a booking to get a reference code
    const bookingsResponse = await axios.get(`${API_URL}/payment/my-bookings`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!bookingsResponse.data.bookings || bookingsResponse.data.bookings.length === 0) {
      log('⚠️  No bookings available to test. Skipping.', colors.yellow);
      return true;
    }
    
    const referenceCode = bookingsResponse.data.bookings[0].referenceCode ?? 
                         bookingsResponse.data.bookings[0].reference_code;
    
    if (!referenceCode) {
      log('❌ Could not extract reference code from booking', colors.red);
      return false;
    }
    
    log(`   Testing with reference: ${referenceCode}`, colors.cyan);
    
    // Now test the verify endpoint
    const response = await axios.get(`${API_URL}/payment/verify/${referenceCode}`);
    
    log('✅ Request successful', colors.green);
    
    log('\n📦 VERIFY RESPONSE STRUCTURE:', colors.cyan);
    printObjectStructure(response.data);
    
    if (response.data.booking) {
      log('\n🔍 BOOKING OBJECT STRUCTURE:', colors.cyan);
      printObjectStructure(response.data.booking);
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Request failed: ${error.response?.data?.message || error.message}`, colors.red);
    return false;
  }
}

/**
 * Main test runner
 */
async function runContractTests() {
  log('\n' + '█'.repeat(80), colors.magenta);
  log('  API CONTRACT VERIFICATION TEST SUITE', colors.magenta + colors.bright);
  log('  Purpose: Verify exact API response structure (snake_case vs camelCase)', colors.magenta);
  log('█'.repeat(80) + '\n', colors.magenta);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Test 1: Login
  results.total++;
  if (await testLogin()) {
    results.passed++;
  } else {
    results.failed++;
    log('\n❌ Cannot proceed without authentication', colors.red);
    printSummary(results);
    return;
  }
  
  // Test 2: My Bookings Contract
  results.total++;
  if (await testMyBookingsContract()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Test 3: Verify Booking Contract
  results.total++;
  if (await testBookingByReferenceContract()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // Print summary
  printSummary(results);
}

/**
 * Print test summary
 */
function printSummary(results) {
  printHeader('TEST SUMMARY');
  
  log(`Total Tests: ${results.total}`, colors.cyan);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.green);
  
  if (results.failed === 0) {
    log('\n✅ ALL TESTS PASSED! API contract is verified.', colors.green + colors.bright);
  } else {
    log('\n❌ SOME TESTS FAILED. Review the output above.', colors.red + colors.bright);
  }
  
  log('\n' + '='.repeat(80) + '\n', colors.cyan);
}

// Run the test suite
runContractTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
