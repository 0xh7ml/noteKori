import { cn, formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  amount: number
  type: 'income' | 'expense'
  currency?: string
  showIcon?: boolean
  className?: string
}

export function AmountDisplay({ amount, type, currency = 'USD', showIcon = true, className }: Props) {
  const isIncome = type === 'income'
  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-medium tabular-nums',
      isIncome ? 'text-income' : 'text-expense',
      className,
    )}>
      {showIcon && (
        isIncome
          ? <TrendingUp className="h-3.5 w-3.5" />
          : <TrendingDown className="h-3.5 w-3.5" />
      )}
      {isIncome ? '+' : '-'}{formatCurrency(amount, currency)}
    </span>
  )
}
