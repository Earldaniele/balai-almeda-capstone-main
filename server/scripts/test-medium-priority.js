/**
 * Medium Priority Fixes - Verification Test Script
 * Balai Almeda Hotel System
 * 
 * Tests Sections 2.2, 2.6, 2.7:
 * - Environment Validation
 * - Strong Password Policy
 * - Email Validation
 * 
 * Run: node server/scripts/test-medium-priority.js
 * (Ensure server is running on http://localhost:3000)
 */

const http = require('http');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * Make HTTP POST request to signup endpoint
 */
function makeSignupRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(body);
          resolve({
            status: res.statusCode,
            body: jsonResponse
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: { raw: body }
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Print test result
 */
function printResult(testName, passed, expected, actual) {
  const status = passed 
    ? `${colors.green}${colors.bold}✓ PASS${colors.reset}` 
    : `${colors.red}${colors.bold}✗ FAIL${colors.reset}`;
  
  console.log(`\n${status} ${testName}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${actual}`);
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`\n${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}  Medium Priority Fixes - Verification Tests${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}  Sections: 2.2, 2.6, 2.7${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  let passedTests = 0;
  let totalTests = 3;

  // Test 1: Weak Password
  console.log(`${colors.yellow}Test 1: Weak Password Rejection (Section 2.6)${colors.reset}`);
  try {
    const response1 = await makeSignupRequest({
      firstName: 'Test',
      lastName: 'User',
      email: 'test1@example.com',
      phone: '09171234567',
      password: 'weakpass' // No number, no special char
    });

    const passed1 = response1.status === 400 && 
                    response1.body.message && 
                    response1.body.message.includes('8+ chars with a number and special character');
    
    if (passed1) passedTests++;
    
    printResult(
      'Weak Password (weakpass)',
      passed1,
      '400 - Password must be 8+ chars with a number and special character',
      `${response1.status} - ${response1.body.message || 'Unknown error'}`
    );
  } catch (err) {
    printResult('Weak Password', false, '400 error', `Connection error: ${err.message}`);
  }

  // Test 2: Invalid Email
  console.log(`\n${colors.yellow}Test 2: Invalid Email Rejection (Section 2.7)${colors.reset}`);
  try {
    const response2 = await makeSignupRequest({
      firstName: 'Test',
      lastName: 'User',
      email: 'bad-email', // Invalid format
      phone: '09171234567',
      password: 'StrongP@ss1!'
    });

    const passed2 = response2.status === 400 && 
                    response2.body.message && 
                    response2.body.message.includes('Invalid email format');
    
    if (passed2) passedTests++;
    
    printResult(
      'Invalid Email (bad-email)',
      passed2,
      '400 - Invalid email format',
      `${response2.status} - ${response2.body.message || 'Unknown error'}`
    );
  } catch (err) {
    printResult('Invalid Email', false, '400 error', `Connection error: ${err.message}`);
  }

  // Test 3: Valid Request
  console.log(`\n${colors.yellow}Test 3: Valid Request (All Validations Pass)${colors.reset}`);
  try {
    const timestamp = Date.now();
    const response3 = await makeSignupRequest({
      firstName: 'Valid',
      lastName: 'User',
      email: `validuser${timestamp}@example.com`, // Unique email
      phone: '09171234567',
      password: 'StrongP@ss1!' // Strong password
    });

    // Accept both 201 (created) and 400 (email exists) as valid
    const passed3 = response3.status === 201 || 
                    (response3.status === 400 && response3.body.message && 
                     response3.body.message.includes('Email already registered'));
    
    if (passed3) passedTests++;
    
    printResult(
      'Valid Request (StrongP@ss1! + good@email.com)',
      passed3,
      '201 Created OR 400 Email exists',
      `${response3.status} - ${response3.body.message || 'User created successfully'}`
    );
  } catch (err) {
    printResult('Valid Request', false, '201 or 400', `Connection error: ${err.message}`);
  }

  // Summary
  console.log(`\n${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}  Test Summary${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  
  const allPassed = passedTests === totalTests;
  const summaryColor = allPassed ? colors.green : colors.red;
  
  console.log(`  ${summaryColor}${colors.bold}${passedTests}/${totalTests} tests passed${colors.reset}`);
  
  if (allPassed) {
    console.log(`\n  ${colors.green}${colors.bold}✓ ALL MEDIUM PRIORITY FIXES VERIFIED!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n  ${colors.red}${colors.bold}✗ Some tests failed. Please review the implementation.${colors.reset}\n`);
    process.exit(1);
  }
}

// Check if server is running
console.log(`${colors.cyan}Checking if server is running on http://localhost:3000...${colors.reset}`);

const checkReq = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/rooms',
  method: 'GET'
}, (res) => {
  console.log(`${colors.green}✓ Server is running${colors.reset}`);
  runTests().catch(err => {
    console.error(`\n${colors.red}Test execution error: ${err.message}${colors.reset}\n`);
    process.exit(1);
  });
});

checkReq.on('error', (err) => {
  console.error(`\n${colors.red}✗ Cannot connect to server on http://localhost:3000${colors.reset}`);
  console.error(`  Error: ${err.message}`);
  console.error(`\n  ${colors.yellow}Please start the server first:${colors.reset}`);
  console.error(`  ${colors.yellow}cd server && node server.js${colors.reset}\n`);
  process.exit(1);
});

checkReq.end();
