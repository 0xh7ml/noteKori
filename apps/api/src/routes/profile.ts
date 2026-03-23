import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { getDb, type Env } from '../lib/db'
import { users } from '../db/schema'
import type { AuthVariables } from '../lib/middleware'

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  currency: z.string().length(3).optional(),
  dateFormat: z.string().optional(),
})

const route = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// GET /api/profile
route.get('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')

  const [user] = await db.select().from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) return c.json({ error: 'User not found' }, 404)

  return c.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      dateFormat: user.dateFormat,
      createdAt: user.createdAt,
    },
  })
})

// PATCH /api/profile
route.patch('/', zValidator('json', profileSchema), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const body = c.req.valid('json')

  const [user] = await db.select().from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) return c.json({ error: 'User not found' }, 404)

  const updates: any = {}
  if (body.name) updates.name = body.name
  if (body.currency) updates.currency = body.currency
  if (body.dateFormat) updates.dateFormat = body.dateFormat
  if (body.email) updates.email = body.email

  if (Object.keys(updates).length === 0) {
    return c.json({ data: user })
  }

  updates.updatedAt = new Date().toISOString()

  await db.update(users)
    .set(updates)
    .where(eq(users.id, userId))

  return c.json({ success: true })
})

export { route as profileRoute }
