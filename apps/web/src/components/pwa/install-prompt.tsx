'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'notekori_install_dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

export function InstallPrompt() {
  const [mode, setMode] = useState<'android' | 'ios' | null>(null)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) || isStandalone()) return
    } catch {
      return
    }

    let timer: number | undefined
    if (isIos()) {
      timer = window.setTimeout(() => setMode('ios'), 5000)
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setMode('android')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ }
    setMode(null)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    dismiss()
  }

  if (!mode) return null

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center px-4">
      <div className="flex w-full max-w-md items-start gap-3 rounded-lg border bg-card p-4 shadow-lg">
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">Install NoteKori</p>
          {mode === 'ios' ? (
            <p className="mt-1 text-muted-foreground">
              Tap <Share className="mx-0.5 inline h-4 w-4 align-text-bottom" /> then
              &ldquo;Add to Home Screen&rdquo; to use it like an app, even offline.
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Add it to your home screen to open it like an app and log entries offline.
            </p>
          )}
          {mode === 'android' && (
            <Button size="sm" className="mt-3 gap-2" onClick={install}>
              <Download className="h-4 w-4" />
              Install
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Dismiss" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
