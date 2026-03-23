import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, gte, lte, like, desc, sql } from 'drizzle-orm'
import { getDb, type Env } from '../lib/db'
import { transactions } from '../db/schema'
import type { AuthVariables } from '../lib/middleware'
import { v4 as uuidv4 } from 'uuid'

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  title: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
  date: z.string().datetime(),
  isRecurring: z.boolean().default(false),
  recurringId: z.string().optional(),
})

const filterSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  query: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20),
})

const route = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// GET /api/transactions
route.get('/', zValidator('query', filterSchema), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { type, categoryId, from, to, query, page, limit } = c.req.valid('query')
  const offset = (page - 1) * limit

  const conditions = [eq(transactions.userId, userId)]
  if (type) conditions.push(eq(transactions.type, type))
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId))
  if (from) conditions.push(gte(transactions.date, from))
  if (to) conditions.push(lte(transactions.date, to))
  if (query) conditions.push(like(transactions.title, `%${query}%`))

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(...conditions)),
  ])

  return c.json({
    data: rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  })
})

// POST /api/transactions
route.post('/', zValidator('json', transactionSchema), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const body = c.req.valid('json')
  const now = new Date().toISOString()
  const id = uuidv4()

  await db.insert(transactions).values({
    id,
    userId,
    ...body,
    tags: JSON.stringify(body.tags),
    createdAt: now,
    updatedAt: now,
  })

  return c.json({ data: { id, ...body } }, 201)
})

// GET /api/transactions/:id
route.get('/:id', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()

  const [tx] = await db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1)

  if (!tx) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: tx })
})

// PATCH /api/transactions/:id
route.patch('/:id', zValidator('json', transactionSchema.partial()), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()
  const body = c.req.valid('json')

  const [existing] = await db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1)

  if (!existing) return c.json({ error: 'Not found' }, 404)

  await db.update(transactions)
    .set({
      ...body,
      tags: body.tags ? JSON.stringify(body.tags) : undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(transactions.id, id))

  return c.json({ success: true })
})

// DELETE /api/transactions/:id
route.delete('/:id', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()

  const [existing] = await db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1)

  if (!existing) return c.json({ error: 'Not found' }, 404)

  await db.delete(transactions).where(eq(transactions.id, id))
  return c.json({ success: true })
})

export { route as transactionsRoute }
