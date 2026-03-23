import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'

export type Env = {
  DB: D1Database
  AUTH_SECRET: string
  FRONTEND_URL: string
}

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema })
}
