'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Icons from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-categories'
import type { Category } from '@notekori/types'

const ICON_OPTIONS = [
  'utensils', 'car', 'shopping-bag', 'receipt', 'heart-pulse', 'home',
  'clapperboard', 'graduation-cap', 'briefcase', 'laptop', 'store',
  'trending-up', 'gift', 'coffee', 'dumbbell', 'book', 'music',
  'tv', 'plane', 'phone', 'wifi', 'droplet', 'flame',
]

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#d946ef', '#ec4899', '#f43f5e', '#64748b',
]

const schema = z.object({
  name: z.string().min(1, 'Name required').max(50),
  icon: z.string().min(1, 'Select an icon'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Valid color required'),
  type: z.enum(['income', 'expense', 'both']),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  category?: Category | null
}

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  if (!icon) return <Icons.Tag className={cn('h-4 w-4', className)} />
  const name = icon.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join('')
  const Comp = (Icons as any)[name] ?? Icons.Tag
  return <Comp className={cn('h-4 w-4', className)} />
}

export function CategoryForm({ open, onOpenChange, category }: Props) {
  const isEdit = !!category
  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory(category?.id ?? '')
  const [selectedColor, setSelectedColor] = useState(category?.color ?? '#3b82f6')

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
    },
  })

  const selectedIcon = watch('icon')
  const selectedType = watch('type')

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type as 'income' | 'expense' | 'both',
      })
      setSelectedColor(category.color)
    } else {
      reset({ type: 'expense' })
      setSelectedColor('#3b82f6')
    }
  }, [category, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateCat.mutateAsync(values)
        toast.success('Category updated')
      } else {
        await createCat.mutateAsync(values)
        toast.success('Category created')
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
          <SheetTitle>{isEdit ? 'Edit Category' : 'Add Category'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update the category details below.' : 'Create a new custom category.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-6">
          {/* Category Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Groceries"
              className={cn(errors.name && 'border-destructive')}
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(['expense', 'income', 'both'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('type', t)}
                  className={cn(
                    'flex-1 rounded-md py-2 text-sm font-medium transition-colors capitalize',
                    selectedType === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border bg-background hover:bg-muted'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setValue('icon', icon)}
                  className={cn(
                    'flex items-center justify-center rounded-lg border p-2 transition-all',
                    selectedIcon === icon
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  )}
                  title={icon}
                >
                  <CategoryIcon icon={icon} className="h-5 w-5" />
                </button>
              ))}
            </div>
            {errors.icon && <p className="text-xs text-destructive">{errors.icon.message}</p>}
          </div>

          {/* Color Selection */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color)
                    setValue('color', color)
                  }}
                  className={cn(
                    'h-8 w-8 rounded-lg border-2 transition-all',
                    selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: selectedColor + '20', color: selectedColor }}
            >
              <CategoryIcon icon={selectedIcon} className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">Preview</p>
              <p className="text-xs text-muted-foreground">{selectedType}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
