'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Bike, Car, Fuel, Gauge, Route, Wallet, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { cn, formatCurrency, newId } from '@/lib/utils'
import {
  useVehicles, useVehicleStats, useAddVehicle, useAddVehicleLog,
  useDeleteVehicle, useDeleteVehicleLog,
} from '@/hooks/use-vehicles'
import { useProfile } from '@/hooks/use-profile'
import type { Vehicle } from '@notekori/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { VehicleForm } from '@/components/vehicles/vehicle-form'
import { VehicleLogForm, type LogSubmitValues } from '@/components/vehicles/vehicle-log-form'

const FUEL_COLOR = '#f59e0b'
const OTHER_COLOR = '#3b82f6'

export default function VehiclesPage() {
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false)
  const [logFormOpen, setLogFormOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: vehicles = [], isLoading } = useVehicles()
  const { data: profile } = useProfile()
  const currency = profile?.currency ?? 'USD'

  const vehicle = vehicles.find(v => v.id === selectedId) ?? vehicles[0]
  useEffect(() => { setConfirmDelete(false) }, [vehicle?.id])

  const { stats, logs, isLoading: logsLoading } = useVehicleStats(vehicle)
  const addVehicle = useAddVehicle()
  const addLog = useAddVehicleLog(vehicle?.id ?? '')
  const deleteLog = useDeleteVehicleLog(vehicle?.id ?? '')
  const deleteVehicle = useDeleteVehicle()

  const unit = vehicle?.fuelType === 'electric' ? 'kWh' : 'L'
  const lastKm = logs.reduce((m, l) => Math.max(m, l.currentKm), vehicle?.initialKm ?? 0)

  const handleAddVehicle = async (values: Omit<Vehicle, 'id' | 'userId' | 'createdAt'>) => {
    const id = newId()
    try {
      await addVehicle.mutateAsync({ id, ...values })
      setSelectedId(id)
      toast.success('Vehicle added')
    } catch {
      toast.error('Could not save')
      throw new Error('save failed')
    }
  }

  const handleAddLog = async (values: LogSubmitValues) => {
    try {
      await addLog.mutateAsync({ id: newId(), ...values })
      toast.success('Entry added')
    } catch {
      toast.error('Could not save')
      throw new Error('save failed')
    }
  }

  const handleDeleteVehicle = async () => {
    if (!vehicle) return
    try {
      await deleteVehicle.mutateAsync(vehicle.id)
      setSelectedId(null)
      toast.success('Vehicle deleted')
    } catch {
      toast.error('Could not delete')
    }
    setConfirmDelete(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">Mileage, running cost and maintenance</p>
        </div>
        <div className="flex gap-2">
          {vehicle && (
            <Button onClick={() => setLogFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add entry</span>
              <span className="sm:hidden">Entry</span>
            </Button>
          )}
          <Button variant={vehicle ? 'outline' : 'default'} onClick={() => setVehicleFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add vehicle</span>
            <span className="sm:hidden">Vehicle</span>
          </Button>
        </div>
      </div>

      {!vehicle ? (
        <EmptyState
          icon={Bike}
          title="No vehicles yet"
          description="Add your bike or car, then log fill-ups to see mileage and monthly cost."
          action={{ label: 'Add vehicle', onClick: () => setVehicleFormOpen(true) }}
        />
      ) : (
        <>
          {vehicles.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {vehicles.map(v => (
                <Button
                  key={v.id}
                  size="sm"
                  variant={v.id === vehicle.id ? 'default' : 'outline'}
                  onClick={() => setSelectedId(v.id)}
                  className="gap-2"
                >
                  {v.type === 'car' ? <Car className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                  {v.name}
                </Button>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              icon={Gauge}
              label="Mileage"
              value={stats.mileage != null ? `${stats.mileage.toFixed(1)} km/${unit}` : '—'}
              hint={stats.mileage == null ? 'Needs two fuel entries' : undefined}
              loading={logsLoading}
            />
            <StatTile
              icon={Wallet}
              label="Avg monthly cost"
              value={formatCurrency(stats.avgMonthlyCost, currency)}
              hint={stats.months ? `over ${stats.months} month${stats.months > 1 ? 's' : ''}` : undefined}
              loading={logsLoading}
            />
            <StatTile
              icon={Route}
              label="Total km run"
              value={`${Math.round(stats.totalKm).toLocaleString()} km`}
              hint={`since ${Math.round(vehicle.initialKm).toLocaleString()} km`}
              loading={logsLoading}
            />
            <StatTile
              icon={Fuel}
              label="Cost per km"
              value={stats.costPerKm != null ? formatCurrency(stats.costPerKm, currency) : '—'}
              hint={stats.avgFuelPrice != null ? `fuel ${formatCurrency(stats.avgFuelPrice, currency)}/${unit}` : undefined}
              loading={logsLoading}
            />
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly cost</CardTitle>
            </CardHeader>
            <CardContent className="rounded-lg bg-muted/30 p-3">
              {stats.monthly.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Add a fill-up or maintenance entry to see your monthly cost.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={stats.monthly} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '11px' }}
                      tickFormatter={v => formatCurrency(v, currency).replace(/\.00$/, '')}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--popover))',
                        color: 'hsl(var(--popover-foreground))',
                        fontSize: '12px',
                      }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                    <Area type="monotone" dataKey="fuel" name="Fuel" stackId="1"
                      stroke={FUEL_COLOR} fill={FUEL_COLOR} fillOpacity={0.3} strokeWidth={2} />
                    <Area type="monotone" dataKey="other" name="Maintenance & other" stackId="1"
                      stroke={OTHER_COLOR} fill={OTHER_COLOR} fillOpacity={0.3} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{vehicle.name} log</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <EmptyState
                  icon={Fuel}
                  title="No entries yet"
                  description="Log your first fill-up or service."
                  action={{ label: 'Add entry', onClick: () => setLogFormOpen(true) }}
                  className="py-10"
                />
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Odometer</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">km/{unit}</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map(l => {
                        const cost = (l.fuelAmount ?? 0) + (l.otherAmount ?? 0)
                        const km = stats.perFillMileage[l.id]
                        return (
                          <TableRow key={l.id}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {format(new Date(l.date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <Badge variant={l.logType === 'fuel' ? 'default' : 'secondary'} className="w-fit capitalize">
                                  {l.logType}
                                </Badge>
                                {l.notes && <span className="max-w-[10rem] truncate text-xs text-muted-foreground">{l.notes}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{Math.round(l.currentKm).toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {l.fuelLiters ? `${l.fuelLiters.toFixed(2)} ${unit}` : '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{km ? km.toFixed(1) : '—'}</TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatCurrency(cost, currency)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                aria-label="Delete entry"
                                onClick={() => deleteLog.mutate(l.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <Button variant="destructive" size="sm" onClick={handleDeleteVehicle}>
                  Delete {vehicle.name} and all entries
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete vehicle
              </Button>
            )}
          </div>
        </>
      )}

      <VehicleForm open={vehicleFormOpen} onOpenChange={setVehicleFormOpen} onSubmit={handleAddVehicle} />
      {vehicle && (
        <VehicleLogForm
          open={logFormOpen}
          onOpenChange={setLogFormOpen}
          fuelType={vehicle.fuelType}
          lastKm={lastKm}
          onSubmit={handleAddLog}
        />
      )}
    </div>
  )
}

function StatTile({
  icon: Icon, label, value, hint, loading,
}: { icon: typeof Gauge; label: string; value: string; hint?: string; loading?: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className={cn('text-2xl font-bold tabular-nums')}>{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
