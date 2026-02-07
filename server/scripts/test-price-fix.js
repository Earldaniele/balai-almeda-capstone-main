/**
 * PRICE MANIPULATION FIX - TEST SCRIPT
 * =====================================
 * 
 * WHAT THIS TESTS:
 * - Verifies that users cannot manipulate booking prices by sending fake totalAmount
 * - Confirms server ALWAYS calculates price from database room rates
 * - Ensures both PayMongo and database use server-calculated prices
 * 
 * VULNERABILITY (BEFORE FIX):
 * - Client could send totalAmount: 1.00 and book a ₱1500 room for ₱1
 * - Payment gateway would charge ₱1, database would store ₱1
 * - Result: Massive revenue loss
 * 
 * FIX:
 * - Server ignores ANY totalAmount from client
 * - Fetches room from database
 * - Calculates price based on room's base_rate_XXh field
 * - Uses ONLY server-calculated price for both PayMongo and DB
 * - Logs manipulation attempts for security audit
 * 
 * HOW TO RUN:
 *   node server/scripts/test-price-fix.js
 * 
 * EXPECTED RESULT:
 *   ✅ All tests PASS (green)
 *   ⛔ Any FAIL (red) = vulnerability still exists
 */

const http = require('http');
const https = require('https');

// ANSI Color Codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Test Configuration
const API_BASE = process.env.API_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'test_price@example.com',
  password: 'TestPassword123!',
  firstName: 'Price',
  lastName: 'Tester',
  phone: '09123456789',
  address: 'Test Address'
};

let authToken = null;
let testUserId = null;

// Helper: HTTP Request
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Helper: Print Result
function printResult(testName, passed, details = '') {
  const icon = passed ? '✅' : '⛔';
  const color = passed ? GREEN : RED;
  console.log(`${color}${icon} ${testName}${RESET}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Step 1: Register Test User
async function registerTestUser() {
  console.log(`\n${BLUE}${BOLD}=== STEP 1: Register Test User ===${RESET}`);
  
  try {
    const res = await makeRequest('POST', '/api/auth/signup', TEST_USER);
    
    if (res.status === 201 || res.status === 200) {
      authToken = res.data.token;
      testUserId = res.data.userId || res.data.user?.id;
      printResult('Test user registered', true, `User ID: ${testUserId}`);
      return true;
    } else if (res.status === 400 && res.data.message?.includes('already')) {
      // User already exists, try to login
      console.log(`${YELLOW}ℹ User exists, logging in...${RESET}`);
      return await loginTestUser();
    } else {
      printResult('Test user registration', false, `Status: ${res.status}, ${JSON.stringify(res.data)}`);
      return false;
    }
  } catch (error) {
    printResult('Test user registration', false, error.message);
    return false;
  }
}

// Step 1b: Login Test User
async function loginTestUser() {
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (res.status === 200) {
      authToken = res.data.token;
      testUserId = res.data.userId || res.data.user?.id;
      printResult('Test user login', true, `User ID: ${testUserId}`);
      return true;
    } else {
      printResult('Test user login', false, `Status: ${res.status}`);
      return false;
    }
  } catch (error) {
    printResult('Test user login', false, error.message);
    return false;
  }
}

// Step 2: Test Price Manipulation Attack
async function testPriceManipulation() {
  console.log(`\n${BLUE}${BOLD}=== STEP 2: Test Price Manipulation Attack ===${RESET}`);
  
  // Prepare a booking request with MANIPULATED price
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + 2);
  const dateStr = checkInDate.toISOString().split('T')[0];
  
  const maliciousBooking = {
    roomSlug: 'deluxe-room',
    checkInDate: dateStr,
    checkInTime: '14:00',
    duration: '12',
    totalAmount: 1.00, // 🚨 ATTACK: Trying to book a ₱1500+ room for ₱1
    guestInfo: {
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      email: TEST_USER.email,
      phone: TEST_USER.phone,
      guestId: testUserId
    }
  };

  console.log(`${YELLOW}⚠️  Attempting price manipulation:${RESET}`);
  console.log(`   Sending totalAmount: ₱${maliciousBooking.totalAmount} (fake)`);
  console.log(`   Expected real price: ~₱1500+ (12h Deluxe room)`);

  try {
    const res = await makeRequest('POST', '/api/payment/create-checkout', maliciousBooking, authToken);
    
    if (res.status === 200 && res.data.success) {
      // Checkout was created - now verify the ACTUAL price used
      const referenceCode = res.data.referenceCode;
      console.log(`   Checkout created: ${referenceCode}`);
      
      // Wait a bit for DB write
      await new Promise(r => setTimeout(r, 1000));
      
      // Fetch the booking from database to check stored price
      const bookingRes = await makeRequest('GET', `/api/payment/booking/${referenceCode}`, null, authToken);
      
      if (bookingRes.status === 200) {
        const actualPrice = parseFloat(bookingRes.data.booking.totalAmount);
        console.log(`   Server-calculated price: ₱${actualPrice}`);
        
        // PASS if actual price is NOT the manipulated ₱1, but the real room rate (₱1500+)
        const wasManipulated = (actualPrice === 1.00);
        const isRealisticPrice = (actualPrice >= 1000); // Deluxe 12h should be ~₱1500+
        
        if (!wasManipulated && isRealisticPrice) {
          printResult(
            'Price manipulation BLOCKED',
            true,
            `Server enforced ₱${actualPrice} (ignored client's ₱1.00)`
          );
          return true;
        } else {
          printResult(
            'Price manipulation BLOCKED',
            false,
            `Server used ₱${actualPrice} - SHOULD be ~₱1500, NOT ₱1`
          );
          return false;
        }
      } else {
        printResult('Fetch booking for verification', false, `Status: ${bookingRes.status}`);
        return false;
      }
    } else {
      printResult('Create checkout with fake price', false, `Status: ${res.status}, ${JSON.stringify(res.data)}`);
      return false;
    }
  } catch (error) {
    printResult('Price manipulation test', false, error.message);
    return false;
  }
}

// Step 3: Test Zero Price Attack
async function testZeroPriceAttack() {
  console.log(`\n${BLUE}${BOLD}=== STEP 3: Test Zero Price Attack ===${RESET}`);
  
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + 3);
  const dateStr = checkInDate.toISOString().split('T')[0];
  
  const zeroPriceBooking = {
    roomSlug: 'standard-room',
    checkInDate: dateStr,
    checkInTime: '10:00',
    duration: '6',
    totalAmount: 0, // 🚨 ATTACK: Trying to book for free
    guestInfo: {
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      email: TEST_USER.email,
      phone: TEST_USER.phone,
      guestId: testUserId
    }
  };

  console.log(`${YELLOW}⚠️  Attempting zero-price attack:${RESET}`);
  console.log(`   Sending totalAmount: ₱${zeroPriceBooking.totalAmount} (free)`);

  try {
    const res = await makeRequest('POST', '/api/payment/create-checkout', zeroPriceBooking, authToken);
    
    if (res.status === 200 && res.data.success) {
      const referenceCode = res.data.referenceCode;
      await new Promise(r => setTimeout(r, 1000));
      
      const bookingRes = await makeRequest('GET', `/api/payment/booking/${referenceCode}`, null, authToken);
      
      if (bookingRes.status === 200) {
        const actualPrice = parseFloat(bookingRes.data.booking.totalAmount);
        
        const isZero = (actualPrice === 0);
        const isPositive = (actualPrice > 0);
        
        if (!isZero && isPositive) {
          printResult(
            'Zero-price attack BLOCKED',
            true,
            `Server enforced ₱${actualPrice} (ignored client's ₱0)`
          );
          return true;
        } else {
          printResult(
            'Zero-price attack BLOCKED',
            false,
            `Server allowed ₱${actualPrice} - should be > 0`
          );
          return false;
        }
      } else {
        printResult('Verify zero-price booking', false, `Status: ${bookingRes.status}`);
        return false;
      }
    } else {
      printResult('Create checkout with zero price', false, `Status: ${res.status}`);
      return false;
    }
  } catch (error) {
    printResult('Zero-price attack test', false, error.message);
    return false;
  }
}

// Step 4: Test Negative Price Attack
async function testNegativePriceAttack() {
  console.log(`\n${BLUE}${BOLD}=== STEP 4: Test Negative Price Attack ===${RESET}`);
  
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + 4);
  const dateStr = checkInDate.toISOString().split('T')[0];
  
  const negativeBooking = {
    roomSlug: 'value-room',
    checkInDate: dateStr,
    checkInTime: '16:00',
    duration: '3',
    totalAmount: -500, // 🚨 ATTACK: Negative price
    guestInfo: {
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      email: TEST_USER.email,
      phone: TEST_USER.phone,
      guestId: testUserId
    }
  };

  console.log(`${YELLOW}⚠️  Attempting negative price attack:${RESET}`);
  console.log(`   Sending totalAmount: ₱${negativeBooking.totalAmount} (negative)`);

  try {
    const res = await makeRequest('POST', '/api/payment/create-checkout', negativeBooking, authToken);
    
    if (res.status === 200 && res.data.success) {
      const referenceCode = res.data.referenceCode;
      await new Promise(r => setTimeout(r, 1000));
      
      const bookingRes = await makeRequest('GET', `/api/payment/booking/${referenceCode}`, null, authToken);
      
      if (bookingRes.status === 200) {
        const actualPrice = parseFloat(bookingRes.data.booking.totalAmount);
        
        const isNegative = (actualPrice < 0);
        const isPositive = (actualPrice > 0);
        
        if (!isNegative && isPositive) {
          printResult(
            'Negative price attack BLOCKED',
            true,
            `Server enforced ₱${actualPrice} (ignored client's ₱-500)`
          );
          return true;
        } else {
          printResult(
            'Negative price attack BLOCKED',
            false,
            `Server used ₱${actualPrice} - should be positive, not negative`
          );
          return false;
        }
      } else {
        printResult('Verify negative price booking', false, `Status: ${bookingRes.status}`);
        return false;
      }
    } else {
      printResult('Create checkout with negative price', false, `Status: ${res.status}`);
      return false;
    }
  } catch (error) {
    printResult('Negative price attack test', false, error.message);
    return false;
  }
}

// Main Test Runner
async function runTests() {
  console.log(`${BOLD}${BLUE}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         PRICE MANIPULATION FIX - SECURITY TEST             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(RESET);
  
  console.log(`${YELLOW}Testing against: ${API_BASE}${RESET}\n`);

  const results = [];

  // Step 1: Setup
  const setupSuccess = await registerTestUser();
  if (!setupSuccess) {
    console.log(`\n${RED}${BOLD}❌ SETUP FAILED - Cannot continue tests${RESET}`);
    process.exit(1);
  }

  // Step 2-4: Run attack tests
  results.push(await testPriceManipulation());
  results.push(await testZeroPriceAttack());
  results.push(await testNegativePriceAttack());

  // Final Report
  console.log(`\n${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗`);
  console.log('║                      FINAL RESULTS                         ║');
  console.log(`╚════════════════════════════════════════════════════════════╝${RESET}\n`);

  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  const total = results.length;

  console.log(`${BOLD}Tests Passed: ${GREEN}${passed}/${total}${RESET}`);
  console.log(`${BOLD}Tests Failed: ${RED}${failed}/${total}${RESET}\n`);

  if (failed === 0) {
    console.log(`${GREEN}${BOLD}✅✅✅ ALL TESTS PASSED ✅✅✅${RESET}`);
    console.log(`${GREEN}Price manipulation vulnerability is FIXED!${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}⛔⛔⛔ TESTS FAILED ⛔⛔⛔${RESET}`);
    console.log(`${RED}Price manipulation vulnerability still exists!${RESET}\n`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${RED}${BOLD}Fatal error:${RESET}`, error);
  process.exit(1);
});
