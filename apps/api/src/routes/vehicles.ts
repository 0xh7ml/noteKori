import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getDb, type Env } from '../lib/db'
import { vehicles, vehicleLogs } from '../db/schema'
import type { AuthVariables } from '../lib/middleware'

const vehicleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  type: z.enum(['bike', 'car', 'other']),
  fuelType: z.enum(['petrol', 'diesel', 'electric']),
  initialKm: z.number().min(0).default(0),
})

const logSchema = z.object({
  id: z.string().uuid().optional(),
  logType: z.enum(['fuel', 'maintenance', 'other']),
  currentKm: z.number().min(0),
  fuelLiters: z.number().positive().nullable().optional(),
  fuelAmount: z.number().min(0).nullable().optional(),
  otherAmount: z.number().min(0).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  date: z.string().datetime(),
}).refine(
  (v) => v.logType !== 'fuel' || (v.fuelLiters != null && v.fuelAmount != null),
  { message: 'Fuel logs need liters and amount', path: ['fuelLiters'] },
)

const logQuerySchema = z.object({
  type: z.enum(['fuel', 'maintenance', 'other']).optional(),
})

const route = new Hono<{ Bindings: Env; Variables: AuthVariables }>()

async function findVehicle(c: { env: Env }, userId: string, id: string) {
  const db = getDb(c.env.DB)
  const [vehicle] = await db.select().from(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.userId, userId)))
    .limit(1)
  return vehicle
}

// GET /api/vehicles
route.get('/', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const rows = await db.select().from(vehicles)
    .where(eq(vehicles.userId, userId))
    .orderBy(desc(vehicles.createdAt))
  return c.json({ data: rows })
})

// POST /api/vehicles
route.post('/', zValidator('json', vehicleSchema), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id: clientId, ...body } = c.req.valid('json')
  const id = clientId ?? uuidv4()

  await db.insert(vehicles).values({
    id,
    userId,
    ...body,
    createdAt: new Date().toISOString(),
  }).onConflictDoNothing()

  return c.json({ data: { id, ...body } }, 201)
})

// PATCH /api/vehicles/:id
route.patch('/:id', zValidator('json', vehicleSchema.omit({ id: true }).partial()), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()
  const body = c.req.valid('json')

  if (!(await findVehicle(c, userId, id))) return c.json({ error: 'Not found' }, 404)

  await db.update(vehicles).set(body).where(eq(vehicles.id, id))
  return c.json({ success: true })
})

// DELETE /api/vehicles/:id
route.delete('/:id', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()

  if (!(await findVehicle(c, userId, id))) return c.json({ error: 'Not found' }, 404)

  await db.batch([
    db.delete(vehicleLogs).where(eq(vehicleLogs.vehicleId, id)),
    db.delete(vehicles).where(eq(vehicles.id, id)),
  ])
  return c.json({ success: true })
})

// GET /api/vehicles/:id/logs
route.get('/:id/logs', zValidator('query', logQuerySchema), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id } = c.req.param()
  const { type } = c.req.valid('query')

  if (!(await findVehicle(c, userId, id))) return c.json({ error: 'Not found' }, 404)

  const conditions = [eq(vehicleLogs.vehicleId, id), eq(vehicleLogs.userId, userId)]
  if (type) conditions.push(eq(vehicleLogs.logType, type))

  const rows = await db.select().from(vehicleLogs)
    .where(and(...conditions))
    .orderBy(desc(vehicleLogs.date), desc(vehicleLogs.currentKm))

  return c.json({ data: rows })
})

// POST /api/vehicles/:id/logs
route.post('/:id/logs', zValidator('json', logSchema), async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id: vehicleId } = c.req.param()
  const { id: clientId, ...body } = c.req.valid('json')
  const id = clientId ?? uuidv4()

  if (!(await findVehicle(c, userId, vehicleId))) return c.json({ error: 'Not found' }, 404)

  await db.insert(vehicleLogs).values({ id, vehicleId, userId, ...body }).onConflictDoNothing()
  return c.json({ data: { id, ...body } }, 201)
})

// DELETE /api/vehicles/:id/logs/:lid
route.delete('/:id/logs/:lid', async (c) => {
  const db = getDb(c.env.DB)
  const userId = c.get('userId')
  const { id: vehicleId, lid } = c.req.param()

  if (!(await findVehicle(c, userId, vehicleId))) return c.json({ error: 'Not found' }, 404)

  const [log] = await db.select({ id: vehicleLogs.id }).from(vehicleLogs)
    .where(and(eq(vehicleLogs.id, lid), eq(vehicleLogs.vehicleId, vehicleId)))
    .limit(1)
  if (!log) return c.json({ error: 'Not found' }, 404)

  await db.delete(vehicleLogs).where(eq(vehicleLogs.id, lid))
  return c.json({ success: true })
})

export { route as vehiclesRoute }
