'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCategories } from '@/hooks/use-categories'
import type { Category } from '@notekori/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { CategoryBadge } from '@/components/shared/category-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────
type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<FormValues>
  onSubmit: (values: FormValues) => Promise<void>
}

const schema = z.object({
  type:        z.enum(['income', 'expense']),
  amount:      z.coerce.number().positive('Enter a positive amount'),
  categoryId:  z.string().min(1, 'Select a category'),
  title:       z.string().min(1, 'Title is required').max(100),
  notes:       z.string().max(500).optional(),
  tagsRaw:     z.string().optional(),
  date:        z.string().min(1, 'Select a date'),
})

// ─── Main Component ────────────────────────────────────────────────────────────
export function TransactionForm({ open, onOpenChange, defaultValues, onSubmit }: Props) {
  const { data: categories, isLoading } = useCategories()

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const type = watch('type')
  const selectedCategoryId = watch('categoryId')

  // Sync defaultValues prop → form (e.g. when user clicks edit)
  useEffect(() => {
    if (!open) return
    if (defaultValues) {
      reset(defaultValues)
    } else {
      reset({ type: 'expense', date: format(new Date(), 'yyyy-MM-dd') })
    }
  }, [open, defaultValues, reset])

  const handleFormSubmit = async (values: FormValues) => {
    try {
      // Convert date from "yyyy-MM-dd" to full ISO datetime string
      const submitValues = {
        ...values,
        date: new Date(values.date).toISOString(),
      }
      await onSubmit(submitValues as FormValues)
      onOpenChange(false)
      reset({ type: 'expense', date: format(new Date(), 'yyyy-MM-dd') })
    } catch {
      // error shown by toast in page
    }
  }

  const filteredCategories = useMemo(
    () => categories?.filter((cat: { type: string }) => cat.type === type || cat.type === 'both') ?? [],
    [categories, type],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{defaultValues ? 'Edit Transaction' : 'Add Transaction'}</SheetTitle>
          <SheetDescription>
            Record a new income or expense transaction.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-1 flex-col gap-5 overflow-y-auto">

          {/* ── Type toggle ─────────────────────────────── */}
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setValue('type', t)
                  setValue('categoryId', '')
                }}
                className={cn(
                  'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                  type === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Amount ─────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount')}
              className={cn(errors.amount && 'border-destructive')}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* ── Category ──────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>Category *</Label>
            {isLoading ? (
              <LoadingSkeleton className="h-10 w-full rounded-md" />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setValue('categoryId', cat.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md border py-2 px-1 text-xs transition-colors',
                      selectedCategoryId === cat.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    <CategoryBadge category={cat} size="sm" />
                    <span className="line-clamp-1 text-foreground">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          {/* ── Title ──────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What was this for?"
              {...register('title')}
              className={cn(errors.title && 'border-destructive')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* ── Notes ──────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Optional details..."
              {...register('notes')}
              className={cn(errors.notes && 'border-destructive')}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {/* ── Tags ───────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="tagsRaw">Tags</Label>
            <Input
              id="tagsRaw"
              placeholder="grocery, weekly, optional"
              {...register('tagsRaw')}
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas.
            </p>
          </div>

          {/* ── Date ───────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={cn(errors.date && 'border-destructive')}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* ── Actions ────────────────────────────────── */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {defaultValues ? 'Update' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
