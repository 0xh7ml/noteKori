'use client'

import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useDeleteCategory } from '@/hooks/use-categories'
import type { Category } from '@notekori/types'
import { Trash2, Edit2 } from 'lucide-react'

function CategoryIcon({ icon }: { icon: string }) {
  const name = icon.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join('')
  const Comp = (Icons as any)[name] ?? Icons.Tag
  return <Comp className="h-5 w-5" />
}

interface Props {
  categories: Category[]
  onEdit: (cat: Category) => void
}

export function CategoryGrid({ categories, onEdit }: Props) {
  const deleteCat = useDeleteCategory()

  const customCategories = categories.filter(c => !c.isDefault)
  const systemCategories = categories.filter(c => c.isDefault)

  const handleDelete = (id: string) => {
    if (confirm('Delete this category?')) {
      deleteCat.mutate(id, {
        onSuccess: () => toast.success('Category deleted'),
        onError: (err: any) => {
          const msg = err?.response?.data?.error || 'Failed to delete'
          toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
        },
      })
    }
  }

  return (
    <div className="space-y-8">
      {customCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-4">Custom Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customCategories.map(cat => (
              <div
                key={cat.id}
                className="flex items-start justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                style={{ borderColor: cat.color + '40' }}
              >
                <div className="flex items-start gap-3 flex-1">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                    style={{ backgroundColor: cat.color + '20', color: cat.color }}
                  >
                    <CategoryIcon icon={cat.icon} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{cat.name}</p>
                    <Badge variant="secondary" className="text-xs capitalize mt-1">
                      {cat.type}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onEdit(cat)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cat.id)}
                    disabled={deleteCat.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {systemCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-4">System Categories (Read-only)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {systemCategories.map(cat => (
              <div
                key={cat.id}
                className="flex items-start gap-3 rounded-lg border p-4 opacity-75"
                style={{ borderColor: cat.color + '40' }}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                  style={{ backgroundColor: cat.color + '20', color: cat.color }}
                >
                  <CategoryIcon icon={cat.icon} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{cat.name}</p>
                  <Badge variant="secondary" className="text-xs capitalize mt-1">
                    {cat.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
