'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

const schema = z.object({
  name:      z.string().min(1, 'Name is required').max(100),
  type:      z.enum(['bike', 'car', 'other']),
  fuelType:  z.enum(['petrol', 'diesel', 'electric']),
  initialKm: z.coerce.number().min(0, 'Cannot be negative'),
})
type FormValues = z.infer<typeof schema>

const EMPTY: FormValues = { name: '', type: 'bike', fuelType: 'petrol', initialKm: '' as unknown as number }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: FormValues) => Promise<void>
}

function Choice<T extends string>({
  value, options, onChange,
}: { value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
            value === v
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function VehicleForm({ open, onOpenChange, onSubmit }: Props) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY })

  const type = watch('type')
  const fuelType = watch('fuelType')

  useEffect(() => { if (open) reset(EMPTY) }, [open, reset])

  const submit = async (v: FormValues) => {
    try {
      await onSubmit(v)
      onOpenChange(false)
    } catch {
      // error toast is shown by the page
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add vehicle</SheetTitle>
          <SheetDescription>Enter the odometer reading you are starting from.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <div className="space-y-1.5">
            <Label htmlFor="veh-name">Name *</Label>
            <Input
              id="veh-name"
              placeholder="My Yamaha R15"
              {...register('name')}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Choice
              value={type}
              onChange={(v) => setValue('type', v)}
              options={[['bike', 'Bike'], ['car', 'Car'], ['other', 'Other']] as const}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fuel</Label>
            <Choice
              value={fuelType}
              onChange={(v) => setValue('fuelType', v)}
              options={[['petrol', 'Petrol'], ['diesel', 'Diesel'], ['electric', 'Electric']] as const}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="veh-km">Current odometer (km) *</Label>
            <Input
              id="veh-km"
              type="number"
              step="1"
              inputMode="numeric"
              placeholder="0"
              {...register('initialKm')}
              className={cn(errors.initialKm && 'border-destructive')}
            />
            {errors.initialKm && <p className="text-xs text-destructive">{errors.initialKm.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add vehicle
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
