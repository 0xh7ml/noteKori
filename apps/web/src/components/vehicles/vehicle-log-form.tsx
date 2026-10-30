'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FuelType, VehicleLogType } from '@notekori/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

const schema = z.object({
  logType:    z.enum(['fuel', 'maintenance', 'other']),
  currentKm:  z.coerce.number().positive('Enter the odometer reading'),
  fuelLiters: z.coerce.number().optional(),
  amount:     z.coerce.number().positive('Enter an amount'),
  notes:      z.string().max(500).optional(),
  date:       z.string().min(1, 'Select a date'),
}).superRefine((v, ctx) => {
  if (v.logType === 'fuel' && !(v.fuelLiters && v.fuelLiters > 0)) {
    ctx.addIssue({ code: 'custom', path: ['fuelLiters'], message: 'Enter the quantity filled' })
  }
  if (v.logType !== 'fuel' && !v.notes?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['notes'], message: 'Describe what this was for' })
  }
})
type FormValues = z.infer<typeof schema>

export interface LogSubmitValues {
  logType: VehicleLogType
  currentKm: number
  fuelLiters: number | null
  fuelAmount: number | null
  otherAmount: number | null
  notes: string | null
  date: string
}

const blank = (): FormValues => ({
  logType: 'fuel',
  currentKm: '' as unknown as number,
  fuelLiters: '' as unknown as number,
  amount: '' as unknown as number,
  notes: '',
  date: format(new Date(), 'yyyy-MM-dd'),
})

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fuelType: FuelType
  lastKm: number
  onSubmit: (values: LogSubmitValues) => Promise<void>
}

export function VehicleLogForm({ open, onOpenChange, fuelType, lastKm, onSubmit }: Props) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: blank() })

  const logType = watch('logType')
  const unit = fuelType === 'electric' ? 'kWh' : 'liters'

  useEffect(() => { if (open) reset(blank()) }, [open, reset])

  const submit = async (v: FormValues) => {
    const isFuel = v.logType === 'fuel'
    try {
      await onSubmit({
        logType: v.logType,
        currentKm: v.currentKm,
        fuelLiters: isFuel ? v.fuelLiters ?? null : null,
        fuelAmount: isFuel ? v.amount : null,
        otherAmount: isFuel ? null : v.amount,
        notes: v.notes?.trim() || null,
        date: new Date(v.date).toISOString(),
      })
      onOpenChange(false)
    } catch {
      // error toast is shown by the page
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add entry</SheetTitle>
          <SheetDescription>Log a fill-up or a maintenance cost.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <div className="flex gap-2">
            {([['fuel', 'Fuel'], ['maintenance', 'Maintenance'], ['other', 'Other']] as const).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('logType', t)}
                className={cn(
                  'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                  logType === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="log-km">Odometer (km) *</Label>
            <Input
              id="log-km"
              type="number"
              step="1"
              inputMode="numeric"
              placeholder={lastKm ? `Last: ${lastKm}` : '0'}
              {...register('currentKm')}
              className={cn(errors.currentKm && 'border-destructive')}
            />
            {errors.currentKm && <p className="text-xs text-destructive">{errors.currentKm.message}</p>}
          </div>

          {logType === 'fuel' && (
            <div className="space-y-1.5">
              <Label htmlFor="log-liters">Quantity ({unit}) *</Label>
              <Input
                id="log-liters"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                {...register('fuelLiters')}
                className={cn(errors.fuelLiters && 'border-destructive')}
              />
              {errors.fuelLiters && <p className="text-xs text-destructive">{errors.fuelLiters.message}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="log-amount">{logType === 'fuel' ? 'Fuel cost *' : 'Cost *'}</Label>
            <Input
              id="log-amount"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              {...register('amount')}
              className={cn(errors.amount && 'border-destructive')}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="log-notes">{logType === 'fuel' ? 'Notes' : 'What was it for? *'}</Label>
            <Input
              id="log-notes"
              placeholder={logType === 'fuel' ? 'Optional' : 'Oil change, new tyre...'}
              {...register('notes')}
              className={cn(errors.notes && 'border-destructive')}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="log-date">Date *</Label>
            <Input id="log-date" type="date" {...register('date')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add entry
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
