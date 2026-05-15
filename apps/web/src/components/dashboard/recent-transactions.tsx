'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { TransactionCard } from '@/components/transactions/transaction-card'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { Receipt } from 'lucide-react'
import type { Transaction, Category } from '@notekori/types'

interface Props {
  currency?: string
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
}

export function RecentTransactions({ currency, onEdit, onDelete }: Props) {
  const { data, isLoading } = useTransactions({ limit: 5 })
  const { data: categories = [] } = useCategories()

  const transactions = (data?.data ?? []).map((tx: Transaction) => ({
    ...tx,
    category: categories.find((c: Category) => c.id === tx.categoryId),
  }))

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
          <Link href="/transactions">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="px-2"><TableSkeleton rows={5} /></div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Add your first income or expense"
            className="py-10"
          />
        ) : (
          <div className="divide-y">
            {transactions.map(tx => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                currency={currency}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
