'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'

/**
 * Use in protected pages. Redirects to /login if not authenticated.
 * Returns true once the auth check is complete and user is verified.
 */
export function useAuthGuard(): { ready: boolean } {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  return { ready: !isLoading && isAuthenticated }
}
