/**
 * Child Fee Calculation Test Script
 * 
 * This script simulates the exact logic used in the server to calculate child fees.
 * Use this to verify the math is working correctly.
 * 
 * Run: node server/scripts/test-child-fee-calculation.js
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function testChildFeeCalculation(testName, basePrice, childAges, expectedTotal) {
  console.log('\n' + '─'.repeat(70));
  log(colors.cyan, `TEST: ${testName}`);
  console.log('─'.repeat(70));
  
  console.log(`Base Room Price: ₱${basePrice}`);
  console.log(`Children: ${childAges.length}`);
  console.log(`Ages: [${childAges.join(', ')}]`);
  console.log('');
  
  // Simulate the exact server logic
  let childAddOnPrice = 0;
  
  for (let i = 0; i < childAges.length; i++) {
    const age = childAges[i];
    console.log(`Child ${i + 1}: Age ${age}`);
    
    if (age >= 7 && age <= 13) {
      childAddOnPrice += 150;
      console.log(`   → CHARGEABLE (₱150) | Running total: ₱${childAddOnPrice}`);
    } else {
      console.log(`   → FREE (age 0-6)`);
    }
  }
  
  const calculatedTotal = basePrice + childAddOnPrice;
  
  console.log('');
  console.log(`💰 CALCULATION:`);
  console.log(`   Base:       ₱${basePrice.toFixed(2)}`);
  console.log(`   Child fees: ₱${childAddOnPrice.toFixed(2)}`);
  console.log(`   ──────────────────────`);
  console.log(`   TOTAL:      ₱${calculatedTotal.toFixed(2)}`);
  console.log('');
  
  if (calculatedTotal === expectedTotal) {
    log(colors.green, `✅ PASS: Total matches expected ₱${expectedTotal.toFixed(2)}`);
    return true;
  } else {
    log(colors.red, `❌ FAIL: Expected ₱${expectedTotal.toFixed(2)}, got ₱${calculatedTotal.toFixed(2)}`);
    return false;
  }
}

function testDataParsing(testName, rawInput, expectedArray) {
  console.log('\n' + '─'.repeat(70));
  log(colors.cyan, `PARSING TEST: ${testName}`);
  console.log('─'.repeat(70));
  
  console.log(`Raw Input:`, rawInput);
  console.log(`Type:`, typeof rawInput);
  
  let childAges = [];
  
  // Simulate the exact server parsing logic
  if (Array.isArray(rawInput)) {
    console.log(`[PARSING] Input is array`);
    childAges = rawInput
      .map(age => {
        const parsed = parseInt(age);
        console.log(`   - Parsing "${age}" → ${parsed}`);
        return parsed;
      })
      .filter(age => !isNaN(age));
  } else if (typeof rawInput === 'string') {
    console.log(`[PARSING] Input is string: "${rawInput}"`);
    childAges = rawInput
      .split(',')
      .map(age => {
        const trimmed = age.trim();
        const parsed = parseInt(trimmed);
        console.log(`   - Parsing "${trimmed}" → ${parsed}`);
        return parsed;
      })
      .filter(age => !isNaN(age));
  } else if (typeof rawInput === 'number') {
    console.log(`[PARSING] Input is number: ${rawInput}`);
    childAges = [parseInt(rawInput)];
  }
  
  console.log(`\nParsed Result:`, childAges);
  console.log(`Expected:`, expectedArray);
  
  const matches = JSON.stringify(childAges) === JSON.stringify(expectedArray);
  
  if (matches) {
    log(colors.green, `✅ PASS: Parsing successful`);
    return true;
  } else {
    log(colors.red, `❌ FAIL: Parsing mismatch`);
    return false;
  }
}

function runAllTests() {
  console.clear();
  log(colors.blue, '\n🧪 CHILD FEE CALCULATION - TEST SUITE\n');
  
  let passCount = 0;
  let failCount = 0;
  
  // ========== PARSING TESTS ==========
  log(colors.yellow, '═'.repeat(70));
  log(colors.yellow, 'SECTION 1: DATA PARSING TESTS');
  log(colors.yellow, '═'.repeat(70));
  
  const parsingTests = [
    ['Array of integers', [8, 12], [8, 12]],
    ['Array of strings', ['8', '12'], [8, 12]],
    ['Comma-separated string', '8,12', [8, 12]],
    ['String with spaces', '8, 12', [8, 12]],
    ['Single number', 8, [8]],
    ['Single string', '8', [8]],
    ['Three values', [5, 9, 11], [5, 9, 11]],
    ['Mixed valid/invalid', ['8', 'abc', '12'], [8, 12]]
  ];
  
  parsingTests.forEach(([name, input, expected]) => {
    if (testDataParsing(name, input, expected)) {
      passCount++;
    } else {
      failCount++;
    }
  });
  
  // ========== FEE CALCULATION TESTS ==========
  log(colors.yellow, '\n\n' + '═'.repeat(70));
  log(colors.yellow, 'SECTION 2: FEE CALCULATION TESTS');
  log(colors.yellow, '═'.repeat(70));
  
  const basePrice = 500; // Standard room 3h
  
  const calculationTests = [
    ['No children', basePrice, [], 500],
    ['Young children (free)', basePrice, [3, 5], 500],
    ['Older children (both chargeable)', basePrice, [7, 10], 800],
    ['Mixed ages', basePrice, [4, 12], 650],
    ['Edge: Age 6 (free)', basePrice, [6], 500],
    ['Edge: Age 7 (charged)', basePrice, [7], 650],
    ['Edge: Age 13 (charged)', basePrice, [13], 650],
    ['Single chargeable child', basePrice, [9], 650],
    ['All free (0-6)', basePrice, [0, 2, 4, 6], 500],
    ['All chargeable (7-13)', basePrice, [7, 13], 800]
  ];
  
  calculationTests.forEach(([name, base, ages, expected]) => {
    if (testChildFeeCalculation(name, base, ages, expected)) {
      passCount++;
    } else {
      failCount++;
    }
  });
  
  // ========== SUMMARY ==========
  console.log('\n\n' + '═'.repeat(70));
  log(colors.blue, '📊 TEST SUMMARY');
  console.log('═'.repeat(70));
  
  log(colors.green, `✅ Passed: ${passCount}`);
  if (failCount > 0) {
    log(colors.red, `❌ Failed: ${failCount}`);
  }
  
  const totalTests = passCount + failCount;
  const passRate = ((passCount / totalTests) * 100).toFixed(1);
  
  console.log(`\nTotal: ${totalTests} tests`);
  console.log(`Pass Rate: ${passRate}%`);
  
  if (failCount === 0) {
    log(colors.green, '\n🎉 ALL TESTS PASSED!\n');
  } else {
    log(colors.red, '\n⚠️  SOME TESTS FAILED - Review the output above\n');
  }
  
  // ========== USAGE EXAMPLES ==========
  console.log('═'.repeat(70));
  log(colors.blue, '💡 USAGE EXAMPLES FOR YOUR API');
  console.log('═'.repeat(70));
  
  console.log(`
Example API Request Body:

{
  "roomSlug": "standard-room",
  "checkInDate": "2024-06-01",
  "checkInTime": "14:00",
  "duration": "3",
  "guestInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "09171234567",
    "adults": 2,
    "children": 2,
    "childAges": [6, 10]  ← Can be array, string, or number
  }
}

Valid childAges formats:
  - [8, 12]       (array of numbers)
  - ["8", "12"]   (array of strings)
  - "8,12"        (comma-separated string)
  - "8, 12"       (with spaces)
  - 8             (single number)
  - "8"           (single string)

Expected Server Logs:
  👶 [CHILD AGES] Raw childAges from request: [6, 10]
  👶 [CHILD AGES] Type: object
  👶 [PARSING] Input is array
     - Parsing "6" → 6
     - Parsing "10" → 10
  👶 [PARSED AGES] Result: [6, 10]
  
  💰 [PRICE CALC STEP 2] Calculating child fees...
     Child 1: Age 6
        → FREE (age 0-6)
     Child 2: Age 10
        → CHARGEABLE (₱150) | Running total: ₱150
  
  👶 [CHILD POLICY SUMMARY]
     Total Children: 2
     Ages: [6, 10]
     Chargeable Children (7-13): 1
     Total Child Add-on Fee: ₱150
  
  💰 [PRICE CALC STEP 3] FINAL CALCULATION:
     Base Room Rate: ₱500.00
     Child Add-on:   ₱150.00
     ─────────────────────────────────
     TOTAL:          ₱650.00
  
  🔐 Math Check: { base: 500, childFees: 150, total: 650 }
  `);
  
  console.log('═'.repeat(70));
  log(colors.blue, '🔍 DEBUGGING TIPS');
  console.log('═'.repeat(70));
  
  console.log(`
If child fees are still showing as ₱0:

1. Check server logs for these markers:
   👶 [CHILD AGES] Raw childAges from request:
   👶 [PARSING] Input is...
   💰 [PRICE CALC STEP 2] Calculating child fees...

2. Common issues:
   ❌ childAges is undefined → Check frontend is sending the data
   ❌ childAges is empty array → Check parsing logic
   ❌ Age validation fails → Check age is 0-13
   ❌ Count mismatch → Check array length matches children count

3. Test with curl:
   curl -X POST http://localhost:3000/api/payment/create-checkout \\
     -H "Content-Type: application/json" \\
     -H "Authorization: Bearer YOUR_TOKEN" \\
     -d '{
       "roomSlug": "standard-room",
       "checkInDate": "2024-06-01",
       "checkInTime": "14:00",
       "duration": "3",
       "guestInfo": {
         "firstName": "Test",
         "lastName": "User",
         "email": "test@example.com",
         "phone": "09171234567",
         "adults": 2,
         "children": 2,
         "childAges": [6, 10]
       }
     }'

4. Check database:
   SELECT reference_code, children_count, child_ages, total_amount
   FROM bookings
   ORDER BY created_at DESC
   LIMIT 1;
   
   Expected: child_ages = [6, 10], total_amount = 650.00
  `);
  
  console.log('═'.repeat(70));
  console.log('');
}

// Run the test suite
runAllTests();
