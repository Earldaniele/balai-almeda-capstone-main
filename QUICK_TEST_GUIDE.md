# 🧪 Quick Test Guide - Child Data Fix

## ⚡ 5-Minute Verification Test

### Prerequisites
- ✅ Frontend running (`npm run dev` in `public-website/`)
- ✅ Backend running (`npm start` in `server/`)
- ✅ User logged in to the system

---

## Test 1: Simple Test (2 minutes)

**Scenario**: Book a room with 1 child (age 10)

### Steps:
1. Open browser with DevTools (F12) → Console tab
2. Navigate to **Availability** page
3. Fill form:
   - Check-in Date: Tomorrow
   - Time: 14:00
   - Duration: 3 hours
   - Adults: **2**
   - Children: **1**
   - Child Age: **10**
4. Click "Check Availability"
5. Select any available room
6. Click "Book Now"

### What to Look For:

**✅ Browser Console** should show:
```
🔍 [BOOKING VIEW] URL Parameters: { adults: 2, children: 1, childAges: ['10'], hasChild: true, ... }
💰 [BOOKING VIEW] Price Calculation: { basePrice: 1500, childFee: 150, totalDue: 1650, chargeableChildren: 1 }
```

**✅ Booking Page** should display:
- "2 Adults, 1 Child"
- "Ages: 10"
- "Child Fee (1 × ₱150): ₱150"
- Total = Base Price + ₱150

**✅ Server Terminal** should show:
```
📥 [RAW REQUEST] Guest Info: { ... "adults": 2, "children": 1, "childAges": ["10"] }
👥 [GUEST INFO] Adults: 2, Children: 1
👶 [CHILD AGES] Raw childAges from request: ["10"]
👶 [PARSED AGES] Result: [10]
💰 [PRICE CALC STEP 2] Calculating child fees...
   Child 1: Age 10
      → CHARGEABLE (₱150) | Running total: ₱150
```

---

## Test 2: Edge Case Test (3 minutes)

**Scenario**: Book with 2 children (one free, one chargeable)

### Steps:
1. Return to Availability page
2. Fill form:
   - Adults: **3**
   - Children: **2**
   - Child Ages: **4, 12**
3. Select a room and proceed

### What to Look For:

**✅ Browser Console**:
```
childAges: ['4', '12']
childFee: 150
chargeableChildren: 1
```

**✅ Booking Page**:
- "3 Adults, 2 Children"
- "Ages: 4, 12"
- "Child Fee (1 × ₱150): ₱150"

**✅ Server Terminal**:
```
   Child 1: Age 4
      → FREE (age 0-6)
   Child 2: Age 12
      → CHARGEABLE (₱150)
   Chargeable Children (7-13): 1
   Total Child Add-on Fee: ₱150
```

---

## ❌ What If It Doesn't Work?

### Issue: No console logs in browser
**Fix**: 
- Hard refresh page (Ctrl+Shift+F5)
- Clear cache and reload
- Check DevTools Console tab is open

### Issue: Server logs don't show child data
**Fix**:
- Check `guestInfo` object in request payload
- Verify frontend is sending `adults`, `children`, `childAges`
- Check server terminal for `📥 [RAW REQUEST]` log

### Issue: Child fee is always ₱0 or wrong amount
**Fix**:
- Check `childAges` array in browser console
- Verify ages are in range 7-13 for chargeable children
- Check price calculation logs (`💰 [BOOKING VIEW]`)

---

## ✅ Success Checklist

Mark each as complete:

- [ ] Browser console shows child data in URL parameters
- [ ] Browser console shows correct childFee calculation
- [ ] Booking page displays child ages
- [ ] Booking page shows correct child fee breakdown
- [ ] Server receives child data in guestInfo
- [ ] Server parses childAges correctly
- [ ] Server calculates child fee correctly
- [ ] Total price matches expected amount

---

## 🎯 Quick Verification Commands

### Check Recent Booking in Database
```sql
-- Run this in MySQL/phpMyAdmin after completing a test booking
SELECT 
  reference_code,
  adults_count,
  children_count,
  child_ages,
  total_amount,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result** (for Test 1):
```
adults_count: 2
children_count: 1
child_ages: [10]
total_amount: [base_rate + 150]
```

---

## 📊 Test Results Template

Copy this and fill it out:

```
TEST DATE: _______________
TESTER: _______________

TEST 1 (1 child, age 10):
[ ] Frontend logs show child data: ___
[ ] Server logs show child data: ___
[ ] UI displays correct info: ___
[ ] Database record correct: ___
Result: PASS / FAIL

TEST 2 (2 children, ages 4 & 12):
[ ] Frontend logs show child data: ___
[ ] Server logs show child data: ___
[ ] UI displays correct info: ___
[ ] Database record correct: ___
Result: PASS / FAIL

ISSUES FOUND:
1. _______________
2. _______________

OVERALL STATUS: PASS / FAIL
```

---

## 🔧 Troubleshooting Commands

### Restart Frontend
```powershell
cd public-website
# Ctrl+C to stop
npm run dev
```

### Restart Backend
```powershell
cd server
# Ctrl+C to stop
npm start
```

### Clear Browser Cache
- Chrome: `Ctrl+Shift+Delete` → Clear browsing data
- Or: `Ctrl+Shift+R` (hard reload)

---

## 📞 Need Help?

1. Check detailed guide: `CHILD_DATA_FIX_VERIFICATION.md`
2. Review implementation: `CHILD_DATA_FIX_SUMMARY.md`
3. Check original requirement: `CHILD_POLICY_IMPLEMENTATION.md`

---

**Time Required**: 5-10 minutes  
**Difficulty**: Easy  
**Prerequisites**: Running frontend + backend, logged-in user

✅ **Ready to test!**
