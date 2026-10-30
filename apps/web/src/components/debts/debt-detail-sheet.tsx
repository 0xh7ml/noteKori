'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency, newId } from '@/lib/utils'
import type { Debt } from '@notekori/types'
import { useDebtPayments, useAddPayment, useDeletePayment, useDeleteDebt } from '@/hooks/use-debts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

const schema = z.object({
  amount: z.coerce.number().positive('Enter a positive amount'),
  date:   z.string().min(1, 'Select a date'),
  notes:  z.string().max(500).optional(),
})
type FormValues = z.infer<typeof schema>

type Props = {
  debt: Debt | null
  currency: string
  onOpenChange: (open: boolean) => void
}

export function DebtDetailSheet({ debt, currency, onOpenChange }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: payments = [] } = useDebtPayments(debt?.id)
  const addPayment = useAddPayment(debt?.id ?? '')
  const deletePayment = useDeletePayment(debt?.id ?? '')
  const deleteDebt = useDeleteDebt()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: format(new Date(), 'yyyy-MM-dd') },
  })

  if (!debt) return null

  const remaining = Math.max(0, debt.totalAmount - debt.paidAmount)
  const percent = debt.totalAmount > 0 ? Math.min(100, (debt.paidAmount / debt.totalAmount) * 100) : 0
  const isDebt = debt.type === 'debt'
  const settled = debt.status === 'settled'

  const onPay = async (v: FormValues) => {
    if (v.amount > remaining + 0.005) {
      toast.error(`Payment exceeds the remaining ${formatCurrency(remaining, currency)}`)
      return
    }
    try {
      await addPayment.mutateAsync({
        id: newId(),
        amount: v.amount,
        date: new Date(v.date).toISOString(),
        notes: v.notes?.trim() || null,
      })
      toast.success(isDebt ? 'Payment logged' : 'Repayment logged')
      reset({ date: format(new Date(), 'yyyy-MM-dd'), amount: '' as unknown as number, notes: '' })
    } catch {
      toast.error('Could not save the payment')
    }
  }

  const onDeleteDebt = async () => {
    try {
      await deleteDebt.mutateAsync(debt.id)
      toast.success('Deleted')
      onOpenChange(false)
    } catch {
      toast.error('Could not delete')
    }
    setConfirmDelete(false)
  }

  return (
    <Sheet open onOpenChange={(v) => { if (!v) setConfirmDelete(false); onOpenChange(v) }}>
      <SheetContent className="flex flex-col gap-5 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="truncate">{debt.title}</SheetTitle>
            <Badge variant={settled ? 'default' : 'secondary'}>{settled ? 'Settled' : 'Active'}</Badge>
          </div>
          <SheetDescription>
            {isDebt ? 'You owe' : 'Owed to you by'} {debt.counterparty || 'someone'}
            {debt.dueDate ? ` · due ${format(new Date(debt.dueDate), 'MMM d, yyyy')}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(remaining, currency)}</p>
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatCurrency(debt.paidAmount, currency)} of {formatCurrency(debt.totalAmount, currency)}
            </p>
          </div>
          <Progress value={percent} />
          <p className="text-xs text-muted-foreground">{percent.toFixed(0)}% {isDebt ? 'paid' : 'received'}</p>
        </div>

        {!settled && (
          <form onSubmit={handleSubmit(onPay)} className="space-y-3">
            <h3 className="text-sm font-semibold">{isDebt ? 'Log a payment' : 'Log a repayment'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-amount">Amount</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...register('amount')}
                  className={cn(errors.amount && 'border-destructive')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-date">Date</Label>
                <Input id="pay-date" type="date" {...register('date')} />
              </div>
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            <Input id="pay-notes" placeholder="Note (optional)" {...register('notes')} />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add payment
            </Button>
          </form>
        )}

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Payment history</h3>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <ul className="space-y-1">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium tabular-nums">{formatCurrency(p.amount, currency)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {format(new Date(p.date), 'MMM d, yyyy')}{p.notes ? ` · ${p.notes}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label="Remove payment"
                    onClick={() => deletePayment.mutate(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto pt-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button variant="destructive" className="flex-1" onClick={onDeleteDebt}>
                Confirm delete
              </Button>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete this {isDebt ? 'debt' : 'loan'} and its payments
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
