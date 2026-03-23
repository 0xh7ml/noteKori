'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSkeleton } from '@/components/shared/loading-skeleton'
import { useCategoryBreakdown } from '@/hooks/use-analytics'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { EmptyState } from '@/components/shared/empty-state'
import { PieChart as PieIcon } from 'lucide-react'

interface Props {
  currency?: string
}

export function SpendingByCategory({ currency = 'USD' }: Props) {
  const from = format(startOfMonth(new Date()), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const to   = format(endOfMonth(new Date()),   "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const { data = [], isLoading } = useCategoryBreakdown(from, to, 'expense')

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton height={200} />
        ) : data.length === 0 ? (
          <EmptyState icon={PieIcon} title="No expenses yet" description="Add expenses to see breakdown" className="py-8" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="total"
                  nameKey="name"
                >
                  {data.map((entry, i) => (
                    <Cell key={entry.categoryId} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v, currency), 'Amount']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--popover)',
                    color: 'var(--popover-foreground)',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {data.slice(0, 5).map(cat => (
                <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="truncate text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="font-medium tabular-nums ml-2">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
