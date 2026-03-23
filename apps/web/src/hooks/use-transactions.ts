import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Transaction, PaginatedResponse } from '@notekori/types'

export interface TransactionFilters {
  type?: 'income' | 'expense'
  categoryId?: string
  from?: string
  to?: string
  query?: string
  page?: number
  limit?: number
}

export const txKeys = {
  all:    ['transactions'] as const,
  list:   (f: TransactionFilters) => ['transactions', 'list', f] as const,
  detail: (id: string)            => ['transactions', 'detail', id] as const,
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: txKeys.list(filters),
    queryFn:  () =>
      api.get<PaginatedResponse<Transaction>>('/api/transactions', { params: filters })
         .then(r => r.data),
    staleTime: 30_000,
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: txKeys.detail(id),
    queryFn:  () => api.get<{ data: Transaction }>(`/api/transactions/${id}`).then(r => r.data.data),
    enabled:  !!id,
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      api.post('/api/transactions', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txKeys.all })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Transaction>) =>
      api.patch(`/api/transactions/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txKeys.all })
      qc.invalidateQueries({ queryKey: txKeys.detail(id) })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/transactions/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txKeys.all })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}
