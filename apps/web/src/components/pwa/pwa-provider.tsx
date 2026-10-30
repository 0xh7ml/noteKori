'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CloudOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { flushQueue, queueCount, QUEUE_EVENT } from '@/lib/offline-queue'

const WARM_ROUTES = ['/dashboard', '/transactions', '/analytics', '/debts', '/vehicles', '/categories', '/settings']
const WARM_API = ['/api/profile', '/api/categories', '/api/debts', '/api/vehicles']
const WARM_KEY = 'notekori_warmed'

const plural = (n: number) => `${n} change${n === 1 ? '' : 's'}`

export function PwaProvider() {
  const qc = useQueryClient()
  const [online, setOnline] = useState(true)
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshCount = useCallback(() => {
    queueCount().then(setPending).catch(() => {})
  }, [])

  const onFlushed = useCallback((sent: number, dropped: number) => {
    if (sent > 0 || dropped > 0) qc.invalidateQueries()
    if (sent > 0) toast.success(`Synced ${plural(sent)}`)
    if (dropped > 0) toast.error(`${plural(dropped)} could not be saved and were discarded`)
  }, [qc])

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const result = await flushQueue()
      if (result) onFlushed(result.sent, result.dropped)
    } catch {
      // stays queued; the next online event or background sync retries
    } finally {
      setSyncing(false)
      refreshCount()
    }
  }, [onFlushed, refreshCount])

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => {})
    }

    setOnline(navigator.onLine)
    refreshCount()
    if (navigator.onLine) void sync()

    const handleOnline = () => { setOnline(true); void sync() }
    const handleOffline = () => setOnline(false)
    const handleSwMessage = (e: MessageEvent) => {
      if (e.data?.type === 'QUEUE_FLUSHED') {
        onFlushed(e.data.sent ?? 0, e.data.dropped ?? 0)
        refreshCount()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener(QUEUE_EVENT, refreshCount)
    navigator.serviceWorker?.addEventListener('message', handleSwMessage)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener(QUEUE_EVENT, refreshCount)
      navigator.serviceWorker?.removeEventListener('message', handleSwMessage)
    }
  }, [sync, onFlushed, refreshCount])

  // Once per session, visit the main screens so they are cached for offline use
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!navigator.onLine || !localStorage.getItem('notekori_token')) return
    if (sessionStorage.getItem(WARM_KEY)) return

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(WARM_KEY, '1')
      WARM_ROUTES.forEach((r) => fetch(r, { credentials: 'same-origin' }).catch(() => {}))
      WARM_API.forEach((r) => api.get(r).catch(() => {}))
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [])

  if (online && pending === 0) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center gap-3 rounded-full border bg-card px-4 py-2 text-sm shadow-lg">
        {online ? (
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        ) : (
          <CloudOff className="h-4 w-4" />
        )}
        <span>
          {!online
            ? pending > 0 ? `Offline · ${plural(pending)} waiting to sync` : "You're offline · showing saved data"
            : syncing ? `Syncing ${plural(pending)}…` : `${plural(pending)} waiting to sync`}
        </span>
        {online && !syncing && pending > 0 && (
          <button type="button" onClick={() => void sync()} className="font-medium underline underline-offset-2">
            Sync now
          </button>
        )}
      </div>
    </div>
  )
}
