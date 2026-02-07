// server/scripts/test-low-priority.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
const COLORS = {
    GREEN: '\x1b[32m',
    RED: '\x1b[31m',
    RESET: '\x1b[0m',
    YELLOW: '\x1b[33m'
};

async function log(msg, color = COLORS.RESET) {
    console.log(`${color}${msg}${COLORS.RESET}`);
}

async function testBodyLimit() {
    await log('\n=== TEST 1: Request Body Size Limit (10KB) ===', COLORS.YELLOW);
    
    // 1. Create a 15KB payload
    const largePayload = { data: 'x'.repeat(15 * 1024) };
    
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(largePayload)
        });

        if (res.status === 413) {
            await log('✅ PASS: Server blocked 15KB payload (Status 413)', COLORS.GREEN);
        } else {
            await log(`❌ FAIL: Server accepted large payload (Status ${res.status})`, COLORS.RED);
        }
    } catch (err) {
        await log(`❌ ERROR: Could not connect to server: ${err.message}`, COLORS.RED);
    }
}

async function testCORS() {
    await log('\n=== TEST 2: CORS Configuration ===', COLORS.YELLOW);

    // Case A: Allowed Origin (localhost:5173)
    try {
        const resAllowed = await fetch(`${BASE_URL}/rooms`, {
            method: 'GET',
            headers: { 'Origin': 'http://localhost:5173' }
        });
        
        const allowHeader = resAllowed.headers.get('Access-Control-Allow-Origin');
        if (allowHeader === 'http://localhost:5173') {
            await log('✅ PASS: Allowed Origin (localhost:5173) accepted', COLORS.GREEN);
        } else {
            await log(`❌ FAIL: Allowed Origin header missing or wrong. Got: ${allowHeader}`, COLORS.RED);
        }
    } catch (err) {
        await log(`❌ ERROR: ${err.message}`, COLORS.RED);
    }

    // Case B: Blocked Origin (malicious.com)
    try {
        const resBlocked = await fetch(`${BASE_URL}/rooms`, {
            method: 'GET',
            headers: { 'Origin': 'http://malicious-site.com' }
        });

        // Note: When CORS blocks, the browser throws an error, but fetch in Node might just return 
        // the response WITHOUT the Allow-Origin header, or a 500 error depending on your middleware setup.
        const allowHeaderBlocked = resBlocked.headers.get('Access-Control-Allow-Origin');
        
        if (!allowHeaderBlocked || resBlocked.status === 500) {
            await log('✅ PASS: Malicious Origin blocked (No Allow Header or 500)', COLORS.GREEN);
        } else {
            await log(`❌ FAIL: Malicious Origin was ALLOWED! Header: ${allowHeaderBlocked}`, COLORS.RED);
        }
    } catch (err) {
        // If fetch throws because of CORS (in some environments), that's also a pass
        await log('✅ PASS: Malicious Origin blocked (Network Error)', COLORS.GREEN);
    }
}

async function checkDynamicURL() {
    await log('\n=== TEST 3: Dynamic URL (Static Code Check) ===', COLORS.YELLOW);
    
    const controllerPath = path.join(__dirname, '../controllers/paymentController.js');
    
    try {
        const content = fs.readFileSync(controllerPath, 'utf8');
        
        if (content.includes('process.env.FRONTEND_URL') && content.includes('http://localhost:5173')) {
            await log('✅ PASS: Code uses process.env.FRONTEND_URL with localhost fallback', COLORS.GREEN);
        } else if (content.includes('process.env.FRONTEND_URL')) {
            await log('✅ PASS: Code uses process.env.FRONTEND_URL', COLORS.GREEN);
        } else {
            await log('❌ FAIL: "process.env.FRONTEND_URL" not found in paymentController.js', COLORS.RED);
        }
    } catch (err) {
        await log(`❌ ERROR: Could not read paymentController.js: ${err.message}`, COLORS.RED);
    }
}

async function run() {
    console.log('🧪 STARTING LOW PRIORITY CONFIG TESTS...');
    await testBodyLimit();
    await testCORS();
    await checkDynamicURL();
    console.log('\n🏁 TESTS COMPLETE');
}

run();