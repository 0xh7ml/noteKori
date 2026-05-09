'use client'

import {
  useState, useEffect, createContext, useContext, useCallback, useRef
} from 'react'
import { api } from './api'

export interface User {
  id: string
  email: string
  name: string
  currency: string | null
  dateFormat: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => void
  refreshUser: () => Promise<void>
  updateUser: (user: Partial<User>) => void
}

const TOKEN_KEY = 'notekori_token'

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

const setStoredToken = (token: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  // Also set cookie for middleware auth checks
  document.cookie = `notekori_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
}

const removeStoredToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  // Also remove cookie
  document.cookie = 'notekori_token=; path=/; max-age=0; SameSite=Lax'
}

const setAuthHeader = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const clearAuthHeader = () => {
  delete api.defaults.headers.common['Authorization']
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })
  const initialised = useRef(false)

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true

    const init = async () => {
      const token = getStoredToken()
      if (!token) {
        setState(s => ({ ...s, isLoading: false }))
        return
      }
      setAuthHeader(token)
      try {
        const res = await api.get<{ data: User }>('/api/profile')
        setState({ user: res.data.data, token, isLoading: false, isAuthenticated: true })
      } catch {
        removeStoredToken()
        clearAuthHeader()
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false })
      }
    }
    init()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, isLoading: true }))
    try {
      const res = await api.post('/api/auth/login', { email, password })
      const { user, token } = res.data.data
      setStoredToken(token)
      setAuthHeader(token)
      setState({ user, token, isLoading: false, isAuthenticated: true })
    } catch (err) {
      setState(s => ({ ...s, isLoading: false }))
      throw err
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setState(s => ({ ...s, isLoading: true }))
    try {
      const res = await api.post('/api/auth/register', { email, password, name })
      const { user, token } = res.data.data
      setStoredToken(token)
      setAuthHeader(token)
      setState({ user, token, isLoading: false, isAuthenticated: true })
    } catch (err) {
      setState(s => ({ ...s, isLoading: false }))
      throw err
    }
  }, [])

  const signOut = useCallback(() => {
    removeStoredToken()
    clearAuthHeader()
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false })
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getStoredToken()
    if (!token) return
    try {
      const res = await api.get<{ data: User }>('/api/profile')
      setState(s => ({ ...s, user: res.data.data }))
    } catch {
      signOut()
    }
  }, [signOut])

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(s => s.user ? { ...s, user: { ...s.user, ...updates } } : s)
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
