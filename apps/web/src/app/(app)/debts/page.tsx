'use client'

import { useMemo, useState } from 'react'
import { format, isPast } from 'date-fns'
import { Plus, Landmark, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency, newId } from '@/lib/utils'
import { useDebts, useAddDebt } from '@/hooks/use-debts'
import { useProfile } from '@/hooks/use-profile'
import type { Debt } from '@notekori/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { DebtForm, type DebtSubmitValues } from '@/components/debts/debt-form'
import { DebtDetailSheet } from '@/components/debts/debt-detail-sheet'

type Filter = 'active' | 'settled' | 'all'

export default function DebtsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('active')

  const { data: debts = [], isLoading } = useDebts()
  const { data: profile } = useProfile()
  const addDebt = useAddDebt()
  const currency = profile?.currency ?? 'USD'

  const selected = debts.find(d => d.id === selectedId) ?? null

  const totals = useMemo(() => {
    let owe = 0
    let owed = 0
    for (const d of debts) {
      const left = Math.max(0, d.totalAmount - d.paidAmount)
      if (d.type === 'debt') owe += left
      else owed += left
    }
    return { owe, owed }
  }, [debts])

  const visible = debts.filter(d => filter === 'all' || d.status === filter)

  const handleAdd = async (values: DebtSubmitValues) => {
    try {
      await addDebt.mutateAsync({ id: newId(), ...values })
      toast.success('Added')
    } catch {
      toast.error('Could not save')
      throw new Error('save failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debts</h1>
          <p className="text-muted-foreground">Track what you owe and what others owe you</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add debt or loan</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">You owe</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(totals.owe, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Owed to you</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(totals.owed, currency)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {(['active', 'settled', 'all'] as const).map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map(i => <Skeleton key={i} className="h-36 rounded-lg" />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title={filter === 'settled' ? 'Nothing settled yet' : 'No debts to show'}
          description="Add a debt or loan, then log payments to watch the balance shrink."
          action={filter === 'settled' ? undefined : { label: 'Add debt or loan', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map(d => (
            <DebtCard key={d.id} debt={d} currency={currency} onClick={() => setSelectedId(d.id)} />
          ))}
        </div>
      )}

      <DebtForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleAdd} />
      <DebtDetailSheet
        debt={selected}
        currency={currency}
        onOpenChange={(v) => { if (!v) setSelectedId(null) }}
      />
    </div>
  )
}

function DebtCard({ debt, currency, onClick }: { debt: Debt; currency: string; onClick: () => void }) {
  const remaining = Math.max(0, debt.totalAmount - debt.paidAmount)
  const percent = debt.totalAmount > 0 ? Math.min(100, (debt.paidAmount / debt.totalAmount) * 100) : 0
  const overdue = debt.status === 'active' && !!debt.dueDate && isPast(new Date(debt.dueDate))

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{debt.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {debt.type === 'debt' ? 'You owe' : 'Owed by'} {debt.counterparty || 'someone'}
          </p>
        </div>
        {debt.status === 'settled' ? (
          <Badge>Settled</Badge>
        ) : overdue ? (
          <Badge variant="destructive">Overdue</Badge>
        ) : (
          <Badge variant="secondary">{debt.type === 'debt' ? 'Debt' : 'Loan'}</Badge>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <p className="text-xl font-bold tabular-nums">{formatCurrency(remaining, currency)}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          of {formatCurrency(debt.totalAmount, currency)}
        </p>
      </div>
      <Progress value={percent} className="mt-2" />
      <div className={cn('mt-2 flex justify-between text-xs text-muted-foreground')}>
        <span>{percent.toFixed(0)}% {debt.type === 'debt' ? 'paid' : 'received'}</span>
        {debt.dueDate && <span className={cn(overdue && 'text-destructive')}>Due {format(new Date(debt.dueDate), 'MMM d, yyyy')}</span>}
      </div>
    </button>
  )
}
