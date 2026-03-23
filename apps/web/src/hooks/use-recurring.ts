import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { RecurringTransaction } from '@notekori/types'

export const recurringKeys = {
  all:  ['recurring'] as const,
  list: () => ['recurring', 'list'] as const,
}

export function useRecurring() {
  return useQuery({
    queryKey: recurringKeys.list(),
    queryFn:  () =>
      api.get<{ data: RecurringTransaction[] }>('/api/recurring').then(r => r.data.data),
    staleTime: 60_000,
  })
}

export function useCreateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>) =>
      api.post('/api/recurring', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringKeys.all }),
  })
}

export function useUpdateRecurring(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<RecurringTransaction>) =>
      api.patch(`/api/recurring/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringKeys.all }),
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/recurring/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringKeys.all }),
  })
}
