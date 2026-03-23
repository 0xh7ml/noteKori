'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { api } from './api'

export interface User {
  id: string
  email: string
  name: string
  currency: string
  dateFormat: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => void
  refreshUser: () => Promise<void>
}

// Token storage
const TOKEN_KEY = 'notekori_token'

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export const setStoredToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeStoredToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

// Auth API functions
export const authAPI = {
  signIn: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/api/auth/login', { email, password })
    const { user, token } = response.data.data

    setStoredToken(token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    return { user, token }
  },

  signUp: async (email: string, password: string, name: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/api/auth/register', { email, password, name })
    const { user, token } = response.data.data

    setStoredToken(token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    return { user, token }
  },

  signOut: (): void => {
    removeStoredToken()
    delete api.defaults.headers.common['Authorization']
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = getStoredToken()
      if (!token) return null

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await api.get('/api/auth/me')
      return response.data.data
    } catch (error) {
      // Token is invalid, remove it
      removeStoredToken()
      delete api.defaults.headers.common['Authorization']
      return null
    }
  }
}

// Auth Context
const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken()
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const user = await authAPI.getCurrentUser()
        if (user) {
          setState({
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
          })
          return
        }
      }

      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }

    initAuth()
  }, [])

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const { user, token } = await authAPI.signIn(email, password)
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  const handleSignUp = useCallback(async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const { user, token } = await authAPI.signUp(email, password, name)
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  const handleSignOut = useCallback(() => {
    authAPI.signOut()
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }, [])

  const refreshUser = useCallback(async () => {
    if (!state.token) return
    try {
      const user = await authAPI.getCurrentUser()
      if (user) {
        setState(prev => ({ ...prev, user }))
      } else {
        handleSignOut()
      }
    } catch (error) {
      handleSignOut()
    }
  }, [state.token, handleSignOut])

  const value: AuthContextType = {
    ...state,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook for using auth
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Legacy exports for backward compatibility
export const signIn = authAPI.signIn
export const signUp = authAPI.signUp
export const signOut = authAPI.signOut
export const getCurrentUser = authAPI.getCurrentUser
