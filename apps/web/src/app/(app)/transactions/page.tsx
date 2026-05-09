'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { Plus, Search } from 'lucide-react'
import { useTransactions, useCreateTransaction, useUpdateTransaction } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { DeleteDialog } from '@/components/transactions/delete-dialog'
import { Receipt } from 'lucide-react'
import type { Transaction } from '@notekori/types'
import * as Icons from 'lucide-react'

function CategoryIcon({ icon }: { icon: string }) {
  const name = icon.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join('')
  const Comp = (Icons as any)[name] ?? Icons.Tag
  return <Comp className="h-4 w-4" />
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useTransactions({ query: search, page, limit: 20 })
  const { data: categories = [] } = useCategories()
  const { data: profile } = useProfile()
  const currency = profile?.currency ?? 'USD'

  const createTx = useCreateTransaction()
  const updateTx = useUpdateTransaction(editTx?.id ?? '')

  const transactions = (data?.data ?? []).map((tx: Transaction) => ({
    ...tx,
    category: categories.find((c: any) => c.id === tx.categoryId),
  }))

  const getCategoryName = (categoryId: string) => {
    return categories.find((c: any) => c.id === categoryId)?.name || 'Unknown'
  }

  const getCategoryColor = (categoryId: string) => {
    return categories.find((c: any) => c.id === categoryId)?.color || '#6b7280'
  }

  const getCategoryIcon = (categoryId: string) => {
    return categories.find((c: any) => c.id === categoryId)?.icon || 'tag'
  }

  const pagination = data?.pagination

  const handleSubmit = async (values: any) => {
    if (editTx) {
      await updateTx.mutateAsync(values)
      toast.success('Transaction updated')
    } else {
      await createTx.mutateAsync(values)
      toast.success('Transaction added')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage your income and expenses
          </p>
        </div>
        <Button onClick={() => { setEditTx(null); setFormOpen(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            View and manage all your transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions found"
              description={search ? 'Try adjusting your search' : 'Add your first transaction to get started'}
              className="py-12"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: any) => (
                      <TableRow
                        key={tx.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => { setEditTx(tx); setFormOpen(true) }}
                      >
                        <TableCell className="text-sm">
                          {format(new Date(tx.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                              style={{ backgroundColor: getCategoryColor(tx.categoryId) + '20', color: getCategoryColor(tx.categoryId) }}
                            >
                              <CategoryIcon icon={getCategoryIcon(tx.categoryId)} />
                            </span>
                            <span className="text-sm">{getCategoryName(tx.categoryId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'income' ? 'default' : 'secondary'}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <span style={{ color: tx.type === 'income' ? 'hsl(var(--income))' : 'hsl(var(--expense))' }}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                          {tx.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === pagination.totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TransactionForm
        open={formOpen}
        onOpenChange={v => { setFormOpen(v); if (!v) setEditTx(null) }}
        defaultValues={editTx ? {
          type: editTx.type,
          amount: editTx.amount,
          categoryId: editTx.categoryId,
          title: editTx.title,
          notes: editTx.notes || '',
          tagsRaw: editTx.tags?.join(', ') || '',
          date: editTx.date.split('T')[0],
        } : undefined}
        onSubmit={handleSubmit}
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