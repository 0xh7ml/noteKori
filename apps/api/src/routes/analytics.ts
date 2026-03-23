import { Hono } from 'hono'
import { sql, and, eq, gte, lte } from 'drizzle-orm'
import { transactions, categories } from '../db/schema'
import { getDb, type Env } from '../lib/db'
import type { AuthVariables } from '../lib/middleware'

const route = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

// GET /api/analytics/summary?from=&to=
route.get('/summary', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { from, to } = c.req.query()

  const conditions = [eq(transactions.userId, userId)]
  if (from) conditions.push(gte(transactions.date, from))
  if (to) conditions.push(lte(transactions.date, to))

  const [result] = await db.select({
    totalIncome: sql<number>`COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0)`,
    totalExpense: sql<number>`COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(transactions).where(and(...conditions))

  return c.json({
    data: {
      ...result,
      balance: result.totalIncome - result.totalExpense,
    },
  })
})

// GET /api/analytics/by-category?from=&to=&type=expense
route.get('/by-category', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { from, to, type = 'expense' } = c.req.query()

  const rows = await db
    .select({
      categoryId: categories.id,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(categories)
    .leftJoin(transactions, and(
      eq(transactions.categoryId, categories.id),
      eq(transactions.userId, userId),
      eq(transactions.type, type as 'income' | 'expense'),
      from ? gte(transactions.date, from) : sql`1=1`,
      to ? lte(transactions.date, to) : sql`1=1`,
    ))
    .where(sql`${categories.userId} IN ('system', ${userId})`)
    .groupBy(categories.id)
    .having(sql`COALESCE(SUM(${transactions.amount}), 0) > 0`)
    .orderBy(sql`COALESCE(SUM(${transactions.amount}), 0) DESC`)

  const grandTotal = rows.reduce((s, r) => s + r.total, 0)

  return c.json({
    data: rows.map((r) => ({
      ...r,
      percentage: grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0,
    })),
  })
})

// GET /api/analytics/daily-trend?from=&to=
route.get('/daily-trend', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { from, to } = c.req.query()

  const conditions = [eq(transactions.userId, userId)]
  if (from) conditions.push(gte(transactions.date, from))
  if (to) conditions.push(lte(transactions.date, to))

  const rows = await db.select({
    date: sql<string>`DATE(${transactions.date})`,
    income: sql<number>`COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0)`,
    expense: sql<number>`COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)`,
  })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(sql`DATE(${transactions.date})`)
    .orderBy(sql`DATE(${transactions.date})`)

  return c.json({ data: rows })
})

// GET /api/analytics/monthly-trend?months=6
route.get('/monthly-trend', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const months = parseInt(c.req.query('months') ?? '6')

  const rows = await db.select({
    month: sql<string>`strftime('%Y-%m', ${transactions.date})`,
    income: sql<number>`COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0)`,
    expense: sql<number>`COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)`,
  })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      gte(transactions.date, sql`datetime('now', ${`-${months} months`})`),
    ))
    .groupBy(sql`strftime('%Y-%m', ${transactions.date})`)
    .orderBy(sql`strftime('%Y-%m', ${transactions.date})`)

  return c.json({ data: rows })
})

export { route as analyticsRoute }
