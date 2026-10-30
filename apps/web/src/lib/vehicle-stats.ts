import { format } from 'date-fns'
import type { Vehicle, VehicleLog } from '@notekori/types'

export interface MonthlyCost {
  month: string // yyyy-MM
  label: string // MMM yy
  fuel: number
  other: number
}

export interface VehicleStats {
  totalKm: number
  mileage: number | null        // km per liter (or per kWh), weighted across all fill-ups
  avgMonthlyCost: number
  totalCost: number
  fuelCost: number
  otherCost: number
  costPerKm: number | null
  avgFuelPrice: number | null   // cost per liter / kWh
  months: number
  monthly: MonthlyCost[]
  perFillMileage: Record<string, number> // log id -> km/L for that fill-up
}

const EMPTY: VehicleStats = {
  totalKm: 0, mileage: null, avgMonthlyCost: 0, totalCost: 0, fuelCost: 0,
  otherCost: 0, costPerKm: null, avgFuelPrice: null, months: 0, monthly: [], perFillMileage: {},
}

const monthKey = (d: Date) => format(d, 'yyyy-MM')

export function computeVehicleStats(vehicle: Vehicle | undefined, logs: VehicleLog[]): VehicleStats {
  if (!vehicle || logs.length === 0) return EMPTY

  const maxKm = Math.max(vehicle.initialKm, ...logs.map(l => l.currentKm))
  const totalKm = Math.max(0, maxKm - vehicle.initialKm)

  // Mileage: each fill-up tops up the tank, so liters added at fill N cover the distance since fill N-1
  const fuelLogs = logs
    .filter(l => l.logType === 'fuel' && l.fuelLiters && l.fuelLiters > 0)
    .sort((a, b) => a.currentKm - b.currentKm || a.date.localeCompare(b.date))

  let distance = 0
  let liters = 0
  const perFillMileage: Record<string, number> = {}
  for (let i = 1; i < fuelLogs.length; i++) {
    const km = fuelLogs[i].currentKm - fuelLogs[i - 1].currentKm
    const l = fuelLogs[i].fuelLiters!
    if (km > 0) {
      distance += km
      liters += l
      perFillMileage[fuelLogs[i].id] = km / l
    }
  }

  const fuelCost = logs.reduce((s, l) => s + (l.fuelAmount ?? 0), 0)
  const otherCost = logs.reduce((s, l) => s + (l.otherAmount ?? 0), 0)
  const totalCost = fuelCost + otherCost
  const totalLiters = fuelLogs.reduce((s, l) => s + l.fuelLiters!, 0)

  // Monthly buckets from the first to the last log month, gaps filled with zero
  const times = logs.map(l => new Date(l.date).getTime())
  const first = new Date(Math.min(...times))
  const last = new Date(Math.max(...times))
  const buckets = new Map<string, MonthlyCost>()
  for (let d = new Date(first.getFullYear(), first.getMonth(), 1);
       d <= last; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    buckets.set(monthKey(d), { month: monthKey(d), label: format(d, 'MMM yy'), fuel: 0, other: 0 })
  }
  for (const l of logs) {
    const b = buckets.get(monthKey(new Date(l.date)))
    if (!b) continue
    b.fuel += l.fuelAmount ?? 0
    b.other += l.otherAmount ?? 0
  }
  const monthly = [...buckets.values()]
  const months = Math.max(1, monthly.length)

  return {
    totalKm,
    mileage: liters > 0 ? distance / liters : null,
    avgMonthlyCost: totalCost / months,
    totalCost,
    fuelCost,
    otherCost,
    costPerKm: totalKm > 0 ? totalCost / totalKm : null,
    avgFuelPrice: totalLiters > 0 ? fuelCost / totalLiters : null,
    months,
    monthly,
    perFillMileage,
  }
}
