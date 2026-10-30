import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // bcrypt hashed
  name: text('name').notNull(),
  currency: text('currency').default('USD'),
  dateFormat: text('date_format').default('MMM d, yyyy'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
}, (t) => ({
  emailIdx: index('users_email_idx').on(t.email),
}))

// ─── Categories ──────────────────────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // 'system' for defaults
  name: text('name').notNull(),
  icon: text('icon').notNull(), // lucide icon name e.g. "utensils"
  color: text('color').notNull(), // hex e.g. "#ef4444"
  type: text('type', { enum: ['income', 'expense', 'both'] }).notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index('categories_user_idx').on(t.userId),
}))

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  amount: real('amount').notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  title: text('title').notNull(),
  notes: text('notes'),
  tags: text('tags').default('[]'), // JSON array string
  date: text('date').notNull(), // ISO 8601
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index('tx_user_idx').on(t.userId),
  dateIdx: index('tx_date_idx').on(t.date),
  typeIdx: index('tx_type_idx').on(t.type),
  categoryIdx: index('tx_category_idx').on(t.categoryId),
}))

// ─── Debts ────────────────────────────────────────────────────────────────────
export const debts = sqliteTable('debts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  type: text('type', { enum: ['debt', 'loan'] }).notNull(), // debt = I owe, loan = owed to me
  totalAmount: real('total_amount').notNull(),
  paidAmount: real('paid_amount').notNull().default(0),
  dueDate: text('due_date'),
  counterparty: text('counterparty'),
  notes: text('notes'),
  status: text('status', { enum: ['active', 'settled'] }).notNull().default('active'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index('debts_user_idx').on(t.userId),
}))

export const debtPayments = sqliteTable('debt_payments', {
  id: text('id').primaryKey(),
  debtId: text('debt_id').notNull().references(() => debts.id),
  userId: text('user_id').notNull(),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
}, (t) => ({
  debtIdx: index('debt_payments_debt_idx').on(t.debtId),
}))

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const vehicles = sqliteTable('vehicles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type', { enum: ['bike', 'car', 'other'] }).notNull(),
  fuelType: text('fuel_type', { enum: ['petrol', 'diesel', 'electric'] }).notNull(),
  initialKm: real('initial_km').notNull().default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index('vehicles_user_idx').on(t.userId),
}))

export const vehicleLogs = sqliteTable('vehicle_logs', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id),
  userId: text('user_id').notNull(),
  logType: text('log_type', { enum: ['fuel', 'maintenance', 'other'] }).notNull(),
  currentKm: real('current_km').notNull(),
  fuelLiters: real('fuel_liters'),
  fuelAmount: real('fuel_amount'),
  otherAmount: real('other_amount'),
  notes: text('notes'),
  date: text('date').notNull(),
}, (t) => ({
  vehicleIdx: index('vehicle_logs_vehicle_idx').on(t.vehicleId),
  dateIdx: index('vehicle_logs_date_idx').on(t.date),
}))

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Debt = typeof debts.$inferSelect
export type DebtPayment = typeof debtPayments.$inferSelect
export type Vehicle = typeof vehicles.$inferSelect
export type VehicleLog = typeof vehicleLogs.$inferSelect
