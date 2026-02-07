# Public Website - Frontend Coding Standards

## 1. Architecture

### Framework
- **Vue 3** with **Composition API** exclusively
- **Vite** as build tool and dev server
- All components must use `<script setup>` syntax

### Routing
- **Vue Router** with `createWebHistory` (HTML5 history mode)
- Routes defined in `src/router/index.js`
- Scroll behavior resets to top on navigation

| Route              | View Component         | Purpose                          |
| ------------------ | ---------------------- | -------------------------------- |
| `/`                | `HomeView`             | Landing page                     |
| `/rooms`           | `RoomsView`            | Room listing/catalog             |
| `/rooms/details`   | `RoomsDetailsView`     | Individual room details          |
| `/availability`    | `AvailabilityView`     | Check room availability          |
| `/booking`         | `BookingView`          | Booking flow                     |
| `/booking-success` | `BookingSuccessView`   | Confirmation page                |
| `/virtual-tour`    | `VirtualTourView`      | 360° tour experience             |
| `/location`        | `LocationView`         | Map and directions               |
| `/contact`         | `ContactView`          | Contact form                     |
| `/login`           | `LoginView`            | User authentication              |
| `/signup`          | `SignUpView`           | User registration                |
| `/profile`         | `ProfileView`          | User profile management          |
| `/bookings`        | `MyBookingsView`       | User's booking history           |
| `/privacy`         | `PrivacyView`          | Privacy policy                   |
| `/cookies`         | `CookiesView`          | Cookie policy                    |

### State Management
- **Pinia** for global state management
- Stores use Composition API style (`defineStore` with setup function)
- Stores located in `src/stores/`

---

## 2. Key Components

### `NavBar.vue`
Transparent-to-solid navigation with scroll detection.

**Behavior:**
- Starts **transparent** with **white text** on homepage (`/`)
- Transitions to **white background** with **dark text** when:
  - User scrolls past 50px (`isScrolled`)
  - Mobile menu is open (`isMenuOpen`)
  - Not on homepage (`route.path !== '/'`)
- Logo inverts colors based on navbar state
- Profile dropdown menu for authenticated users
- Mobile hamburger menu for responsive design

**Key Reactive State:**
```
isScrolled    → tracks window.scrollY > 50
isMenuOpen    → mobile menu toggle
isLoggedIn    → authentication status
showProfileMenu → profile dropdown visibility
```

### `Footer.vue`
Site-wide footer with links and branding.

### Modals (`src/components/modals/`)
- `BaseModal.vue` — Reusable modal wrapper
- `LoginRequiredModal.vue` — Auth prompt modal

---

## 3. Styling

### Tailwind CSS
- Configuration: `tailwind.config.js`
- Entry point: `src/assets/main.css`

### Custom Color Palette

| Token             | Value     | Usage                    |
| ----------------- | --------- | ------------------------ |
| `balai-bg`        | `#F9F9F7` | Page background          |
| `balai-dark`      | `#2B2B2B` | Primary text, dark UI    |
| `balai-gold`      | `#B58B4C` | Accent, CTAs, highlights |
| `balai-gold-dark` | `#96733F` | Hover state for gold     |

### Typography

| Class        | Font Family       | Usage           |
| ------------ | ----------------- | --------------- |
| `font-serif` | Prata, serif      | Headings        |
| `font-sans`  | Lato, sans-serif  | Body text       |

### Container
- Max-width: `1124px`
- Centered with `1.5rem` padding

---

## 4. Services & Utilities

### API Service (`src/services/api.js`)
Centralized Axios instance with:
- Base URL from `VITE_API_BASE_URL` env variable
- 30-second timeout
- **Request interceptor:** Attaches JWT token from localStorage
- **Response interceptor:** Global error handling with user notifications
- Handles 401 (unauthorized), 403 (forbidden), network errors

### Auth Utilities (`src/utils/auth.js`)

| Function           | Returns          | Description                     |
| ------------------ | ---------------- | ------------------------------- |
| `getToken()`       | `string \| null` | JWT from localStorage           |
| `getUser()`        | `object \| null` | Parsed user object              |
| `isAuthenticated()`| `boolean`        | Check if token exists           |
| `logout()`         | `void`           | Clear token and user data       |
| `getUserRole()`    | `string \| null` | Extract role from user          |
| `getUserName()`    | `string \| null` | Format "firstName lastName"     |

---

## 5. Coding Rules

### Component Structure
```vue
<script setup>
// 1. Imports
// 2. Props/Emits definitions
// 3. Reactive state (ref, reactive)
// 4. Computed properties
// 5. Functions/methods
// 6. Lifecycle hooks (onMounted, onUnmounted)
// 7. Watchers
</script>

<template>
  <!-- Single root element preferred -->
</template>

<style scoped>
/* Component-specific styles if needed */
</style>
```

### Mandatory Patterns

| Rule | Description |
| ---- | ----------- |
| ✅ Use `<script setup>` | All components must use Composition API setup syntax |
| ❌ No Options API | Do not use `data()`, `methods`, `computed` object syntax |
| ✅ Use `ref()` for primitives | Strings, numbers, booleans |
| ✅ Use `reactive()` for objects | Complex nested state (when needed) |
| ✅ Use `computed()` for derived state | Cached reactive values |
| ✅ Use `watch()` for side effects | React to state changes |
| ✅ Import from `@/` alias | Use path alias for src imports |

### Reactivity Guidelines
```javascript
// ✅ Correct
const isLoading = ref(false)
const userName = computed(() => user.value?.name || 'Guest')

// ❌ Wrong
let isLoading = false  // Not reactive
```

### Router Navigation
```javascript
// ✅ Use composables
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

router.push('/booking')
router.push({ name: 'rooms-details', query: { id: roomId } })
```

### API Calls
```javascript
// ✅ Use the centralized API service
import api from '@/services/api'

const response = await api.get('/rooms')
const result = await api.post('/bookings', bookingData)
```

### Event Handling
```javascript
// ✅ Use lifecycle hooks properly
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
```

---

## 6. File Naming Conventions

| Type       | Convention         | Example              |
| ---------- | ------------------ | -------------------- |
| Views      | `PascalCaseView`   | `BookingView.vue`    |
| Components | `PascalCase`       | `NavBar.vue`         |
| Stores     | `camelCase`        | `counter.js`         |
| Utilities  | `camelCase`        | `auth.js`            |
| Services   | `camelCase`        | `api.js`             |

---

*This document defines the frontend standards for the public-website package. All AI-assisted code generation must adhere to these patterns.*
