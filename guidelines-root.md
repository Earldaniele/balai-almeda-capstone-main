# Balai Almeda - Master Context Guidelines

## 1. Project Overview

**Balai Almeda** is a hotel/resort management system built as a monorepo containing three distinct applications:

- A **public-facing website** for guests to browse rooms, make reservations, and manage bookings
- An **internal management system (IMS)** for staff to handle front desk operations, housekeeping, HR, and point-of-sale
- A **backend API server** that provides centralized data management and business logic

The system supports online room booking with payment integration, guest authentication, and comprehensive internal operations management.

---

## 2. Monorepo Structure

```
balai-almeda-capstone/
├── server/                 # Backend API (Node.js/Express)
├── public-website/         # Guest-facing booking website (Vue 3)
├── ims-admin/              # Internal Management System (Vue 3)
├── balai_almeda_db.sql     # Database schema/seed file
└── repomix.config.json     # Monorepo tooling configuration
```

### `server/` — Backend API

Centralized REST API serving both frontend applications.

| Folder         | Purpose                                                    |
| -------------- | ---------------------------------------------------------- |
| `config/`      | Database connection, environment validation, app config    |
| `controllers/` | Request handlers (auth, rooms, payments, errors)           |
| `middleware/`  | Auth guards, rate limiters, input sanitization             |
| `models/`      | Sequelize ORM models (User, Room, Booking, RoomImage)      |
| `routes/`      | Express route definitions                                  |
| `scripts/`     | Test scripts for API contracts, data integrity, security   |
| `utils/`       | Shared utilities (custom AppError class)                   |

### `public-website/` — Guest Portal

Customer-facing Vue 3 SPA for room browsing and online booking.

| Folder        | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| `views/`      | Page components (Home, Rooms, Booking, Profile, etc) |
| `components/` | Reusable UI (NavBar, Footer, Modals)                 |
| `router/`     | Vue Router configuration                             |
| `services/`   | API communication layer                              |
| `stores/`     | Pinia state management                               |
| `utils/`      | Auth helpers and utilities                           |
| `assets/`     | Global CSS (Tailwind entry point)                    |
| `public/`     | Static assets (images, favicon)                      |

### `ims-admin/` — Internal Management System

Staff-facing Vue 3 SPA for hotel operations.

| Folder     | Purpose                                                       |
| ---------- | ------------------------------------------------------------- |
| `views/`   | Dashboard, Reservations, Housekeeping, HR, POS, Shift modules |
| `layouts/` | Admin layout wrapper                                          |
| `router/`  | Vue Router configuration                                      |
| `stores/`  | Pinia state management                                        |
| `assets/`  | Global CSS (Tailwind entry point)                             |

---

## 3. Tech Stack Summary

### Frontend (Both Apps)

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| Vue 3          | UI framework (Composition API) |
| Vite           | Build tool and dev server      |
| Vue Router     | Client-side routing            |
| Pinia          | State management               |
| Tailwind CSS   | Utility-first styling          |
| PostCSS        | CSS processing                 |

### Backend

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| Node.js        | Runtime environment            |
| Express.js     | Web framework                  |
| Sequelize      | ORM for database operations    |
| MySQL          | Relational database            |

### Key Patterns

- **Authentication:** JWT-based auth with middleware protection
- **API Structure:** RESTful routes with controller-based handlers
- **Error Handling:** Centralized error controller with custom AppError class
- **Security:** Rate limiting, input sanitization, environment validation
- **Database:** Sequelize models with associations (User → Booking → Room)

### Development Tools

- **Repomix:** Codebase aggregation for AI context
- **Vue DevTools:** Frontend debugging
- **Test Scripts:** Custom Node.js scripts for API/security testing

---

## 4. Key File References

| File                          | Description                              |
| ----------------------------- | ---------------------------------------- |
| `server/server.js`            | Express app entry point                  |
| `server/config/database.js`   | Sequelize database configuration         |
| `server/models/index.js`      | Model associations and exports           |
| `public-website/src/main.js`  | Vue app initialization (public)          |
| `ims-admin/src/main.js`       | Vue app initialization (admin)           |
| `*/src/router/index.js`       | Route definitions for each frontend      |
| `*/tailwind.config.js`        | Tailwind CSS configuration               |
| `balai_almeda_db.sql`         | Database schema and initial data         |

---

*This document serves as the master context for AI-assisted development sessions on the Balai Almeda project.*
