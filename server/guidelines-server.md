# Server - Backend Coding Standards

## 1. Server Architecture

### Framework
- **Node.js** with **Express.js** web framework
- Entry point: `server.js`

### Database
- **MySQL** via **XAMPP** (default config)
- **Sequelize ORM** for database operations
- Connection config: `config/database.js`
- Environment-based settings: `config/config.json`

### Directory Structure

| Folder         | Purpose                                          |
| -------------- | ------------------------------------------------ |
| `config/`      | Database connection, environment validation      |
| `controllers/` | Request handlers and business logic              |
| `middleware/`  | Auth guards, rate limiters, sanitization         |
| `models/`      | Sequelize model definitions                      |
| `routes/`      | Express route definitions                        |
| `scripts/`     | Test scripts (security, API contract, etc.)      |
| `utils/`       | Shared utilities (AppError class)                |

---

## 2. Model Definition Pattern (⚠️ CRITICAL)

### Pattern Used: Standalone Instance Pattern

This project uses `sequelize.define()` with a **shared Sequelize instance** imported directly into each model file.

> ⚠️ **DO NOT** use the Factory Pattern (`module.exports = (sequelize) => {}`)  
> ⚠️ **DO NOT** use `Model.init()` with class syntax (except `RoomImage.js` which is a legacy exception)

### ✅ Correct Pattern (User.js, Room.js, Booking.js)

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModelName = sequelize.define('ModelName', {
  // field definitions
}, {
  tableName: 'table_name',
  timestamps: false,
  underscored: true
});

// Associations defined as static method
ModelName.associate = function(models) {
  ModelName.hasMany(models.OtherModel, { ... });
};

module.exports = ModelName;
```

### ❌ Wrong Pattern (DO NOT USE)

```javascript
// WRONG: Factory pattern
module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define('Model', { ... });
  return Model;
};

// WRONG: Class-based with init (except RoomImage legacy)
class Model extends Model {
  static init(sequelize) { ... }
}
```

### Model Loader (`models/index.js`)

The loader handles both patterns for backwards compatibility but **new models must use the standalone pattern**:

```javascript
if (typeof modelDef === 'function' && !modelDef.options) {
  // Factory Pattern (legacy)
  model = modelDef(sequelize, Sequelize.DataTypes);
} else {
  // Standalone Pattern (preferred)
  model = modelDef;
}
```

---

## 3. Database Schema

### Core Tables

| Table          | Primary Key   | Description                    |
| -------------- | ------------- | ------------------------------ |
| `users`        | `user_id`     | Guest and staff accounts       |
| `rooms`        | `room_id`     | Physical room inventory        |
| `bookings`     | `booking_id`  | Reservation records            |
| `room_images`  | `image_id`    | Room photo gallery             |

### Relationships

```
User (1) ─────────< Booking (M)
                       │
Room (1) ─────────────<┘
  │
  └────────────< RoomImage (M)
```

| Association                    | Type       | Foreign Key |
| ------------------------------ | ---------- | ----------- |
| `Room.hasMany(Booking)`        | One-to-Many | `room_id`   |
| `Room.hasMany(RoomImage)`      | One-to-Many | `room_id`   |
| `Booking.belongsTo(Room)`      | Many-to-One | `room_id`   |
| `RoomImage.belongsTo(Room)`    | Many-to-One | `room_id`   |

### Column Naming Convention

- Database uses **snake_case**: `user_id`, `first_name`, `check_in_time`
- Sequelize maps via `field` property and `underscored: true` option
- API responses maintain **snake_case** (no camelCase transformation)

### Key Fields Reference

**users:**
`user_id`, `first_name`, `last_name`, `email`, `phone`, `password`, `role`, `created_at`, `updated_at`

**rooms:**
`room_id`, `room_number`, `type`, `name`, `slug`, `tagline`, `description`, `capacity`, `size`, `amenities` (JSON), `image`, `base_rate_3hr`, `base_rate_6hr`, `base_rate_12hr`, `base_rate_24hr`, `status`, `lock_expiration`, `locked_by_session_id`

**bookings:**
`booking_id`, `guest_id`, `room_id`, `reference_code`, `checkout_session_id`, `check_in_time`, `check_out_time`, `duration_hours`, `source`, `status`, `total_amount`, `created_at`

**room_images:**
`image_id`, `room_id`, `image_path`, `is_primary`, `created_at`

---

## 4. Controller Patterns

### Structure

Controllers live in `controllers/` and handle:
- Request parsing
- Business logic
- Database operations
- Response formatting

### Async/Await Pattern

```javascript
exports.controllerMethod = async (req, res) => {
  try {
    // 1. Extract and validate input
    const { param } = req.body;
    
    // 2. Perform database operation
    const result = await Model.findAll({ where: { ... } });
    
    // 3. Return response
    res.status(200).json({ success: true, data: result });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### Error Handling

- Use `AppError` class for operational errors
- Global error handler in `controllers/errorController.js`
- Development mode: Full stack traces
- Production mode: Sanitized error messages

```javascript
const AppError = require('../utils/AppError');

// Throw operational error
throw new AppError('Resource not found', 404);
```

### Transaction Pattern (for multi-step operations)

```javascript
const sequelize = require('../config/database');

const result = await sequelize.transaction(async (t) => {
  const record = await Model.create({ ... }, { transaction: t });
  await OtherModel.update({ ... }, { transaction: t });
  return record;
});
```

---

## 5. API Structure

### Base URL

```
/api
```

> Note: No version prefix (`/api/v1`). Routes are directly under `/api/`.

### Route Files

| File                | Mount Point       |
| ------------------- | ----------------- |
| `authRoutes.js`     | `/api/auth`       |
| `roomRoutes.js`     | `/api/rooms`      |
| `paymentRoutes.js`  | `/api/payment`    |

### Key Endpoints

#### Authentication (`/api/auth`)

| Method | Endpoint            | Auth     | Description              |
| ------ | ------------------- | -------- | ------------------------ |
| POST   | `/signup`           | Public   | Register new user        |
| POST   | `/login`            | Public   | Login, returns JWT       |
| PUT    | `/profile`          | Required | Update user profile      |
| PUT    | `/change-password`  | Required | Change password          |
| GET    | `/stats`            | Required | Get user statistics      |

#### Rooms (`/api/rooms`)

| Method | Endpoint                      | Auth   | Description                    |
| ------ | ----------------------------- | ------ | ------------------------------ |
| GET    | `/`                           | Public | Get all rooms (by type)        |
| GET    | `/available`                  | Public | Get available rooms            |
| GET    | `/:slug`                      | Public | Get room by slug               |
| GET    | `/:slug/check-availability`   | Public | Check room availability        |

#### Payments (`/api/payment`)

| Method | Endpoint                 | Auth     | Description                    |
| ------ | ------------------------ | -------- | ------------------------------ |
| POST   | `/create-checkout`       | Required | Create PayMongo session        |
| POST   | `/webhook`               | Internal | PayMongo webhook handler       |
| GET    | `/verify/:referenceCode` | Public   | Verify payment status          |
| GET    | `/booking/:referenceCode`| Public   | Get booking details            |
| GET    | `/my-bookings`           | Required | Get user's bookings            |
| GET    | `/cleanup-stale-bookings`| Public   | Cancel abandoned bookings      |

---

## 6. Security Middleware

### Applied Globally (server.js)

| Middleware            | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `cors()`              | Restrict origins (dev: localhost:5173/5174)|
| `express.json()`      | Body parsing with 10KB limit               |
| `sanitizeRequestBody` | Strip HTML/XSS from inputs                 |
| `apiLimiter`          | 100 requests per 15 min per IP             |

### Route-Specific

| Middleware     | Applied To            | Limit                    |
| -------------- | --------------------- | ------------------------ |
| `authLimiter`  | `/auth/login`, `/signup` | 5 requests per 15 min |
| `verifyToken`  | Protected routes      | JWT validation           |

---

## 7. Environment Variables

### Required (validated on startup)

```env
JWT_SECRET=your-secret-key
DB_NAME=balai_almeda_db
DB_USER=root
DB_PASS=
DB_HOST=localhost
PAYMONGO_TEST_SECRET_KEY=sk_test_...
PAYMONGO_WEBHOOK_SECRET=whsk_...
FRONTEND_URL=http://localhost:5173
```

### Optional

```env
PORT=3000
NODE_ENV=development
PAYMONGO_IS_LIVE=false
IMS_URL=http://localhost:5174
```

---

## 8. Coding Rules

### Mandatory Patterns

| Rule | Description |
| ---- | ----------- |
| ✅ Use `async/await` | No callbacks or raw `.then()` chains in controllers |
| ✅ Use `try/catch` | Wrap all async operations |
| ✅ Use `AppError` | For operational errors with status codes |
| ✅ Use transactions | For multi-model write operations |
| ✅ Validate input | Check required fields before DB operations |
| ❌ No `console.log` in production | Use conditional logging |

### Response Format

```javascript
// Success
res.status(200).json({
  success: true,
  data: { ... }
});

// Error
res.status(400).json({
  success: false,
  message: 'Error description'
});
```

### Import Order

```javascript
// 1. Node.js built-ins
const crypto = require('crypto');

// 2. External packages
const express = require('express');
const axios = require('axios');

// 3. Internal modules
const sequelize = require('../config/database');
const { Room, Booking } = require('../models');
const AppError = require('../utils/AppError');
```

---

*This document defines the backend standards for the server package. All AI-assisted code generation must adhere to these patterns, especially the Model Definition Style.*
