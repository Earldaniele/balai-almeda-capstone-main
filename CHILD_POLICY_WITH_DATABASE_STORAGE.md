# Child Policy Implementation - WITH DATABASE STORAGE ✅

## Overview
Complete implementation of child policy with age-based pricing AND database persistence of child ages for staff verification and audit purposes.

---

## 🎯 New Requirements

### Database Storage
- **NEW**: `child_ages` column in `bookings` table (JSON type)
- **Purpose**: Store individual child ages for staff verification, reporting, and compliance
- **Format**: JSON array `[8, 12]` or `NULL` if no children

### Business Rules (Unchanged)
- Children 0-6 years: **Free**
- Children 7-13 years: **+₱150 per child**
- Maximum: **2 children per booking**

---

## 📋 Implementation Summary

### ✅ PART 1: Database Schema Update

**File**: `server/migrations/add_child_ages_column.sql`

```sql
ALTER TABLE bookings 
ADD COLUMN child_ages JSON NULL 
AFTER children_count;
```

**To Run Migration**:
```bash
# Using MySQL CLI
mysql -u root -p balai_almeda_db < server/migrations/add_child_ages_column.sql

# Or using phpMyAdmin
# Navigate to SQL tab and paste the migration script
```

---

### ✅ PART 2: Sequelize Model Update

**File**: `server/models/Booking.js`

**Added Field**:
```javascript
child_ages: {
  type: DataTypes.JSON,
  allowNull: true,
  field: 'child_ages'
}
```

**Database Mapping**:
- `children_count`: Integer (0-2)
- `child_ages`: JSON array `[age1, age2]` or `NULL`

**Examples**:
```javascript
// 2 children aged 8 and 12
{ children_count: 2, child_ages: [8, 12] }

// 1 child aged 5
{ children_count: 1, child_ages: [5] }

// No children
{ children_count: 0, child_ages: null }
```

---

### ✅ PART 3: Backend Controller Update

**File**: `server/controllers/paymentController.js`

**Key Changes**:

1. **Data Persistence** (Line 503):
```javascript
const booking = await Booking.create({
  guest_id: secureGuestId,
  room_id: lockedRoom.room_id,
  reference_code: referenceCode,
  check_in_time: checkInDateTime,
  check_out_time: checkOutDateTime,
  duration_hours: parseInt(duration),
  adults_count: adultsCount,
  children_count: childrenCount,
  child_ages: childrenCount > 0 ? childAges : null, // ✅ NEW: Store ages
  source: 'Web',
  status: 'Pending_Payment',
  total_amount: serverCalculatedPrice
}, { transaction: t });
```

2. **Enhanced Logging** (Lines 507-512):
```javascript
console.log(`📝 Pending booking created (in transaction): ${referenceCode}`);
console.log(`👤 Guest ID: ${secureGuestId} (verified from JWT)`);
console.log(`🏠 Assigned to: ${lockedRoom.room_number} (Room ID: ${lockedRoom.room_id})`);
console.log(`👨‍👩‍👧‍👦 Guests: ${adultsCount} adult(s), ${childrenCount} child(ren)`);
if (childrenCount > 0) {
  console.log(`👶 Child Ages Saved: [${childAges.join(', ')}]`);
}
console.log(`💰 Amount: ₱${serverCalculatedPrice} (${duration}h rate - server-verified)`);
```

**Existing Logic** (Already Complete):
- ✅ Validates child count (0-2)
- ✅ Parses `childAges` from request
- ✅ Validates each age (0-13)
- ✅ Calculates pricing (ages 7-13 = +₱150)
- ✅ Enforces server-side price calculation

---

### ✅ PART 4: Frontend Validation Update

**File**: `public-website/src/views/AvailabilityView.vue`

**Added Validation** (Lines 305-320):
```javascript
const proceedToBooking = () => {
  // Check availability first
  if (!availabilityResult.value) {
    checkAvailability()
    return
  }
  
  // Only proceed if room is available
  if (!availabilityResult.value.available) {
    return
  }
  
  // ✅ NEW VALIDATION: Ensure all child ages are selected
  if (form.value.children > 0) {
    // Check array length matches children count
    if (form.value.childAges.length !== form.value.children) {
      alert('Please select the age for each child before proceeding.')
      return
    }
    
    // Validate all ages are valid (0-13)
    const hasInvalidAge = form.value.childAges.some(
      age => age < 0 || age > 13 || isNaN(age)
    )
    if (hasInvalidAge) {
      alert('Please select valid ages (0-13 years) for all children.')
      return
    }
  }
  
  // Build query parameters and navigate
  // ... rest of function
}
```

**Existing UI** (Already Complete):
- ✅ Children counter (+/- buttons, max 2)
- ✅ Dynamic age dropdowns (0-13 years)
- ✅ Price calculation with child surcharge
- ✅ Visual feedback for pricing

---

## 🗄️ Database Schema

### Complete `bookings` Table Structure

```sql
CREATE TABLE bookings (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  guest_id INT NULL,
  room_id INT NOT NULL,
  reference_code VARCHAR(20) UNIQUE,
  checkout_session_id VARCHAR(255) NULL,
  check_in_time DATETIME,
  check_out_time DATETIME,
  duration_hours INT NOT NULL,
  adults_count INT NOT NULL DEFAULT 1,
  children_count INT NOT NULL DEFAULT 0,
  child_ages JSON NULL,  -- ✅ NEW COLUMN
  source ENUM('Web', 'Walk_in') DEFAULT 'Web',
  status ENUM('Pending_Payment', 'Confirmed', 'Checked_In', 'Completed', 'Cancelled') DEFAULT 'Pending_Payment',
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 Data Flow with Child Ages

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: User selects children and ages                   │
│ - children: 2                                               │
│ - childAges: [8, 12]                                        │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND VALIDATION: Ensure all ages selected              │
│ - Check childAges.length === children                      │
│ - Check all ages are 0-13                                  │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ API REQUEST: POST /api/payment/create-checkout             │
│ guestInfo: {                                                │
│   adults: 2,                                                │
│   children: 2,                                              │
│   childAges: "8,12"  ← comma-separated string              │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: Parse and Validate                                │
│ - childAges = "8,12".split(',').map(parseInt)              │
│ - Result: [8, 12]                                           │
│ - Validate length === children (2 === 2) ✓                 │
│ - Validate each age 0-13 ✓                                 │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: Calculate Price                                   │
│ - baseRoomPrice = 1200                                      │
│ - chargeableChildren = [8,12].filter(age => 7-13).length   │
│   = 2                                                        │
│ - childAddOnPrice = 2 × 150 = 300                          │
│ - serverCalculatedPrice = 1200 + 300 = 1500                │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE: Save Booking                                      │
│ INSERT INTO bookings (                                      │
│   adults_count: 2,                                          │
│   children_count: 2,                                        │
│   child_ages: [8, 12],  ← ✅ SAVED AS JSON                 │
│   total_amount: 1500.00                                     │
│ )                                                            │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ RESULT: Complete audit trail                               │
│ - Staff can verify pricing: "2 children aged 8 and 12"     │
│ - Reports can analyze: "Most common child age ranges"      │
│ - Compliance: "Child policy correctly applied"             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Example Database Records

### Example 1: Free Children (Ages 0-6)
```sql
INSERT INTO bookings (
  adults_count, children_count, child_ages, total_amount
) VALUES (
  2, 2, '[3, 5]', 1200.00
);

-- Explanation:
-- 2 adults + 2 children (ages 3 and 5)
-- Both children are under 7 → Free
-- Total: Base rate only (₱1,200)
```

### Example 2: Charged Children (Ages 7-13)
```sql
INSERT INTO bookings (
  adults_count, children_count, child_ages, total_amount
) VALUES (
  2, 2, '[8, 12]', 1500.00
);

-- Explanation:
-- 2 adults + 2 children (ages 8 and 12)
-- Both children are 7-13 → +₱150 each
-- Total: ₱1,200 + ₱300 = ₱1,500
```

### Example 3: Mixed Ages
```sql
INSERT INTO bookings (
  adults_count, children_count, child_ages, total_amount
) VALUES (
  2, 2, '[4, 9]', 1350.00
);

-- Explanation:
-- 2 adults + 2 children (ages 4 and 9)
-- Age 4: Free (under 7)
-- Age 9: +₱150 (7-13 range)
-- Total: ₱1,200 + ₱150 = ₱1,350
```

### Example 4: No Children
```sql
INSERT INTO bookings (
  adults_count, children_count, child_ages, total_amount
) VALUES (
  2, 0, NULL, 1200.00
);

-- Explanation:
-- 2 adults, no children
-- child_ages is NULL
-- Total: Base rate only (₱1,200)
```

---

## 🧪 Testing Checklist

### 1. Database Migration
```bash
□ Run migration script
□ Verify child_ages column exists
□ Check column type is JSON
□ Confirm column allows NULL
```

### 2. Frontend Validation
```bash
□ Set children to 1 → 1 age dropdown appears
□ Set children to 2 → 2 age dropdowns appear
□ Set children to 0 → No age dropdowns
□ Try to proceed without selecting ages → Blocked with alert
□ Select all ages → Allowed to proceed
```

### 3. Backend Processing
```bash
□ Send request with children: 2, childAges: "8,12"
□ Check server logs show: "Child Ages Saved: [8, 12]"
□ Verify pricing calculation includes child surcharge
□ Confirm PayMongo amount is correct
```

### 4. Database Verification
```sql
-- After creating a booking with 2 children (ages 8, 12)
SELECT 
  reference_code,
  adults_count,
  children_count,
  child_ages,
  total_amount
FROM bookings
ORDER BY created_at DESC
LIMIT 1;

-- Expected Result:
-- reference_code: BKG-XXXXXX-XXXXXXXX
-- adults_count: 2
-- children_count: 2
-- child_ages: [8, 12]  ← ✅ JSON array
-- total_amount: 1500.00
```

### 5. Staff Verification Use Case
```sql
-- Query to see all bookings with children
SELECT 
  reference_code,
  adults_count,
  children_count,
  child_ages,
  total_amount,
  created_at
FROM bookings
WHERE children_count > 0
ORDER BY created_at DESC;

-- Staff can verify:
-- "Did we charge correctly for the child ages?"
-- "Customer said child is 8 years old - does JSON match?"
```

---

## 🔐 Security & Validation

### Frontend Validation
1. ✅ Ensures `childAges.length === children`
2. ✅ Validates each age is 0-13
3. ✅ Blocks submission if ages not selected
4. ✅ Provides clear error messages

### Backend Validation
1. ✅ Validates children count (0-2)
2. ✅ Validates ages array length matches count
3. ✅ Validates each age is 0-13
4. ✅ Recalculates price server-side
5. ✅ Stores ages for audit trail

### Database Integrity
1. ✅ JSON type ensures proper data structure
2. ✅ NULL allowed when no children
3. ✅ Paired with `children_count` for consistency
4. ✅ Immutable after creation (audit trail)

---

## 📈 Benefits of Storing Child Ages

### 1. **Pricing Verification**
Staff can verify correct pricing by checking saved ages:
- "Customer was charged ₱300 for 2 children"
- "Ages saved: [8, 12] → Both 7-13 → ✓ Correct"

### 2. **Dispute Resolution**
If customer disputes charges:
- Show saved ages from booking
- Recalculate pricing based on saved data
- Clear audit trail

### 3. **Reporting & Analytics**
```sql
-- Most common child age ranges
SELECT 
  JSON_EXTRACT(child_ages, '$[0]') AS child1_age,
  JSON_EXTRACT(child_ages, '$[1]') AS child2_age,
  COUNT(*) AS bookings
FROM bookings
WHERE child_ages IS NOT NULL
GROUP BY child1_age, child2_age;

-- Average age of children in bookings
SELECT 
  AVG(JSON_EXTRACT(child_ages, '$[0]')) AS avg_first_child_age
FROM bookings
WHERE child_ages IS NOT NULL;
```

### 4. **Compliance**
- Proof of policy application
- Historical record for audits
- Transparent pricing documentation

---

## ✅ Completion Status

- [x] Database migration script created
- [x] Booking model updated with `child_ages` field
- [x] Backend saves `child_ages` to database
- [x] Backend validates ages before saving
- [x] Backend logs saved ages for debugging
- [x] Frontend validates ages before submission
- [x] Frontend blocks submission if ages not selected
- [x] Complete audit trail in database
- [x] Documentation with examples
- [x] Testing checklist provided

---

## 🚀 Ready for Production

The child policy implementation now includes **complete database persistence** of child ages for staff verification and audit purposes. The `child_ages` JSON column provides:

✅ Pricing verification capability  
✅ Dispute resolution support  
✅ Reporting and analytics data  
✅ Compliance and audit trail  
✅ Complete transparency  

**Next Steps:**
1. Run the database migration: `server/migrations/add_child_ages_column.sql`
2. Test the complete booking flow
3. Verify child ages appear in database
4. Train staff on using `child_ages` for verification

**Implementation Complete! 🎉**
