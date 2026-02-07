# Child Policy Testing Guide

## Quick Test Checklist

### 1. UI Functionality ✅

**Test the Children Counter:**
```
1. Open /availability?id=standard-room
2. Find "Children (0-13 years)" section
3. Click "+" button → count increases to 1
4. Click "+" button → count increases to 2
5. Click "+" button → disabled (max 2)
6. Click "−" button → count decreases to 1
7. Click "−" button → count decreases to 0
8. Click "−" button → disabled (min 0)
```

**Test Age Dropdowns:**
```
1. Set children to 1
   → One age dropdown appears
2. Set children to 2
   → Two age dropdowns appear
3. Set children to 0
   → Age dropdowns disappear
```

---

### 2. Price Calculation ✅

**Scenario A: No Children**
```
Children: 0
Expected: Shows base room rate only
Example: ₱1,200 (3h Standard Room)
```

**Scenario B: Children 0-6 (Free)**
```
Children: 2
Ages: [3, 5]
Expected: Shows base rate only (no surcharge)
Example: ₱1,200
Price Breakdown: "Base: ₱1,200 + Child: ₱0" (should NOT show)
```

**Scenario C: Children 7-13 (Charged)**
```
Children: 2
Ages: [8, 12]
Expected: Shows base rate + ₱300
Example: ₱1,500
Price Breakdown: "Base: ₱1,200 + Child: ₱300"
Child Surcharge Box: "+₱300"
```

**Scenario D: Mixed Ages**
```
Children: 2
Ages: [4, 9]
Expected: Shows base rate + ₱150
Example: ₱1,350
Price Breakdown: "Base: ₱1,200 + Child: ₱150"
```

---

### 3. Backend Validation ✅

**Test Invalid Children Count:**
```bash
# Send 3 children (max is 2)
curl -X POST http://localhost:3000/api/payment/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "roomSlug": "standard-room",
    "checkInDate": "2026-02-10",
    "checkInTime": "14:00",
    "duration": "3",
    "guestInfo": {
      "adults": 2,
      "children": 3,
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "phone": "09123456789"
    }
  }'

# Expected Response:
{
  "success": false,
  "message": "Invalid number of children (max 2 allowed)"
}
```

**Test Invalid Child Age:**
```bash
# Send child age > 13
curl -X POST http://localhost:3000/api/payment/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "roomSlug": "standard-room",
    "checkInDate": "2026-02-10",
    "checkInTime": "14:00",
    "duration": "3",
    "guestInfo": {
      "adults": 2,
      "children": 1,
      "childAges": "15",
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "phone": "09123456789"
    }
  }'

# Expected Response:
{
  "success": false,
  "message": "Child ages must be between 0 and 13 years"
}
```

**Test Mismatched Count vs Ages:**
```bash
# Send 2 children but only 1 age
curl -X POST http://localhost:3000/api/payment/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "roomSlug": "standard-room",
    "checkInDate": "2026-02-10",
    "checkInTime": "14:00",
    "duration": "3",
    "guestInfo": {
      "adults": 2,
      "children": 2,
      "childAges": "8",
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "phone": "09123456789"
    }
  }'

# Expected Response:
{
  "success": false,
  "message": "Children count (2) does not match number of ages provided (1)"
}
```

---

### 4. Database Persistence ✅

**Check Database After Successful Booking:**

```sql
-- After creating a booking with 2 adults and 2 children (ages 8, 12)
SELECT 
  reference_code,
  adults_count,
  children_count,
  total_amount,
  duration_hours
FROM bookings
WHERE reference_code = 'BKG-XXXXXX-XXXXXXXX'
ORDER BY created_at DESC
LIMIT 1;

-- Expected Result:
-- reference_code: BKG-XXXXXX-XXXXXXXX
-- adults_count: 2
-- children_count: 2
-- total_amount: 1500.00 (assuming 3h = 1200 + 300 child fee)
-- duration_hours: 3
```

**Verify Fix (Previously Failed):**
```sql
-- Before fix: adults_count and children_count were always 1 and 0
-- After fix: Should match user input

-- Create a test booking with:
-- Adults: 3
-- Children: 2
-- Ages: [7, 13]

-- Expected in database:
-- adults_count: 3
-- children_count: 2
-- total_amount: base_rate + 300
```

---

### 5. Server Logs ✅

**Check Server Console During Booking:**

```
=== CREATE CHECKOUT SESSION ===
Requested room type: standard-room
✅ Secure Guest ID set to: 123
[AUTO-ASSIGN] Finding any available standard-room...
✅ [AUTO-ASSIGN] Assigned room 201 (Standard Room A)

👶 Child Policy Applied:
   Total Children: 2
   Ages: [8, 12]
   Chargeable (7-13 years): 2
   Add-on Fee: ₱300

💰 Price Calculation:
   Base Room Rate: ₱1200
   Child Add-on: ₱300
   Final Total: ₱1500

🔒 Room 201 locked for booking
📝 Pending booking created (in transaction): BKG-XXXXXX-XXXXXXXX
👤 Guest ID: 123 (verified from JWT)
🏠 Assigned to: 201 (Room ID: 1)
💰 Amount: ₱1500 (3h rate - server-verified)
```

**Check for Price Manipulation Warning:**

If frontend sends wrong price:
```
⚠️ [SECURITY] Price manipulation detected!
   Client sent: ₱1000
   Real price: ₱1500
   Enforcing server-calculated price.
```

---

### 6. Full End-to-End Test ✅

**Complete Booking Flow:**

1. **Login**: Go to `/login`
2. **Browse Rooms**: Go to `/rooms`
3. **Select Room**: Click "Check Availability" on Standard Room
4. **Configure Booking**:
   - Date: Tomorrow
   - Time: 14:00
   - Duration: 3h
   - Adults: 2
   - Children: 2
   - Child 1 Age: 5
   - Child 2 Age: 10
5. **Check Availability**: Click "Check Availability"
6. **Verify Price Display**:
   - Sidebar shows: "₱1,350"
   - Breakdown: "Base: ₱1,200 + Child: ₱150"
   - Child Surcharge: "+₱150"
7. **Proceed**: Click "Book Now"
8. **Payment Page**: Verify details
   - Adults: 2
   - Children: 2
   - Total: ₱1,350
9. **Complete Payment**: Use PayMongo test card
10. **Verify Database**:
    ```sql
    SELECT * FROM bookings WHERE reference_code = 'BKG-...'
    -- adults_count should be 2
    -- children_count should be 2
    -- total_amount should be 1350.00
    ```

---

## Expected Results Summary

### All Scenarios Should Pass:

| Scenario | Adults | Children | Ages | Expected Price | DB adults_count | DB children_count |
|----------|--------|----------|------|----------------|-----------------|-------------------|
| No Children | 2 | 0 | [] | ₱1,200 | 2 | 0 |
| Free Children | 2 | 2 | [3,5] | ₱1,200 | 2 | 2 |
| Charged Children | 2 | 2 | [8,12] | ₱1,500 | 2 | 2 |
| Mixed Ages | 2 | 2 | [4,9] | ₱1,350 | 2 | 2 |
| Single Child (Free) | 1 | 1 | [6] | ₱1,200 | 1 | 1 |
| Single Child (Charged) | 1 | 1 | [7] | ₱1,350 | 1 | 1 |
| Max Adults + Children | 4 | 2 | [10,13] | ₱1,500 | 4 | 2 |

*(Assuming Standard Room 3h base rate = ₱1,200)*

---

## 🐛 Common Issues to Check

### Issue 1: Ages Not Sending to Backend
**Symptom**: Backend shows empty childAges array  
**Fix**: Check browser Network tab → Verify `childAges` is in request body  
**Expected**: `"childAges": "8,12"` or `"childAges": [8,12]`

### Issue 2: Price Not Updating
**Symptom**: Price stays at base rate even with 7-13 year olds  
**Fix**: Check Vue Devtools → Verify `childAddOnPrice` computed property  
**Expected**: Should show 150 * (count of ages 7-13)

### Issue 3: Database Still Shows 0 Children
**Symptom**: `children_count` is always 0 in database  
**Fix**: Verify backend is using `childrenCount` variable (not `guestInfo.children`)  
**Expected**: Line 501 should be `children_count: childrenCount`

---

## ✅ Success Indicators

**When everything is working correctly, you should see:**

1. ✅ Child counter in UI (0-2 range enforced)
2. ✅ Age dropdowns appear when children > 0
3. ✅ Price updates automatically when ages change
4. ✅ Price breakdown shows child surcharge if applicable
5. ✅ Server logs show "Child Policy Applied" message
6. ✅ Database has correct `adults_count` and `children_count`
7. ✅ PayMongo receives correct total amount
8. ✅ Booking confirmation shows correct guest counts

**All tests passing = Implementation complete! 🎉**
