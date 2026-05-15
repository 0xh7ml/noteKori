import { createMiddleware } from 'hono/factory'
import { verifyToken } from './jwt'
import { getUserById } from './auth'
import type { Env } from './db'

export type AuthVariables = {
  userId: string
  user: {
    id: string
    email: string
    name: string
    currency: string
    dateFormat: string
  }
}

export const requireAuth = createMiddleware<{
  Bindings: Env
  Variables: AuthVariables
}>(async (c, next) => {
  // Skip auth for OPTIONS preflight requests (handled by CORS middleware)
  if (c.req.method === 'OPTIONS') {
    return next()
  }

  // Get token from Authorization header
  const authorization = c.req.header('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authorization.slice(7) // Remove 'Bearer ' prefix

  // Verify JWT token
  const payload = await verifyToken(token, c.env.AUTH_SECRET)
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Get user details
  const user = await getUserById(c.env, payload.userId)
  if (!user) {
    return c.json({ error: 'User not found' }, 401)
  }

  // Set user context
  c.set('userId', user.id)
  c.set('user', {
    id: user.id,
    email: user.email,
    name: user.name,
    currency: user.currency,
    dateFormat: user.dateFormat,
  })

  await next()
})
