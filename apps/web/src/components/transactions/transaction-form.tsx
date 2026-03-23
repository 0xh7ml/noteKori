'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import * as Icons from 'lucide-react'

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useCategories } from '@/hooks/use-categories'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/use-transactions'
import type { Transaction, Category } from '@notekori/types'

const schema = z.object({
  type:        z.enum(['income', 'expense']),
  amount:      z.coerce.number().positive('Enter a positive amount'),
  categoryId:  z.string().min(1, 'Select a category'),
  title:       z.string().min(1, 'Title is required').max(100),
  notes:       z.string().max(500).optional(),
  tagsRaw:     z.string().optional(),
  date:        z.string().min(1, 'Select a date'),
  isRecurring: z.boolean().default(false),
  frequency:   z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  transaction?: Transaction | null
}

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const name = icon.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join('')
  const Comp = (Icons as any)[name] ?? Icons.Tag
  return <Comp className={cn('h-4 w-4', className)} />
}

export function TransactionForm({ open, onOpenChange, transaction }: Props) {
  const isEdit = !!transaction
  const { data: categories = [] } = useCategories()
  const createTx = useCreateTransaction()
  const updateTx = useUpdateTransaction(transaction?.id ?? '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      isRecurring: false,
    },
  })

  const type = watch('type')
  const isRecurring = watch('isRecurring')
  const selectedCategoryId = watch('categoryId')

  // Populate form when editing
  useEffect(() => {
    if (transaction) {
      const parsedTags = (() => {
        try { return JSON.parse(transaction.tags) } catch { return [] }
      })()
      reset({
        type:        transaction.type,
        amount:      transaction.amount,
        categoryId:  transaction.categoryId,
        title:       transaction.title,
        notes:       transaction.notes ?? '',
        date:        transaction.date.slice(0, 10),
        isRecurring: transaction.isRecurring ?? false,
      })
      setTags(parsedTags)
    } else {
      reset({ type: 'expense', date: format(new Date(), 'yyyy-MM-dd'), isRecurring: false })
      setTags([])
    }
  }, [transaction, reset])

  const filteredCategories = categories.filter(
    (c: Category) => c.type === type || c.type === 'both'
  )

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag))

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        type:        values.type,
        amount:      values.amount,
        categoryId:  values.categoryId,
        title:       values.title,
        notes:       values.notes || undefined,
        tags:        tags,
        date:        new Date(values.date).toISOString(),
        isRecurring: values.isRecurring,
        recurringId: undefined,
      }
      if (isEdit) {
        await updateTx.mutateAsync(payload)
        toast.success('Transaction updated')
      } else {
        await createTx.mutateAsync(payload as any)
        toast.success('Transaction added')
      }
      onOpenChange(false)
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Something went wrong'
      toast.error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update the transaction details below.' : 'Fill in the details for your new transaction.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-6">
          {/* Type toggle */}
          <div className="flex rounded-lg border p-1 gap-1">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setValue('type', t); setValue('categoryId', '') }}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-medium transition-colors capitalize',
                  type === t
                    ? t === 'income'
                      ? 'bg-income text-white shadow-sm'
                      : 'bg-expense text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={cn('text-xl font-semibold h-12', errors.amount && 'border-destructive')}
              {...register('amount')}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map((cat: Category) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setValue('categoryId', cat.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-all',
                    selectedCategoryId === cat.id
                      ? 'border-2 shadow-sm'
                      : 'border-border hover:bg-muted'
                  )}
                  style={selectedCategoryId === cat.id ? {
                    borderColor: cat.color,
                    backgroundColor: cat.color + '15',
                  } : {}}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: cat.color + '20', color: cat.color }}
                  >
                    <CategoryIcon icon={cat.icon} />
                  </span>
                  <span className="text-center leading-tight truncate w-full">{cat.name}</span>
                </button>
              ))}
            </div>
            {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Lunch at restaurant"
              className={cn(errors.title && 'border-destructive')}
              {...register('title')}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="notes"
              placeholder="Any additional details..."
              className="resize-none"
              rows={3}
              {...register('notes')}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags <span className="text-muted-foreground">(optional)</span></Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Recurring transaction</p>
              <p className="text-xs text-muted-foreground">Auto-add on a schedule</p>
            </div>
            <Switch
              checked={isRecurring}
              onCheckedChange={v => setValue('isRecurring', v)}
            />
          </div>

          {isRecurring && (
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select onValueChange={v => setValue('frequency', v as any)}>
                <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
