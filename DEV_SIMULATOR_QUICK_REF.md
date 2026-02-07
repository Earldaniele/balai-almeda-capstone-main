# Dev Payment Simulator - Quick Reference

## 🚀 Quick Start (3 Steps)

### 1. Ensure Dev Mode
Check `.env`:
```env
NODE_ENV=development
```

### 2. Restart Server
```powershell
cd c:\xampp\htdocs\balai-almeda-capstone\server
node server.js
```

Look for: `🧪 Dev routes enabled at /api/dev`

### 3. Get Pending Booking
```powershell
curl http://localhost:3000/api/dev/pending-bookings
```

---

## 📡 API Endpoints

### **List Pending Bookings**
```
GET http://localhost:3000/api/dev/pending-bookings
```

### **Simulate Payment SUCCESS**
```
POST http://localhost:3000/api/dev/simulate-payment/BKG-ABC123
Content-Type: application/json

{
  "status": "paid"
}
```
Result: Booking status → `Confirmed`

### **Simulate Payment FAILURE**
```
POST http://localhost:3000/api/dev/simulate-payment/BKG-ABC123
Content-Type: application/json

{
  "status": "failed"
}
```
Result: Booking status → `Cancelled`

### **View All Bookings**
```
GET http://localhost:3000/api/dev/all-bookings
GET http://localhost:3000/api/dev/all-bookings?status=Confirmed
```

---

## 🧪 Testing Flow

```
1. Create Booking (Frontend/API)
   ↓
2. GET /api/dev/pending-bookings
   ↓ (Copy referenceCode)
3. POST /api/dev/simulate-payment/:referenceCode
   Body: { "status": "paid" }
   ↓
4. Check Database (status = Confirmed)
   ↓
5. Test Success Page
   Navigate to: /booking-success?reference=BKG-ABC123
```

---

## 🔒 Production Safety

**Dev routes are DISABLED in production:**

```javascript
// In server.js
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes);
}
```

Set `NODE_ENV=production` → All `/api/dev/*` routes return 404

---

## ⚠️ Common Issues

| Error | Solution |
|-------|----------|
| 404 on `/api/dev/simulate-payment` | Restart server after creating files |
| "Booking not found" | Use `/api/dev/pending-bookings` to get valid reference codes |
| Routes not showing | Check `NODE_ENV=development` in `.env` |
| "Cannot simulate payment" | Booking already processed (status ≠ Pending_Payment) |

---

## 📋 Copy-Paste Commands

**Windows PowerShell:**

```powershell
# Get pending bookings
curl http://localhost:3000/api/dev/pending-bookings

# Simulate success
curl -X POST http://localhost:3000/api/dev/simulate-payment/BKG-ABC123 `
  -H "Content-Type: application/json" `
  -d "{\"status\": \"paid\"}"

# Simulate failure
curl -X POST http://localhost:3000/api/dev/simulate-payment/BKG-ABC123 `
  -H "Content-Type: application/json" `
  -d "{\"status\": \"failed\"}"

# View all bookings
curl http://localhost:3000/api/dev/all-bookings
```

---

**For full documentation, see:** `DEV_PAYMENT_SIMULATOR.md`
