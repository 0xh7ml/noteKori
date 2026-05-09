import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787',
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

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      // Clear both localStorage and cookie
      localStorage.removeItem('notekori_token')
      document.cookie = 'notekori_token=; path=/; max-age=0; SameSite=Lax'
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
