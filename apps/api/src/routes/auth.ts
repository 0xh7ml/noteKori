import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { createUser, loginUser } from '../lib/auth'
import type { Env } from '../lib/db'

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const authRoute = new Hono<{ Bindings: Env }>()

// POST /api/auth/register
authRoute.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password, name } = c.req.valid('json')

    const { user, token } = await createUser(c.env, email, password, name)

    // Remove password from response
    const { password: _, ...userResponse } = user

    return c.json({
      data: {
        user: userResponse,
        token,
      },
    }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed'
    return c.json({ error: message }, 400)
  }
})

// POST /api/auth/login
authRoute.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')

    const { user, token } = await loginUser(c.env, email, password)

    // Remove password from response
    const { password: _, ...userResponse } = user

    return c.json({
      data: {
        user: userResponse,
        token,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    return c.json({ error: message }, 401)
  }
})

// POST /api/auth/logout
authRoute.post('/logout', async (c) => {
  // For JWT, logout is handled client-side by removing the token
  // No server-side session to invalidate
  return c.json({ message: 'Logged out successfully' })
})

export { authRoute }
