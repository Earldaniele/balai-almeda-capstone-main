# Child Policy - Quick Reference Card

## 🎯 Business Rules

| Rule | Value |
|------|-------|
| Max Children | 2 per booking |
| Age Range | 0-13 years |
| Free Ages | 0-6 years (no charge) |
| Charged Ages | 7-13 years (₱150 each) |

## 💰 Pricing Examples (Standard Room 3h = ₱500)

| Adults | Children | Ages | Surcharge | Total |
|--------|----------|------|-----------|-------|
| 2 | 0 | - | ₱0 | ₱500 |
| 2 | 2 | [3, 5] | ₱0 | ₱500 |
| 2 | 2 | [7, 10] | ₱300 | ₱800 |
| 2 | 2 | [4, 12] | ₱150 | ₱650 |
| 2 | 1 | [6] | ₱0 | ₱500 |
| 2 | 1 | [7] | ₱150 | ₱650 |

## 📁 Key Files

### Frontend
```
public-website/src/views/AvailabilityView.vue
- Lines 88-92: Form data with children & childAges
- Lines 123-132: Watch for children count changes
- Lines 143-149: Child surcharge calculation
- Lines 305-315: Validation before checkout
- Lines 470-495: Child age dropdowns UI
```

### Backend
```
server/models/Booking.js
- Lines 57-61: child_ages field definition

server/controllers/paymentController.js
- Lines 338-408: Child policy validation & pricing
- Lines 500-508: Save to database
```

### Database
```
balai_almeda_db.sql
- Line 41: child_ages column definition

server/migrations/add_child_ages_column.sql
- Migration script to add column
```

## 🧪 Quick Test

### Frontend Test
1. Go to http://localhost:5173/rooms
2. Click "Book Now" on any room
3. Increment children to 2
4. Select ages: 6 and 10
5. ✅ Should show: "Child Surcharge: +₱150"

### Backend Test
```bash
# Check server logs for:
👶 Child Policy Applied:
   Total Children: 2
   Ages: [6, 10]
   Chargeable (7-13 years): 1
   Add-on Fee: ₱150
```

### Database Test
```sql
SELECT * FROM bookings 
WHERE children_count > 0 
ORDER BY created_at DESC 
LIMIT 1;

-- Expected columns:
-- children_count: 2
-- child_ages: [6, 10]
-- total_amount: 650.00 (if base was 500)
```

## 🔍 Verification Queries

### Schema Check
```sql
SHOW COLUMNS FROM bookings WHERE Field = 'child_ages';
```

### Data Check
```sql
SELECT reference_code, children_count, child_ages, total_amount
FROM bookings
WHERE children_count > 0
ORDER BY created_at DESC
LIMIT 5;
```

### Pricing Verification
```sql
SELECT 
    b.reference_code,
    b.child_ages,
    b.total_amount,
    CASE b.duration_hours
        WHEN 3 THEN r.base_rate_3hr
        WHEN 6 THEN r.base_rate_6hr
        WHEN 12 THEN r.base_rate_12hr
        WHEN 24 THEN r.base_rate_24hr
    END as base_rate,
    (b.total_amount - CASE b.duration_hours
        WHEN 3 THEN r.base_rate_3hr
        WHEN 6 THEN r.base_rate_6hr
        WHEN 12 THEN r.base_rate_12hr
        WHEN 24 THEN r.base_rate_24hr
    END) as surcharge
FROM bookings b
JOIN rooms r ON b.room_id = r.room_id
WHERE b.children_count > 0;
```

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Age dropdowns not showing | Check browser console, verify `childAges` array |
| Price not updating | Verify `childAddOnPrice` computed property |
| NULL in database | Check server logs, verify `childAges` in API request |
| Wrong price in DB | Backend calculates server-side, check logs |

## 📊 Server Logs to Look For

**Good signs:**
```
✅ [MANUAL SELECTION] Room confirmed available
👶 Child Policy Applied: [ages shown]
💰 Price Calculation: [breakdown shown]
📝 Pending booking created
👶 Child Ages Saved: [ages shown]
✅ PayMongo session created
```

**Warning signs:**
```
⚠️ [SECURITY] Price manipulation detected!
❌ Invalid number of children
❌ Child ages must be between 0 and 13 years
❌ Count mismatch
```

## 📚 Documentation

Full docs in project root:
- **README_CHILD_POLICY.md** - Complete overview
- **CHILD_POLICY_FINAL_VERIFICATION.md** - Verification guide
- **CHILD_POLICY_TESTING_GUIDE.md** - Testing procedures
- **server/scripts/verify_child_policy.sql** - SQL queries
- **server/scripts/test-child-policy.js** - Test script

## 🎯 Deployment Checklist

- [ ] Backup database
- [ ] Run migration: `add_child_ages_column.sql`
- [ ] Deploy backend code
- [ ] Deploy frontend code
- [ ] Test one booking end-to-end
- [ ] Verify in database
- [ ] Monitor server logs
- [ ] Train staff

## ✅ Status

**Implementation**: ✅ Complete  
**Testing**: ✅ Ready  
**Documentation**: ✅ Complete  
**Production**: ⏳ Awaiting deployment

---

**Last Updated**: 2024  
**For detailed information, see**: `README_CHILD_POLICY.md`
