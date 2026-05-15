import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface UserProfile {
  id: string
  name: string
  email: string
  currency: string
  dateFormat: string
  createdAt: string
}

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => ['profile', 'detail'] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: () =>
      api.get<{ data: UserProfile }>('/api/profile')
        .then(r => r.data.data),
    staleTime: 10 * 60_000, // 10 minutes - data is fresh for this long
    gcTime: 30 * 60_000, // 30 minutes - cache is kept for this long
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      api.patch('/api/profile', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}
