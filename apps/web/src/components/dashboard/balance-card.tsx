import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface Props {
  totalIncome: number
  totalExpense: number
  balance: number
  currency?: string
  isLoading?: boolean
}

export function BalanceCard({ totalIncome, totalExpense, balance, currency = 'USD', isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <CardContent className="pt-6 pb-5">
        <p className="text-sm text-muted-foreground font-medium mb-1">Total Balance</p>
        <p className={`text-4xl font-bold tabular-nums tracking-tight ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
          {formatCurrency(balance, currency)}
        </p>
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-income/10">
              <TrendingUp className="h-4 w-4 text-income" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-sm font-semibold text-income tabular-nums">{formatCurrency(totalIncome, currency)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-expense/10">
              <TrendingDown className="h-4 w-4 text-expense" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-sm font-semibold text-expense tabular-nums">{formatCurrency(totalExpense, currency)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
