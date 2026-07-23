const CACHE_NAME = 'previando-v1'
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
]

// ── Install ──────────────────────────────────────────────────────────
// Cache static assets (CSS, JS, images, fonts) on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────
// Clean expired entries and old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// ── Fetch ────────────────────────────────────────────────────────────
// Network First for navigation (pages), Cache First for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Determine if this is a navigation request
  const isNavigation = request.mode === 'navigate'
  const isStaticAsset =
    /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(url.pathname)

  if (isNavigation) {
    // ── Network First for pages ──────────────────────────────────
    event.respondWith(networkFirstWithCacheRefresh(request))
  } else if (isStaticAsset) {
    // ── Cache First for static assets ────────────────────────────
    event.respondWith(cacheFirstWithDuration(request))
  }
  // Let other requests (API calls) pass through normally
})

// ── Strategy: Network First ──────────────────────────────────────────
async function networkFirstWithCacheRefresh(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (err) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) return cachedResponse
    // Fallback: serve the root page from cache
    const fallback = await caches.match('/')
    if (fallback) return fallback
    // Last resort
    return new Response('Offline', { status: 503 })
  }
}

// ── Strategy: Cache First with duration check ────────────────────────
async function cacheFirstWithDuration(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date') || 0)
    const age = Date.now() - cachedDate.getTime()
    if (age < CACHE_DURATION_MS) {
      return cachedResponse
    }
    // Expired — delete from cache, fall through to network
    cache.delete(request)
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.ok) {
      const headers = new Headers(networkResponse.headers)
      headers.set('sw-cached-date', new Date().toISOString())
      const responseWithDate = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      })
      cache.put(request, responseWithDate.clone())
      return responseWithDate
    }
    return networkResponse
  } catch (err) {
    // If offline and nothing in cache, return the expired cached response
    if (cachedResponse) return cachedResponse
    return new Response('Offline', { status: 503 })
  }
}
