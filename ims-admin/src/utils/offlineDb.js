/**
 * offlineDb.js — Lightweight IndexedDB wrapper for offline-first data storage
 * 
 * This is the core of the offline-first architecture.
 * All app data is stored here FIRST, then synced to the server when online.
 * 
 * Database: BalaiAlmedaIMS
 * Object Stores: rooms, bookings, staff, attendance, orders, syncQueue
 */

const DB_NAME = 'BalaiAlmedaIMS'
const DB_VERSION = 2

// Define all object stores and their key paths
const STORES = {
  rooms: { keyPath: 'id', autoIncrement: false },
  bookings: { keyPath: 'id', autoIncrement: false },
  staff: { keyPath: 'id', autoIncrement: false },
  attendance: { keyPath: 'id', autoIncrement: false },
  menuItems: { keyPath: 'id', autoIncrement: false },
  orders: { keyPath: 'id', autoIncrement: true },
  shiftReports: { keyPath: 'id', autoIncrement: true },
  syncQueue: { keyPath: 'id', autoIncrement: true },
  appMeta: { keyPath: 'key', autoIncrement: false },
}

let dbInstance = null

/**
 * Open (or create) the IndexedDB database
 */
function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      for (const [storeName, config] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, {
            keyPath: config.keyPath,
            autoIncrement: config.autoIncrement,
          })

          // Add useful indexes
          if (storeName === 'rooms') {
            store.createIndex('status', 'status', { unique: false })
            store.createIndex('type', 'type', { unique: false })
          }
          if (storeName === 'bookings') {
            store.createIndex('status', 'status', { unique: false })
            store.createIndex('guest', 'guest', { unique: false })
          }
          if (storeName === 'staff') {
            store.createIndex('role', 'role', { unique: false })
            store.createIndex('status', 'status', { unique: false })
          }
          if (storeName === 'syncQueue') {
            store.createIndex('status', 'status', { unique: false })
            store.createIndex('createdAt', 'createdAt', { unique: false })
          }
        }
      }
    }

    request.onsuccess = (event) => {
      dbInstance = event.target.result
      resolve(dbInstance)
    }

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error)
      reject(event.target.error)
    }
  })
}

/**
 * Get all records from a store
 */
async function getAll(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get a single record by key
 */
async function getById(storeName, key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Put (insert or update) a single record
 */
async function put(storeName, data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.put(data)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Put multiple records at once (bulk upsert)
 */
async function putMany(storeName, dataArray) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    for (const item of dataArray) {
      store.put(item)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Delete a record by key
 */
async function remove(storeName, key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all records from a store
 */
async function clearStore(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get records by index value
 */
async function getByIndex(storeName, indexName, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Count records in a store
 */
async function count(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export default {
  openDB,
  getAll,
  getById,
  put,
  putMany,
  remove,
  clearStore,
  getByIndex,
  count,
}
