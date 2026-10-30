import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { computeVehicleStats } from '@/lib/vehicle-stats'
import type { Vehicle, VehicleLog, VehicleType, FuelType, VehicleLogType } from '@notekori/types'

export interface VehicleInput {
  id: string
  name: string
  type: VehicleType
  fuelType: FuelType
  initialKm: number
}

export interface VehicleLogInput {
  id: string
  logType: VehicleLogType
  currentKm: number
  fuelLiters?: number | null
  fuelAmount?: number | null
  otherAmount?: number | null
  notes?: string | null
  date: string
}

export const vehicleKeys = {
  all:  ['vehicles'] as const,
  list: ['vehicles', 'list'] as const,
  logs: (vehicleId: string) => ['vehicles', 'logs', vehicleId] as const,
}

const wasQueued = (res: unknown) => !!(res as { queued?: boolean } | undefined)?.queued

export function useVehicles() {
  return useQuery({
    queryKey: vehicleKeys.list,
    queryFn: () => api.get<{ data: Vehicle[] }>('/api/vehicles').then(r => r.data.data),
    staleTime: 30_000,
  })
}

export function useVehicleLogs(vehicleId: string | undefined) {
  return useQuery({
    queryKey: vehicleKeys.logs(vehicleId ?? ''),
    queryFn: () =>
      api.get<{ data: VehicleLog[] }>(`/api/vehicles/${vehicleId}/logs`).then(r => r.data.data),
    enabled: !!vehicleId,
    staleTime: 30_000,
  })
}

export function useVehicleStats(vehicle: Vehicle | undefined) {
  const { data: logs = [], isLoading } = useVehicleLogs(vehicle?.id)
  const stats = useMemo(() => computeVehicleStats(vehicle, logs), [vehicle, logs])
  return { stats, logs, isLoading }
}

export function useAddVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VehicleInput) => api.post('/api/vehicles', input).then(r => r.data),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: vehicleKeys.list })
      const previous = qc.getQueryData<Vehicle[]>(vehicleKeys.list)
      qc.setQueryData<Vehicle[]>(vehicleKeys.list, (old = []) => [
        { ...input, userId: '', createdAt: new Date().toISOString() },
        ...old,
      ])
      return { previous }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(vehicleKeys.list, ctx?.previous),
    onSuccess: (res) => { if (!wasQueued(res)) qc.invalidateQueries({ queryKey: vehicleKeys.all }) },
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/vehicles/${id}`).then(r => r.data),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: vehicleKeys.list })
      const previous = qc.getQueryData<Vehicle[]>(vehicleKeys.list)
      qc.setQueryData<Vehicle[]>(vehicleKeys.list, (old = []) => old.filter(v => v.id !== id))
      return { previous }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(vehicleKeys.list, ctx?.previous),
    onSuccess: (res) => { if (!wasQueued(res)) qc.invalidateQueries({ queryKey: vehicleKeys.all }) },
  })
}

export function useAddVehicleLog(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VehicleLogInput) =>
      api.post(`/api/vehicles/${vehicleId}/logs`, input).then(r => r.data),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: vehicleKeys.logs(vehicleId) })
      const previous = qc.getQueryData<VehicleLog[]>(vehicleKeys.logs(vehicleId))
      qc.setQueryData<VehicleLog[]>(vehicleKeys.logs(vehicleId), (old = []) => [
        { ...input, vehicleId, userId: '' },
        ...old,
      ])
      return { previous }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(vehicleKeys.logs(vehicleId), ctx?.previous),
    onSuccess: (res) => { if (!wasQueued(res)) qc.invalidateQueries({ queryKey: vehicleKeys.all }) },
  })
}

export function useDeleteVehicleLog(vehicleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (logId: string) =>
      api.delete(`/api/vehicles/${vehicleId}/logs/${logId}`).then(r => r.data),
    onMutate: async (logId) => {
      await qc.cancelQueries({ queryKey: vehicleKeys.logs(vehicleId) })
      const previous = qc.getQueryData<VehicleLog[]>(vehicleKeys.logs(vehicleId))
      qc.setQueryData<VehicleLog[]>(vehicleKeys.logs(vehicleId), (old = []) =>
        old.filter(l => l.id !== logId),
      )
      return { previous }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(vehicleKeys.logs(vehicleId), ctx?.previous),
    onSuccess: (res) => { if (!wasQueued(res)) qc.invalidateQueries({ queryKey: vehicleKeys.all }) },
  })
}
