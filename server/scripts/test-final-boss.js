// server/scripts/test-final-boss.js
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api';
const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

// Utils for colored logs
const log = (msg, color = '\x1b[0m') => console.log(color + msg + '\x1b[0m');
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';

// Helper to generate a signature
function generateSignature(payload) {
    return crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');
}

async function runTests() {
    log('\n⚔️  STARTING FINAL BOSS TESTS (Webhook & Race Condition)\n', YELLOW);

    // --- SETUP: Create User & Get Token ---
    let token;
    try {
        const email = `tester_${Date.now()}@example.com`;
        await axios.post(`${BASE_URL}/auth/signup`, {
            firstName: 'Race', lastName: 'Tester',
            email, phone: '09170000000', password: 'Password123!'
        });
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email, password: 'Password123!'
        });
        token = loginRes.data.token;
        log('✅ Setup: Test User Created & Logged In', GREEN);
    } catch (err) {
        log('❌ Setup Failed: ' + (err.response?.data?.message || err.message), RED);
        process.exit(1);
    }

    // --- TEST 1: Webhook Security ---
    log('\n--- Test 1: Webhook Security ---', YELLOW);
    
    // Case A: No Signature
    try {
        await axios.post(`${BASE_URL}/payment/webhook`, { type: 'test' });
        log('❌ FAIL: Accepted webhook without signature', RED);
    } catch (err) {
        if (err.response?.status === 401) log('✅ PASS: Rejected missing signature', GREEN);
        else log(`❌ FAIL: Unexpected status ${err.response?.status}`, RED);
    }

    // Case B: Valid Signature
    try {
        const payload = { 
            data: { 
                attributes: { 
                    type: 'checkout_session.payment.paid',
                    data: { attributes: { checkout_session_id: 'test_session' } }
                } 
            } 
        };
        const signature = generateSignature(payload);
        
        await axios.post(`${BASE_URL}/payment/webhook`, payload, {
            headers: { 'paymongo-signature': signature }
        });
        log('✅ PASS: Accepted valid signature', GREEN);
    } catch (err) {
        log(`❌ FAIL: Rejected valid signature (Status ${err.response?.status})`, RED);
        if(err.response?.status === 500) log('   (Note: 500 might mean logic inside webhook failed, but auth passed)', YELLOW);
    }

    // --- TEST 2: Race Condition (The Stress Test) ---
    log('\n--- Test 2: Race Condition (Double Booking) ---', YELLOW);
    log('🚀 Firing 5 simultaneous booking requests for the SAME room...', YELLOW);

    const bookingPayload = {
        roomSlug: 'superior-room', // Ensure this room type exists in your DB
        checkInDate: '2026-12-25',
        checkInTime: '14:00',
        duration: '12',
        guestInfo: { firstName: 'Race', lastName: 'Test', email: 'race@test.com', phone: '09170000000' }
    };

    const requests = Array(5).fill().map(() => 
        axios.post(`${BASE_URL}/payment/create-checkout`, bookingPayload, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => ({ status: res.status, data: res.data }))
          .catch(err => ({ status: err.response?.status, data: err.response?.data }))
    );

    const results = await Promise.all(requests);
    
    const successes = results.filter(r => r.status === 200).length;
    const conflicts = results.filter(r => r.status === 409 || r.status === 500).length; // 500 is ok if it's a lock timeout

    log(`\nResults: ${successes} Success, ${conflicts} Failed/Conflict`);

    if (successes === 1) {
        log('✅ PASS: Exactly one booking succeeded. Race condition prevented.', GREEN);
    } else if (successes === 0) {
        log('⚠️ WARN: All failed. Check if room is available at all.', YELLOW);
    } else {
        log(`❌ FAIL: ${successes} bookings succeeded! Double booking detected!`, RED);
    }
}

runTests();