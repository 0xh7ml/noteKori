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
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

const schema = z.object({
  type:         z.enum(['debt', 'loan']),
  title:        z.string().min(1, 'Title is required').max(100),
  totalAmount:  z.coerce.number().positive('Enter a positive amount'),
  counterparty: z.string().max(100).optional(),
  dueDate:      z.string().optional(),
  notes:        z.string().max(500).optional(),
})

export type DebtFormValues = z.infer<typeof schema>

export interface DebtSubmitValues {
  type: 'debt' | 'loan'
  title: string
  totalAmount: number
  counterparty: string | null
  dueDate: string | null
  notes: string | null
}

const EMPTY: DebtFormValues = {
  type: 'debt', title: '', totalAmount: '' as unknown as number,
  counterparty: '', dueDate: '', notes: '',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: DebtSubmitValues) => Promise<void>
}

export function DebtForm({ open, onOpenChange, onSubmit }: Props) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<DebtFormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY })

  const type = watch('type')

  useEffect(() => { if (open) reset(EMPTY) }, [open, reset])

  const submit = async (v: DebtFormValues) => {
    try {
      await onSubmit({
        type: v.type,
        title: v.title,
        totalAmount: v.totalAmount,
        counterparty: v.counterparty?.trim() || null,
        dueDate: v.dueDate ? new Date(v.dueDate).toISOString() : null,
        notes: v.notes?.trim() || null,
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
          <SheetTitle>Add debt or loan</SheetTitle>
          <SheetDescription>Track money you owe or money others owe you.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(submit)} className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <div className="flex gap-2">
            {([['debt', 'I owe'], ['loan', 'Owed to me']] as const).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                className={cn(
                  'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                  type === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="debt-title">Title *</Label>
            <Input
              id="debt-title"
              placeholder="Bike loan, Rahim's loan..."
              {...register('title')}
              className={cn(errors.title && 'border-destructive')}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="debt-total">Total amount *</Label>
            <Input
              id="debt-total"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              {...register('totalAmount')}
              className={cn(errors.totalAmount && 'border-destructive')}
            />
            {errors.totalAmount && <p className="text-xs text-destructive">{errors.totalAmount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="debt-party">{type === 'debt' ? 'Lender' : 'Borrower'}</Label>
            <Input id="debt-party" placeholder="Name (optional)" {...register('counterparty')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="debt-due">Due date</Label>
            <Input id="debt-due" type="date" {...register('dueDate')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="debt-notes">Notes</Label>
            <Textarea id="debt-notes" rows={3} placeholder="Optional details..." {...register('notes')} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
