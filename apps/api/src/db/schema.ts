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
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurringId: text('recurring_id'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index('tx_user_idx').on(t.userId),
  dateIdx: index('tx_date_idx').on(t.date),
  typeIdx: index('tx_type_idx').on(t.type),
  categoryIdx: index('tx_category_idx').on(t.categoryId),
}))

// ─── Recurring Transactions ───────────────────────────────────────────────────
export const recurringTransactions = sqliteTable('recurring_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  amount: real('amount').notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  title: text('title').notNull(),
  notes: text('notes'),
  frequency: text('frequency', { enum: ['daily', 'weekly', 'monthly', 'yearly'] }).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'), // NULL = indefinite
  nextDueDate: text('next_due_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index('recurring_user_idx').on(t.userId),
  dueDateIdx: index('recurring_due_idx').on(t.nextDueDate),
}))

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type RecurringTransaction = typeof recurringTransactions.$inferSelect
export type NewRecurringTransaction = typeof recurringTransactions.$inferInsert
