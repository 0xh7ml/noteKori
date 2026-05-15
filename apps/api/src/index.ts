import { Hono } from 'hono'
import { cors }   from 'hono/cors'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import type { Env } from './lib/db'
import { authRoute }         from './routes/auth'
import { transactionsRoute } from './routes/transactions'
import { categoriesRoute }   from './routes/categories'
import { analyticsRoute }    from './routes/analytics'
import { profileRoute }      from './routes/profile'
import { requireAuth }       from './lib/middleware'

const app = new Hono<{ Bindings: Env }>()

// ── CORS middleware (must be first, before auth) ──────────────────────────────
app.use('*', cors({
  origin:       (_, c) => c.env.FRONTEND_URL ?? '*',
  credentials:  true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge:       86400,
}))

// ── Logger middleware ───────────────────────────────────────────────────────────
app.use('*', logger())

// ── Error handler ──────────────────────────────────────────────────────────────
app.onError((err, c) => {
  if (err instanceof ZodError) {
    const message = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    return c.json({ error: message }, 400)
  }
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

// ── Public routes ──────────────────────────────────────────────────────────────
app.route('/api/auth', authRoute)

// ── Protected routes ───────────────────────────────────────────────────────────
app.use('/api/*', requireAuth)
app.route('/api/transactions', transactionsRoute)
app.route('/api/categories',   categoriesRoute)
app.route('/api/analytics',    analyticsRoute)
app.route('/api/profile',      profileRoute)

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

// ── Cloudflare Worker export ────────────────────────────────────────────────────
export default app