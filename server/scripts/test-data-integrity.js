/**
 * 🧪 DATA INTEGRITY & UX TEST SUITE
 * 
 * Tests Section 3.3 (Date Boundaries) and Section 2.8 (Centralized Error Handling)
 * 
 * This is an UNBIASED test script that verifies:
 * 1. Cannot book dates in the past (with 5-min grace period)
 * 2. Cannot book beyond 1 year in advance
 * 3. 404 errors return proper JSON format
 * 4. All errors follow consistent error response format
 * 
 * Run: node server/scripts/test-data-integrity.js
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// 🎨 Console colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

// Test user credentials (must exist in database)
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'TestPassword123!'
};

let authToken = null;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Helper: Print test result
 */
function logTest(testName, passed, expected, actual) {
  const status = passed 
    ? `${colors.green}✅ PASS${colors.reset}` 
    : `${colors.red}❌ FAIL${colors.reset}`;
  
  console.log(`\n${status} ${testName}`);
  
  if (!passed) {
    console.log(`${colors.dim}Expected: ${expected}${colors.reset}`);
    console.log(`${colors.dim}Actual: ${actual}${colors.reset}`);
  }
  
  results.tests.push({ name: testName, passed });
  if (passed) results.passed++;
  else results.failed++;
}

/**
 * Helper: Format date for API (YYYY-MM-DD)
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Helper: Format time for API (HH:MM) with 5-minute rounding
 */
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  // Round to nearest 5-minute increment
  const minutes = Math.round(date.getMinutes() / 5) * 5;
  const roundedMinutes = String(minutes).padStart(2, '0');
  return `${hours}:${roundedMinutes}`;
}

/**
 * Test 1: Login to get auth token
 */
async function testLogin() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 1: Authentication${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    
    if (response.data.token) {
      authToken = response.data.token;
      logTest('Login successful', true, 'JWT token', 'JWT token received');
      return true;
    } else {
      logTest('Login successful', false, 'JWT token', 'No token received');
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Login failed: ${error.response?.data?.message || error.message}${colors.reset}`);
    console.error(`${colors.yellow}⚠️  Please ensure test user exists with credentials:${colors.reset}`);
    console.error(`   Email: ${TEST_USER.email}`);
    console.error(`   Password: ${TEST_USER.password}`);
    return false;
  }
}

/**
 * Test 2: Booking with past date (should fail with 400)
 */
async function testPastDateBooking() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 2: Past Date Validation${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  
  // Create a date 1 hour in the past
  const pastDate = new Date();
  pastDate.setHours(pastDate.getHours() - 1);
  
  const bookingData = {
    roomSlug: 'deluxe-room',
    checkInDate: formatDate(pastDate),
    checkInTime: formatTime(pastDate),
    duration: '3',
    guestInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+63 912 345 6789'
    }
  };
  
  console.log(`${colors.dim}Attempting to book: ${bookingData.checkInDate} ${bookingData.checkInTime}${colors.reset}`);
  
  try {
    const response = await axios.post(
      `${API_URL}/payment/create-checkout`,
      bookingData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    // If we get here, the API accepted a past date (FAIL)
    logTest(
      'Reject past date booking',
      false,
      '400 Bad Request with "Cannot book dates in the past"',
      `${response.status} - Booking was accepted (security issue!)`
    );
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    
    const isPassed = 
      status === 400 && 
      message && 
      message.toLowerCase().includes('past');
    
    logTest(
      'Reject past date booking',
      isPassed,
      '400 with "Cannot book dates in the past"',
      `${status} - "${message}"`
    );
  }
}

/**
 * Test 3: Booking beyond 1 year (should fail with 400)
 */
async function testFarFutureBooking() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 3: Far Future Validation${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  
  // Create a date 2 years in the future
  const farFuture = new Date();
  farFuture.setFullYear(farFuture.getFullYear() + 2);
  
  const bookingData = {
    roomSlug: 'deluxe-room',
    checkInDate: formatDate(farFuture),
    checkInTime: formatTime(farFuture),
    duration: '3',
    guestInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+63 912 345 6789'
    }
  };
  
  console.log(`${colors.dim}Attempting to book: ${bookingData.checkInDate} ${bookingData.checkInTime}${colors.reset}`);
  
  try {
    const response = await axios.post(
      `${API_URL}/payment/create-checkout`,
      bookingData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    // If we get here, the API accepted a far future date (FAIL)
    logTest(
      'Reject far future booking (>1 year)',
      false,
      '400 Bad Request with "Bookings limited to 1 year"',
      `${response.status} - Booking was accepted (should be limited)`
    );
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    
    const isPassed = 
      status === 400 && 
      message && 
      (message.toLowerCase().includes('1 year') || message.toLowerCase().includes('advance'));
    
    logTest(
      'Reject far future booking (>1 year)',
      isPassed,
      '400 with "Bookings limited to 1 year in advance"',
      `${status} - "${message}"`
    );
  }
}

/**
 * Test 4: 404 Error Format (undefined route)
 */
async function test404ErrorFormat() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 4: 404 Error Response Format${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  
  try {
    await axios.get(`${API_URL}/this-route-does-not-exist`);
    
    // If we get here, route exists (unexpected)
    logTest(
      '404 returns JSON error',
      false,
      '404 with JSON error message',
      '200 - Route exists (unexpected)'
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    const isJSON = data && typeof data === 'object';
    const hasMessage = isJSON && data.message;
    const isPassed = status === 404 && isJSON && hasMessage;
    
    logTest(
      '404 returns JSON error',
      isPassed,
      '404 with JSON {message: "..."}',
      `${status} - ${isJSON ? 'JSON response' : 'Non-JSON response'} - Message: "${data?.message}"`
    );
  }
}

/**
 * Test 5: Valid booking (should succeed)
 */
async function testValidBooking() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 5: Valid Booking (Control Test)${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  
  // Create a valid date (24 hours from now to avoid conflicts)
  const validDate = new Date();
  validDate.setHours(validDate.getHours() + 24);
  // Round to 5-minute increment
  validDate.setMinutes(Math.ceil(validDate.getMinutes() / 5) * 5);
  validDate.setSeconds(0);
  
  const bookingData = {
    roomSlug: 'value-room', // Use Value room to avoid conflicts with other tests
    checkInDate: formatDate(validDate),
    checkInTime: formatTime(validDate),
    duration: '3',
    guestInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+63 912 345 6789'
    }
  };
  
  console.log(`${colors.dim}Attempting to book: ${bookingData.checkInDate} ${bookingData.checkInTime}${colors.reset}`);
  
  try {
    const response = await axios.post(
      `${API_URL}/payment/create-checkout`,
      bookingData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const hasCheckoutUrl = response.data?.checkoutUrl;
    const hasReference = response.data?.referenceCode;
    const isPassed = response.status === 200 && hasCheckoutUrl && hasReference;
    
    logTest(
      'Accept valid booking',
      isPassed,
      '200 with checkoutUrl and referenceCode',
      `${response.status} - ${hasCheckoutUrl ? 'Has checkout URL' : 'Missing URL'} - ${hasReference ? `Ref: ${response.data.referenceCode}` : 'No reference'}`
    );
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    
    logTest(
      'Accept valid booking',
      false,
      '200 Success',
      `${status} - Error: "${message}"`
    );
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║       🧪 DATA INTEGRITY & UX TEST SUITE                   ║${colors.reset}`);
  console.log(`${colors.cyan}║       Testing Date Boundaries & Error Handling           ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.dim}API Base URL: ${BASE_URL}${colors.reset}`);
  
  // Step 1: Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.error(`\n${colors.red}❌ Cannot proceed without authentication${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2-5: Run all data integrity tests
  await testPastDateBooking();
  await testFarFutureBooking();
  await test404ErrorFormat();
  await testValidBooking();
  
  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`Total: ${results.tests.length}`);
  
  if (results.failed === 0) {
    console.log(`\n${colors.green}🎉 ALL TESTS PASSED! Data integrity is solid.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}⚠️  SOME TESTS FAILED. Please review the implementation.${colors.reset}`);
    process.exit(1);
  }
}

// Run the test suite
runTests().catch(error => {
  console.error(`\n${colors.red}❌ Test suite crashed:${colors.reset}`, error.message);
  process.exit(1);
});
