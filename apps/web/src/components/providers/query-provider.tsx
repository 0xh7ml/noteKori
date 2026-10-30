'use client'

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query'
import { useState, useRef } from 'react'

// Browser singleton to prevent recreating the client
let browserQueryClient: QueryClient | undefined

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        networkMode: 'offlineFirst', // try the network/SW cache once, keep showing cached data offline
      },
      mutations: {
        networkMode: 'always', // offline writes are queued in IndexedDB by the axios interceptor
      },
    },
  })
}

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return makeQueryClient()
  } else {
    // Browser: create once and reuse
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Use ref to store the client to prevent re-renders
  const queryClientRef = useRef<QueryClient>()

  if (!queryClientRef.current) {
    queryClientRef.current = getQueryClient()
  }

  return (
    <TanstackQueryClientProvider client={queryClientRef.current}>
      {children}
    </TanstackQueryClientProvider>
  )
}
