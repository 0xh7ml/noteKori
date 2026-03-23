import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Category } from '@notekori/types'

export const catKeys = {
  all:  ['categories'] as const,
  list: () => ['categories', 'list'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: catKeys.list(),
    queryFn:  () => api.get<{ data: Category[] }>('/api/categories').then(r => r.data.data),
    staleTime: 5 * 60_000,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Pick<Category, 'name' | 'icon' | 'color' | 'type'>) =>
      api.post('/api/categories', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: catKeys.all }),
  })
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'type'>>) =>
      api.patch(`/api/categories/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: catKeys.all }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/categories/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: catKeys.all }),
  })
}
