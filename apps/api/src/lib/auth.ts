import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { getDb, type Env } from './db'
import { users, type User, type NewUser } from '../db/schema'
import { createToken } from './jwt'
import { v4 as uuidv4 } from 'uuid'

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create user
export async function createUser(
  env: Env,
  email: string,
  password: string,
  name: string
): Promise<{ user: User; token: string }> {
  const db = getDb(env.DB)

  // Check if user exists
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    throw new Error('User already exists')
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user
  const userId = uuidv4()
  const now = new Date().toISOString()

  await db.insert(users).values({
    id: userId,
    email,
    password: hashedPassword,
    name,
    currency: 'USD',
    dateFormat: 'MMM d, yyyy',
    createdAt: now,
    updatedAt: now,
  })

  // Get created user
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  // Create token
  const token = await createToken(userId, email, env.AUTH_SECRET)

  return { user, token }
}

// Login user
export async function loginUser(
  env: Env,
  email: string,
  password: string
): Promise<{ user: User; token: string }> {
  const db = getDb(env.DB)

  // Find user
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    throw new Error('Invalid credentials')
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    throw new Error('Invalid credentials')
  }

  // Create token
  const token = await createToken(user.id, user.email, env.AUTH_SECRET)

  return { user, token }
}

// Get user by ID
export async function getUserById(env: Env, userId: string): Promise<User | null> {
  const db = getDb(env.DB)
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user || null
}
