// Shared types between frontend and backend

export type TransactionType = 'income' | 'expense'
export type CategoryType = 'income' | 'expense' | 'both'
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface User {
  id: string
  email: string
  name: string
  currency: string
  dateFormat: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  categoryId: string
  title: string
  notes?: string | null
  tags: string // JSON array string
  date: string
  isRecurring: boolean
  recurringId?: string | null
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  userId: string
  name: string
  icon: string
  color: string
  type: CategoryType
  isDefault: boolean
  createdAt: string
}

export interface RecurringTransaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  categoryId: string
  title: string
  notes?: string | null
  frequency: RecurringFrequency
  startDate: string
  endDate?: string | null
  nextDueDate: string
  isActive: boolean
  createdAt: string
}

export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AnalyticsSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  count: number
}

export interface CategoryBreakdown {
  categoryId: string
  name: string
  icon: string
  color: string
  total: number
  percentage: number
}

export interface TrendData {
  date: string
  income: number
  expense: number
}

export interface MonthlyTrendData {
  month: string
  income: number
  expense: number
}
