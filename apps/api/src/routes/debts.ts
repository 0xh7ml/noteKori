import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getDb, type Env } from '../lib/db'
import { debts, debtPayments } from '../db/schema'
import type { AuthVariables } from '../lib/middleware'

const EPSILON = 0.005

const debtSchema = z.object({
  id: z.string().uuid().optional(), // client-generated so offline-created debts can receive payments
  title: z.string().min(1).max(100),
  type: z.enum(['debt', 'loan']),
  totalAmount: z.number().positive(),
  dueDate: z.string().datetime().nullable().optional(),
  counterparty: z.string().max(100).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

const paymentSchema = z.object({
  id: z.string().uuid().optional(),
  amount: z.number().positive(),
  date: z.string().datetime(),
  notes: z.string().max(500).nullable().optional(),
})

const listSchema = z.object({
  status: z.enum(['active', 'settled']).optional(),
  type: z.enum(['debt', 'loan']).optional(),
})

const route = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

async function findDebt(c: { env: Env }, userId: string, id: string) {
  const db = getDb(c.env.DB)
  const [debt] = await db.select().from(debts)
    .where(and(eq(debts.id, id), eq(debts.userId, userId)))
    .limit(1)
  return debt
}

function settle(total: number, paid: number) {
  return paid >= total - EPSILON ? 'settled' as const : 'active' as const
}

// GET /api/debts
route.get('/', zValidator('query', listSchema), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { status, type } = c.req.valid('query')

  const conditions = [eq(debts.userId, userId)]
  if (status) conditions.push(eq(debts.status, status))
  if (type) conditions.push(eq(debts.type, type))

  const rows = await db.select().from(debts)
    .where(and(...conditions))
    .orderBy(desc(debts.createdAt))

  return c.json({ data: rows })
})

// POST /api/debts
route.post('/', zValidator('json', debtSchema), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id: clientId, ...body } = c.req.valid('json')
  const id = clientId ?? uuidv4()

  await db.insert(debts).values({
    id,
    userId,
    ...body,
    paidAmount: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  }).onConflictDoNothing()

  return c.json({ data: { id, ...body } }, 201)
})

// PATCH /api/debts/:id
route.patch('/:id', zValidator('json', debtSchema.omit({ id: true }).partial()), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()
  const body = c.req.valid('json')

  const existing = await findDebt(c, userId, id)
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const total = body.totalAmount ?? existing.totalAmount
  await db.update(debts)
    .set({ ...body, status: settle(total, existing.paidAmount) })
    .where(eq(debts.id, id))

  return c.json({ success: true })
})

// DELETE /api/debts/:id
route.delete('/:id', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()

  const existing = await findDebt(c, userId, id)
  if (!existing) return c.json({ error: 'Not found' }, 404)

  await db.batch([
    db.delete(debtPayments).where(eq(debtPayments.debtId, id)),
    db.delete(debts).where(eq(debts.id, id)),
  ])
  return c.json({ success: true })
})

// GET /api/debts/:id/payments
route.get('/:id/payments', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()

  const existing = await findDebt(c, userId, id)
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const rows = await db.select().from(debtPayments)
    .where(and(eq(debtPayments.debtId, id), eq(debtPayments.userId, userId)))
    .orderBy(desc(debtPayments.date))

  return c.json({ data: rows })
})

// POST /api/debts/:id/payments
route.post('/:id/payments', zValidator('json', paymentSchema), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id: debtId } = c.req.param()
  const { id: clientId, ...body } = c.req.valid('json')
  const id = clientId ?? uuidv4()

  const debt = await findDebt(c, userId, debtId)
  if (!debt) return c.json({ error: 'Not found' }, 404)

  // Replayed offline request that already landed: succeed without double-counting
  const [dup] = await db.select({ id: debtPayments.id }).from(debtPayments)
    .where(eq(debtPayments.id, id)).limit(1)
  if (dup) return c.json({ data: { id, ...body } }, 201)

  const remaining = debt.totalAmount - debt.paidAmount
  if (body.amount > remaining + EPSILON) {
    return c.json({ error: `Payment exceeds remaining balance (${remaining.toFixed(2)})` }, 400)
  }

  const paidAmount = debt.paidAmount + body.amount
  await db.batch([
    db.insert(debtPayments).values({ id, debtId, userId, ...body }),
    db.update(debts)
      .set({ paidAmount, status: settle(debt.totalAmount, paidAmount) })
      .where(eq(debts.id, debtId)),
  ])

  return c.json({ data: { id, ...body } }, 201)
})

// DELETE /api/debts/:id/payments/:pid
route.delete('/:id/payments/:pid', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id: debtId, pid } = c.req.param()

  const debt = await findDebt(c, userId, debtId)
  if (!debt) return c.json({ error: 'Not found' }, 404)

  const [payment] = await db.select().from(debtPayments)
    .where(and(eq(debtPayments.id, pid), eq(debtPayments.debtId, debtId)))
    .limit(1)
  if (!payment) return c.json({ error: 'Not found' }, 404)

  const paidAmount = Math.max(0, debt.paidAmount - payment.amount)
  await db.batch([
    db.delete(debtPayments).where(eq(debtPayments.id, pid)),
    db.update(debts)
      .set({ paidAmount, status: settle(debt.totalAmount, paidAmount) })
      .where(eq(debts.id, debtId)),
  ])

  return c.json({ success: true })
})

export { route as debtsRoute }
