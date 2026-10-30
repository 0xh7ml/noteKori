/* NoteKori service worker.
 * Written by hand because @opennextjs/cloudflare is incompatible with next-pwa.
 * The IndexedDB names below must match src/lib/offline-queue.ts. */

const VERSION = 'v1'
const STATIC_CACHE = `nk-static-${VERSION}`
const PAGE_CACHE = `nk-pages-${VERSION}`
const API_CACHE = `nk-api-${VERSION}`
const KNOWN_CACHES = [STATIC_CACHE, PAGE_CACHE, API_CACHE]

const OFFLINE_URL = '/offline.html'
const PRECACHE = [OFFLINE_URL, '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']

const DB_NAME = 'notekori-offline'
const STORE = 'queue'
const SYNC_TAG = 'notekori-sync'
const LOCK_NAME = 'notekori-flush'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('nk-') && !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('nk-')).map((k) => caches.delete(k)))),
    )
  }
})

// ── Caching ──────────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok) cache.put(request, res.clone())
  return res
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(request)
    // A redirected response cannot be replayed for a navigation, so never store one
    if (res.ok && !res.redirected) cache.put(request, res.clone())
    return res
  } catch (err) {
    const hit = await cache.match(request, { ignoreVary: true })
    if (hit) return hit
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl)
      if (fallback) return fallback
    }
    return Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.startsWith('/api/auth')) return
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE, OFFLINE_URL))
    return
  }

  if (request.headers.get('RSC') || url.searchParams.has('_rsc')) {
    event.respondWith(networkFirst(request, PAGE_CACHE))
  }
})

// ── Offline queue replay ─────────────────────────────────────────────────────
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore(mode, fn) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

async function replayQueue() {
  const items = (await withStore('readonly', (s) => s.getAll())).sort((a, b) => a.id - b.id)
  let sent = 0
  let dropped = 0
  let retry = false

  for (const item of items) {
    let res
    try {
      res = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...(item.token ? { Authorization: `Bearer ${item.token}` } : {}),
        },
        body: item.body,
      })
    } catch (err) {
      retry = true
      break
    }

    if (res.ok) {
      await withStore('readwrite', (s) => s.delete(item.id))
      sent++
    } else if (res.status === 401 || res.status >= 500) {
      retry = res.status >= 500
      break
    } else {
      await withStore('readwrite', (s) => s.delete(item.id))
      dropped++
    }
  }

  const remaining = await withStore('readonly', (s) => s.count())
  return { sent, dropped, remaining, retry }
}

async function flushQueue() {
  const run = async () => {
    const result = await replayQueue()
    const clients = await self.clients.matchAll({ includeUncontrolled: true })
    clients.forEach((c) => c.postMessage({ type: 'QUEUE_FLUSHED', ...result }))
    if (result.retry) throw new Error('retry sync later')
  }
  if (self.navigator && self.navigator.locks) return self.navigator.locks.request(LOCK_NAME, run)
  return run()
}

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(flushQueue())
})
