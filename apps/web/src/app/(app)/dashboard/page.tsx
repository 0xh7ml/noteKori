'use client'

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { useAuth } from '@/lib/auth-client'
import { useAnalyticsSummary } from '@/hooks/use-analytics'
import { BalanceCard } from '@/components/dashboard/balance-card'
import { SpendingByCategory } from '@/components/dashboard/spending-by-category'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { DeleteDialog } from '@/components/transactions/delete-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import type { Transaction } from '@notekori/types'

export default function DashboardPage() {
  const { ready } = useAuthGuard()
  const { user } = useAuth()
  const currency = user?.currency ?? 'USD'

  const from = format(startOfMonth(new Date()), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
  const to   = format(endOfMonth(new Date()),   "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
  const { data: summary, isLoading } = useAnalyticsSummary(from, to)

  const [formOpen, setFormOpen]         = useState(false)
  const [editTx, setEditTx]             = useState<Transaction | null>(null)
  const [deleteTx, setDeleteTx]         = useState<Transaction | null>(null)

  if (!ready) return null

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Button onClick={() => { setEditTx(null); setFormOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Balance hero */}
      <div className="grid grid-cols-1">
        <BalanceCard
          totalIncome={summary?.totalIncome ?? 0}
          totalExpense={summary?.totalExpense ?? 0}
          balance={summary?.balance ?? 0}
          currency={currency}
          isLoading={isLoading}
        />
      </div>

      {/* Category + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingByCategory currency={currency} />
        <RecentTransactions
          currency={currency}
          onEdit={tx => { setEditTx(tx); setFormOpen(true) }}
          onDelete={tx => setDeleteTx(tx)}
        />
      </div>

      {/* Modals */}
      <TransactionForm
        open={formOpen}
        onOpenChange={v => { setFormOpen(v); if (!v) setEditTx(null) }}
        transaction={editTx}
      />
      {deleteTx && (
        <DeleteDialog
          open={!!deleteTx}
          onOpenChange={v => { if (!v) setDeleteTx(null) }}
          transactionId={deleteTx.id}
          transactionTitle={deleteTx.title}
        />
      )}
    </div>
  )
}
