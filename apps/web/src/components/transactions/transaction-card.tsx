'use client'

import { formatRelative, parseTags } from '@/lib/utils'
import { AmountDisplay } from '@/components/shared/amount-display'
import { CategoryBadge } from '@/components/shared/category-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Transaction, Category } from '@notekori/types'

interface Props {
  transaction: Transaction & { category?: Category }
  currency?: string
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
}

export function TransactionCard({ transaction: tx, currency = 'USD', onEdit, onDelete }: Props) {
  const tags = parseTags(tx.tags)

  return (
    <div className="flex items-start gap-3 p-4 hover:bg-muted/40 transition-colors">
      {/* Category icon circle */}
      {tx.category && (
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: tx.category.color + '20' }}
        >
          <span style={{ color: tx.category.color }} className="text-sm">
            {tx.category.name[0]}
          </span>
        </div>
      )}
      {!tx.category && (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{tx.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {tx.category && <CategoryBadge category={tx.category} size="sm" />}
              <span className="text-xs text-muted-foreground">{formatRelative(tx.date)}</span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 h-5">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <AmountDisplay amount={tx.amount} type={tx.type} currency={currency} className="text-sm" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(tx)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(tx)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {tx.notes && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{tx.notes}</p>
        )}
      </div>
    </div>
  )
}
