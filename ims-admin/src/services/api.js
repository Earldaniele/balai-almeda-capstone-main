/**
 * api.js — Centralized API service for IMS Admin
 * 
 * All HTTP calls to the server go through here.
 * Handles auth tokens, error responses, and base URL config.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Get the stored auth token
 */
function getToken() {
  return localStorage.getItem('ims_token');
}

/**
 * Set the auth token
 */
export function setToken(token) {
  localStorage.setItem('ims_token', token);
}

/**
 * Clear auth data
 */
export function clearAuth() {
  localStorage.removeItem('ims_token');
  localStorage.removeItem('ims_user');
}

/**
 * Get stored user info
 */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem('ims_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Store user info
 */
export function setStoredUser(user) {
  localStorage.setItem('ims_user', JSON.stringify(user));
}

/**
 * Core fetch wrapper with auth headers and error handling
 */
async function request(endpoint, options = {}) {
  // Add cache-busting timestamp to GET requests to prevent stale browser/SW cache
  const isMutation = options.method && options.method !== 'GET';
  const cacheBuster = !isMutation ? `${endpoint.includes('?') ? '&' : '?'}_t=${Date.now()}` : '';
  const url = `${API_BASE}/ims${endpoint}${cacheBuster}`;
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  // Don't stringify body if it's already a string
  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  console.log(`[API] ${config.method || 'GET'} ${url}`);
  const response = await fetch(url, config);

  if (response.status === 401) {
    // Token expired or invalid — clear auth
    clearAuth();
    throw new Error('Session expired. Please login again.');
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    console.error(`[API] Failed to parse response for ${endpoint}:`, response.status, response.statusText);
    throw new Error(`Server returned invalid response (${response.status} ${response.statusText})`);
  }

  if (!response.ok) {
    console.error(`[API] Request failed: ${endpoint}`, response.status, data.message);
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  console.log(`[API] ${config.method || 'GET'} ${endpoint} → OK`);
  return data;
}

// ============================================================
// AUTH
// ============================================================

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (data.success && data.token) {
    setToken(data.token);
    setStoredUser(data.user);
  }
  return data;
}

export function logout() {
  clearAuth();
}

export function isAuthenticated() {
  return !!getToken();
}

// ============================================================
// DASHBOARD
// ============================================================

export function fetchDashboardStats() {
  return request('/dashboard/stats');
}

// ============================================================
// ROOMS
// ============================================================

export function fetchRooms() {
  return request('/rooms');
}

export function updateRoomStatus(roomId, status) {
  return request(`/rooms/${roomId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

// ============================================================
// BOOKINGS
// ============================================================

export function fetchBookings(status = 'All') {
  const query = status !== 'All' ? `?status=${status}` : '';
  return request(`/bookings${query}`);
}

export function updateBookingStatus(bookingId, status) {
  return request(`/bookings/${bookingId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export function createWalkInBooking(data) {
  return request('/bookings/walk-in', {
    method: 'POST',
    body: data,
  });
}

// ============================================================
// STAFF
// ============================================================

export function fetchStaff() {
  return request('/staff');
}

// ============================================================
// MENU / POS
// ============================================================

export function fetchMenuItems() {
  return request('/menu');
}

export function createOrder(data) {
  return request('/orders', {
    method: 'POST',
    body: data,
  });
}

// ============================================================
// SHIFT
// ============================================================

export function fetchCurrentShift() {
  return request('/shift/current');
}

export function submitShiftReport(data) {
  return request('/shift/submit', {
    method: 'POST',
    body: data,
  });
}

export default {
  login,
  logout,
  isAuthenticated,
  fetchDashboardStats,
  fetchRooms,
  updateRoomStatus,
  fetchBookings,
  updateBookingStatus,
  createWalkInBooking,
  fetchStaff,
  fetchMenuItems,
  createOrder,
  fetchCurrentShift,
  submitShiftReport,
};
