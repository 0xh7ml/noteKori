import axios, { type AxiosResponse } from 'axios'
import { toast } from 'sonner'
import { enqueue, requestBackgroundSync } from './offline-queue'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'https://notekori-api-production.saikat-oubd.workers.dev',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Inject stored token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('notekori_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
  }
  return config
})

const MUTATING = new Set(['post', 'put', 'patch', 'delete'])

function isQueueable(method?: string, url?: string) {
  return (
    typeof window !== 'undefined' &&
    !!method && MUTATING.has(method.toLowerCase()) &&
    !!url && url.startsWith('/api/') && !url.startsWith('/api/auth')
  )
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err.config
    const offline = !err.response && (err.code === 'ERR_NETWORK' || !navigator.onLine)

    // Offline write: park it in IndexedDB and report success; flushQueue() replays it later
    if (offline && cfg && isQueueable(cfg.method, cfg.url)) {
      try {
        await enqueue({
          method: cfg.method.toUpperCase(),
          url: `${cfg.baseURL ?? ''}${cfg.url}`,
          body: typeof cfg.data === 'string' ? cfg.data : cfg.data ? JSON.stringify(cfg.data) : null,
          token: localStorage.getItem('notekori_token'),
        })
        void requestBackgroundSync()
        toast.info("You're offline. Saved on this device and will sync when you're back online.")
        return {
          data: { queued: true },
          status: 202,
          statusText: 'Queued',
          headers: {},
          config: cfg,
        } as AxiosResponse
      } catch {
        // IndexedDB unavailable: surface the original network error
      }
    }

    if (err.response?.status === 401 && typeof window !== 'undefined') {
      // Clear both localStorage and cookie
      localStorage.removeItem('notekori_token')
      document.cookie = 'notekori_token=; path=/; max-age=0; SameSite=Lax'
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
