/**
 * syncQueue.js — Offline mutation queue
 * 
 * When the app is offline and the user performs a write action (check-in, mark clean, etc.),
 * the mutation is saved to IndexedDB's syncQueue store. When connectivity returns,
 * the queue is replayed against the server API in order.
 * 
 * Each queued action looks like:
 * {
 *   id: auto-incremented,
 *   action: 'UPDATE_ROOM_STATUS',       // action type
 *   payload: { roomId: 3, status: 'Available' },
 *   endpoint: '/api/rooms/3/status',     // API endpoint to call
 *   method: 'PATCH',                      // HTTP method
 *   createdAt: '2026-02-07T...',
 *   status: 'pending'                     // pending | synced | failed
 * }
 */

import db from './offlineDb.js'
import { checkOnline } from '../composables/useOnlineStatus.js'

const STORE = 'syncQueue'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Add a mutation to the offline queue
 */
export async function enqueue(action, payload, endpoint = '', method = 'POST') {
  const entry = {
    action,
    payload,
    endpoint,
    method,
    createdAt: new Date().toISOString(),
    status: 'pending',
  }
  await db.put(STORE, entry)
  console.warn('[SyncQueue] Queued offline action:', action, payload)

  // If we're online, try to sync immediately
  if (checkOnline()) {
    await processQueue()
  }

  return entry
}

/**
 * Get all pending items in the queue
 */
export async function getPending() {
  return db.getByIndex(STORE, 'status', 'pending')
}

/**
 * Get count of pending items
 */
export async function getPendingCount() {
  const pending = await getPending()
  return pending.length
}

/**
 * Process the sync queue — replay all pending mutations against the server
 * Called when the app comes back online
 */
export async function processQueue() {
  if (!checkOnline()) {
    console.warn('[SyncQueue] Still offline, skipping sync.')
    return { synced: 0, failed: 0 }
  }

  const pending = await getPending()

  if (pending.length === 0) {
    return { synced: 0, failed: 0 }
  }

  console.info(`[SyncQueue] Processing ${pending.length} queued actions...`)

  let synced = 0
  let failed = 0

  for (const item of pending) {
    try {
      if (item.endpoint) {
        // Build full URL and include auth token
        const url = item.endpoint.startsWith('http') ? item.endpoint : `${API_BASE}${item.endpoint.replace(/^\/api/, '')}`
        const token = localStorage.getItem('ims_token')
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
        const response = await fetch(url, {
          method: item.method,
          headers,
          body: JSON.stringify(item.payload),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
      }

      // Mark as synced
      item.status = 'synced'
      item.syncedAt = new Date().toISOString()
      await db.put(STORE, item)
      synced++
    } catch (error) {
      console.error(`[SyncQueue] Failed to sync action ${item.action}:`, error)
      item.status = 'failed'
      item.error = error.message
      item.failedAt = new Date().toISOString()
      await db.put(STORE, item)
      failed++
    }
  }

  console.info(`[SyncQueue] Done. Synced: ${synced}, Failed: ${failed}`)
  return { synced, failed }
}

/**
 * Clear all synced items from the queue (cleanup)
 */
export async function clearSynced() {
  const all = await db.getAll(STORE)
  for (const item of all) {
    if (item.status === 'synced') {
      await db.remove(STORE, item.id)
    }
  }
}

/**
 * Listen for online event and auto-sync
 */
export function startAutoSync() {
  window.addEventListener('online', async () => {
    console.info('[SyncQueue] Back online! Processing queue...')
    const result = await processQueue()
    if (result.synced > 0) {
      // Dispatch custom event so UI can react
      window.dispatchEvent(new CustomEvent('sync-complete', { detail: result }))
    }
  })
}

export default {
  enqueue,
  getPending,
  getPendingCount,
  processQueue,
  clearSynced,
  startAutoSync,
}
