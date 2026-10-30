// IndexedDB-backed queue of mutations made while offline.
// public/sw.js reads the same database/store, so keep the names below in sync.

const DB_NAME = 'notekori-offline'
const STORE = 'queue'
const LOCK_NAME = 'notekori-flush'
export const QUEUE_EVENT = 'notekori:queue'
export const SYNC_TAG = 'notekori-sync'

export interface QueuedRequest {
  id?: number
  method: string
  url: string
  body: string | null
  token: string | null
  createdAt: number
}

export interface FlushResult {
  sent: number
  dropped: number
  remaining: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

function notify() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(QUEUE_EVENT))
}

export async function enqueue(item: Omit<QueuedRequest, 'id' | 'createdAt'>): Promise<void> {
  await run('readwrite', (s) => s.add({ ...item, createdAt: Date.now() }))
  notify()
}

export function getQueue(): Promise<QueuedRequest[]> {
  return run('readonly', (s) => s.getAll() as IDBRequest<QueuedRequest[]>)
}

export function queueCount(): Promise<number> {
  return run('readonly', (s) => s.count())
}

async function remove(id: number): Promise<void> {
  await run('readwrite', (s) => s.delete(id))
}

export async function clearQueue(): Promise<void> {
  await run('readwrite', (s) => s.clear())
  notify()
}

export async function requestBackgroundSync(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker?.ready
    const sync = (reg as unknown as { sync?: { register: (tag: string) => Promise<void> } })?.sync
    await sync?.register(SYNC_TAG)
  } catch {
    // Background Sync is unsupported (Safari/Firefox); the `online` listener covers it
  }
}

async function replay(): Promise<FlushResult> {
  const items = (await getQueue()).sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  let sent = 0
  let dropped = 0

  for (const item of items) {
    let res: Response
    try {
      res = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...(item.token ? { Authorization: `Bearer ${item.token}` } : {}),
        },
        body: item.body,
      })
    } catch {
      break // still offline: keep this and everything after it, order matters
    }

    if (res.ok) {
      await remove(item.id!)
      sent++
    } else if (res.status === 401 || res.status >= 500) {
      break // expired token or server trouble: retry later
    } else {
      await remove(item.id!) // 4xx can never succeed on retry
      dropped++
    }
  }

  const remaining = await queueCount()
  return { sent, dropped, remaining }
}

export async function flushQueue(): Promise<FlushResult | null> {
  if (typeof navigator === 'undefined' || !navigator.onLine) return null
  const exec = async () => {
    const result = await replay()
    notify()
    return result
  }
  if ('locks' in navigator) {
    return navigator.locks.request(LOCK_NAME, exec)
  }
  return exec()
}
