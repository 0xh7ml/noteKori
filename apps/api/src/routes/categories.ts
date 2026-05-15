import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, or, sql } from 'drizzle-orm'
import { getDb, type Env } from '../lib/db'
import { categories } from '../db/schema'
import type { AuthVariables } from '../lib/middleware'
import { v4 as uuidv4 } from 'uuid'

const categorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  type: z.enum(['income', 'expense', 'both']),
})

const route = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// GET /api/categories - Get system + user categories
route.get('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')

  // Get both system categories and user's custom categories
  const rows = await db.select().from(categories)
    .where(
      or(
        eq(categories.userId, 'system'),
        eq(categories.userId, userId)
      )
    )
    .orderBy(categories.isDefault, categories.name)

  return c.json({ data: rows })
})

// POST /api/categories - Create custom category
route.post('/', zValidator('json', categorySchema), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const body = c.req.valid('json')
  const id = uuidv4()
  const now = new Date().toISOString()

  await db.insert(categories).values({
    id,
    userId,
    ...body,
    isDefault: false,
    createdAt: now,
  })

  return c.json({ data: { id, ...body } }, 201)
})

// PATCH /api/categories/:id - Update custom category
route.patch('/:id', zValidator('json', categorySchema.partial()), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()
  const body = c.req.valid('json')

  // Check ownership
  const [cat] = await db.select().from(categories)
    .where(eq(categories.id, id))
    .limit(1)

  if (!cat) return c.json({ error: 'Not found' }, 404)
  if (cat.isDefault) return c.json({ error: 'Cannot modify system categories' }, 403)
  if (cat.userId !== userId) return c.json({ error: 'Forbidden' }, 403)

  await db.update(categories)
    .set(body)
    .where(eq(categories.id, id))

  return c.json({ success: true })
})

// DELETE /api/categories/:id - Delete custom category
route.delete('/:id', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()

  // Check ownership
  const [cat] = await db.select().from(categories)
    .where(eq(categories.id, id))
    .limit(1)

  if (!cat) return c.json({ error: 'Not found' }, 404)
  if (cat.isDefault) return c.json({ error: 'Cannot modify system categories' }, 403)
  if (cat.userId !== userId) return c.json({ error: 'Forbidden' }, 403)

  await db.delete(categories).where(eq(categories.id, id))
  return c.json({ success: true })
})

export { route as categoriesRoute }
