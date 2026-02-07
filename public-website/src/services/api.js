/**
 * Global API Service
 * Centralized API configuration for all HTTP requests with global error handling
 */

import axios from 'axios'
import router from '../router'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

/**
 * Helper function to get authentication token
 */
const getAuthToken = () => {
  return localStorage.getItem('token')
}

/**
 * Helper function to display user-friendly error messages
 * Uses native alert for now (can be replaced with toast library later)
 */
const showErrorNotification = (message, title = 'Error') => {
  // In production mode, errors are muted but we still want to show user notifications
  if (import.meta.env.PROD) {
    // Temporarily restore alert for user feedback
    const originalAlert = window.alert
    window.alert = function(msg) { originalAlert.call(window, msg) }
  }
  
  // TODO: Replace with toast library (vue-toastification, sweetalert2) for better UX
  window.alert(`${title}\n\n${message}`)
}

/**
 * Create Axios instance with base configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
})

/**
 * Request Interceptor - Add auth token if available
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request setup error:', error)
    return Promise.reject(error)
  }
)

/**
 * Response Interceptor - Global error handling
 */
apiClient.interceptors.response.use(
  // Success handler - pass through
  (response) => {
    return response
  },
  
  // Error handler - centralized error processing
  (error) => {
    // Network error (no response)
    if (!error.response) {
      console.error('Network Error:', error.message)
      showErrorNotification(
        'Unable to connect to the server. Please check your internet connection and try again.',
        'Connection Error'
      )
      return Promise.reject(error)
    }

    const { status, data } = error.response
    const errorMessage = data?.message || data?.error || 'An unexpected error occurred'

    // Handle different HTTP status codes
    switch (status) {
      case 400: // Bad Request
        console.error('Bad Request (400):', errorMessage)
        showErrorNotification(
          errorMessage,
          'Invalid Request'
        )
        break

      case 401: // Unauthorized
        console.error('Unauthorized (401):', errorMessage)
        
        // Clear authentication data
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('userId')
        
        // Show error message
        showErrorNotification(
          'Your session has expired. Please log in again.',
          'Session Expired'
        )
        
        // Redirect to login page
        router.push({ 
          path: '/login', 
          query: { redirect: router.currentRoute.value.fullPath }
        })
        break

      case 403: // Forbidden
        console.error('Forbidden (403):', errorMessage)
        showErrorNotification(
          'You do not have permission to perform this action.',
          'Access Denied'
        )
        break

      case 404: // Not Found
        console.error('Not Found (404):', errorMessage)
        showErrorNotification(
          errorMessage || 'The requested resource was not found.',
          'Not Found'
        )
        break

      case 409: // Conflict (e.g., room no longer available)
        console.error('Conflict (409):', errorMessage)
        showErrorNotification(
          errorMessage,
          'Booking Conflict'
        )
        break

      case 422: // Unprocessable Entity (validation errors)
        console.error('Validation Error (422):', errorMessage)
        showErrorNotification(
          errorMessage,
          'Validation Error'
        )
        break

      case 500: // Internal Server Error
      case 502: // Bad Gateway
      case 503: // Service Unavailable
      case 504: // Gateway Timeout
        console.error(`Server Error (${status}):`, errorMessage)
        showErrorNotification(
          'The server encountered an error. Please try again later or contact support if the problem persists.',
          'Server Error'
        )
        break

      default:
        console.error(`HTTP Error (${status}):`, errorMessage)
        showErrorNotification(
          errorMessage || `An error occurred (Error ${status})`,
          'Error'
        )
    }

    return Promise.reject(error)
  }
)

/**
 * API Service Object - Simplified wrapper around axios
 */
const api = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint (e.g., '/rooms')
   * @param {object} config - Additional axios config (params, headers, etc.)
   */
  get: async (endpoint, config = {}) => {
    const response = await apiClient.get(endpoint, config)
    return {
      data: response.data,
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText
    }
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {object} body - Request body
   * @param {object} config - Additional axios config
   */
  post: async (endpoint, body = {}, config = {}) => {
    const response = await apiClient.post(endpoint, body, config)
    return {
      data: response.data,
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText
    }
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {object} body - Request body
   * @param {object} config - Additional axios config
   */
  put: async (endpoint, body = {}, config = {}) => {
    const response = await apiClient.put(endpoint, body, config)
    return {
      data: response.data,
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText
    }
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {object} config - Additional axios config
   */
  delete: async (endpoint, config = {}) => {
    const response = await apiClient.delete(endpoint, config)
    return {
      data: response.data,
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText
    }
  }
}

export default api
