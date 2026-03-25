/**
 * AKBai Service Worker — Offline-first caching with fallback page
 * Feature: PWA Hardening (Sprint 5)
 * Role: Caches static assets, serves offline fallback for failed navigations,
 *       skips API requests (let the app handle errors).
 */

const CACHE_NAME = 'akbai-v2'
const OFFLINE_URL = '/offline'

// ============================================================
// Install — Pre-cache offline fallback page and root shell
// ============================================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', OFFLINE_URL]))
  )
  self.skipWaiting()
})

// ============================================================
// Activate — Clean up old caches from previous versions
// ============================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ============================================================
// Fetch — Network-first for pages, cache static assets,
// skip API requests, serve offline fallback on navigation failure
// ============================================================

self.addEventListener('fetch', (event) => {
  // --- Skip API requests: let the app handle errors ---
  if (event.request.url.includes('/api/')) return
  if (event.request.method !== 'GET') return

  // --- Navigation requests: network-first with offline fallback ---
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // --- Static assets: network-first, cache on success ---
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (event.request.url.includes('/_next/static')) {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
