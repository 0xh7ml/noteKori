import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { Env } from './lib/db'
import { authRoute } from './routes/auth'
import { transactionsRoute } from './routes/transactions'
import { categoriesRoute } from './routes/categories'
import { analyticsRoute } from './routes/analytics'
import { requireAuth } from './lib/middleware'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: (_, c) => c.env.FRONTEND_URL,
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// Public routes - Better Auth handles internally
app.route('/api/auth', authRoute)

// Protected routes - all require valid session
app.use('/api/*', requireAuth)
app.route('/api/transactions', transactionsRoute)
app.route('/api/categories', categoriesRoute)
app.route('/api/analytics', analyticsRoute)

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

export default app
