/**
 * IDOR Vulnerability Test Script
 * Tests if guest_id manipulation is properly blocked
 * 
 * Run with: node server/scripts/test-idor-fix.js
 */

const http = require('http');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Configuration
const API_BASE = 'http://localhost:3000/api';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  phone: '09171234567'
};

// Helper: Make HTTP request
function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Helper: Print colored output
function printResult(status, message) {
  const color = status === 'PASS' ? colors.green : colors.red;
  const symbol = status === 'PASS' ? '✓' : '✗';
  console.log(`${color}${colors.bold}${symbol} ${status}: ${message}${colors.reset}`);
}

function printInfo(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

function printHeader(message) {
  console.log(`\n${colors.bold}${colors.blue}═══ ${message} ═══${colors.reset}`);
}

// Main test function
async function runIDORTest() {
  console.log(`${colors.bold}${colors.yellow}
╔════════════════════════════════════════════════════════════╗
║         IDOR VULNERABILITY TEST - GUEST_ID INJECTION       ║
╔════════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    // Step 1: Create or login test user
    printHeader('Step 1: User Authentication');
    printInfo('Attempting to login as test user...');
    
    let loginResponse = await makeRequest('POST', '/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    // If login fails, try to create account
    if (!loginResponse.data.success) {
      printInfo('User not found. Creating test account...');
      
      const signupResponse = await makeRequest('POST', '/auth/signup', TEST_USER);
      
      if (!signupResponse.data.success) {
        printResult('FAIL', `Could not create test user: ${signupResponse.data.message}`);
        process.exit(1);
      }
      
      loginResponse = signupResponse;
    }

    const token = loginResponse.data.token;
    const realUserId = loginResponse.data.user.id;
    
    printResult('PASS', `Authenticated as User ID: ${realUserId}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Get available room for test booking
    printHeader('Step 2: Fetch Available Room');
    printInfo('Requesting room information...');
    
    const roomsResponse = await makeRequest('GET', '/rooms', null);
    
    if (!roomsResponse.data.success || !roomsResponse.data.rooms || roomsResponse.data.rooms.length === 0) {
      printResult('FAIL', 'No rooms available for testing');
      process.exit(1);
    }
    
    const testRoom = roomsResponse.data.rooms[0];
    printResult('PASS', `Using room: ${testRoom.name} (${testRoom.slug})`);

    // Step 3: Attempt IDOR Attack - Try to book as another user
    printHeader('Step 3: IDOR Attack Simulation');
    const FAKE_GUEST_ID = 9999;
    printInfo(`Attempting to create booking with guest_id: ${FAKE_GUEST_ID}`);
    printInfo(`Authenticated user's real ID: ${realUserId}`);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkInDate = tomorrow.toISOString().split('T')[0];
    
    const maliciousBookingRequest = {
      roomSlug: testRoom.slug,
      checkInDate: checkInDate,
      checkInTime: '14:00',
      duration: '3',
      totalAmount: testRoom.rates['3h'],
      guestInfo: {
        guestId: FAKE_GUEST_ID, // 🚨 MALICIOUS: Trying to book as another user
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        email: TEST_USER.email,
        phone: TEST_USER.phone
      }
    };

    console.log(`${colors.yellow}   📤 Sending malicious request with guest_id: ${FAKE_GUEST_ID}${colors.reset}`);
    
    const bookingResponse = await makeRequest(
      'POST',
      '/payment/create-checkout',
      maliciousBookingRequest,
      token
    );

    if (!bookingResponse.data.success) {
      printResult('FAIL', `Booking creation failed: ${bookingResponse.data.message}`);
      process.exit(1);
    }

    const referenceCode = bookingResponse.data.referenceCode;
    printInfo(`Booking created with reference: ${referenceCode}`);

    // Step 4: Verify which guest_id was actually saved
    printHeader('Step 4: Verify Database Entry');
    printInfo('Checking which guest_id was saved in the database...');
    
    // Wait a moment for DB write
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const verifyResponse = await makeRequest('GET', `/payment/booking/${referenceCode}`, null);
    
    if (!verifyResponse.data.success) {
      printResult('FAIL', 'Could not verify booking in database');
      process.exit(1);
    }

    // We can't directly see guest_id from this endpoint, so check via my-bookings
    const myBookingsResponse = await makeRequest('GET', '/payment/my-bookings', null, token);
    
    if (!myBookingsResponse.data.success) {
      printResult('FAIL', 'Could not fetch user bookings');
      process.exit(1);
    }

    const createdBooking = myBookingsResponse.data.bookings.find(
      b => b.referenceCode === referenceCode
    );

    if (!createdBooking) {
      printResult('FAIL', 'Booking not found in user\'s bookings (possible IDOR success)');
      console.log(`${colors.red}   ⚠️  This means the booking was created under guest_id ${FAKE_GUEST_ID}${colors.reset}`);
      console.log(`${colors.red}   ⚠️  SECURITY VULNERABILITY DETECTED!${colors.reset}`);
      process.exit(1);
    }

    // Step 5: Final Verdict
    printHeader('Step 5: Test Results');
    
    console.log(`\n${colors.bold}Expected Behavior:${colors.reset}`);
    console.log(`   The booking should be created under the authenticated user's ID: ${colors.green}${realUserId}${colors.reset}`);
    console.log(`   NOT under the malicious guest_id: ${colors.red}${FAKE_GUEST_ID}${colors.reset}`);
    
    console.log(`\n${colors.bold}Actual Result:${colors.reset}`);
    console.log(`   Booking ${referenceCode} was found in user ${realUserId}'s bookings`);
    
    printResult('PASS', 'IDOR VULNERABILITY FIXED ✓');
    console.log(`${colors.green}   ✓ The server correctly ignored the malicious guest_id${colors.reset}`);
    console.log(`${colors.green}   ✓ Booking was created using the JWT-verified user ID${colors.reset}`);
    console.log(`${colors.green}   ✓ Unauthorized booking on behalf of others is prevented${colors.reset}`);

    console.log(`\n${colors.bold}${colors.green}╔════════════════════════════════════════════════════════════╗`);
    console.log(`║                    SECURITY TEST PASSED                    ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  } catch (error) {
    printResult('FAIL', `Test execution error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runIDORTest();
