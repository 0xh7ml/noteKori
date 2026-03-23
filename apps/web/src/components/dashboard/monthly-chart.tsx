'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSkeleton } from '@/components/shared/loading-skeleton'
import { useMonthlyTrend } from '@/hooks/use-analytics'
import { formatCurrency } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { format, parse } from 'date-fns'

interface Props {
  currency?: string
}

export function MonthlyChart({ currency = 'USD' }: Props) {
  const { data = [], isLoading } = useMonthlyTrend(6)

  const chartData = data.map(d => ({
    month: format(parse(d.month, 'yyyy-MM', new Date()), 'MMM'),
    Income: d.income,
    Expense: d.expense,
  }))

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Overview</CardTitle>
      </CardHeader>
      <CardContent className="bg-muted/30 rounded-lg p-3">
        {isLoading ? (
          <ChartSkeleton height={220} />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
              <YAxis
                stroke="var(--muted-foreground)"
                style={{ fontSize: '11px' }}
                tickFormatter={v => formatCurrency(v, currency).replace(/\.00$/, '')}
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--popover)',
                  color: 'var(--popover-foreground)',
                  fontSize: '12px',
                  padding: '8px 12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                }}
                wrapperStyle={{
                  outline: 'none',
                }}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
              <Line 
                type="monotone" 
                dataKey="Income" 
                stroke="hsl(var(--income))" 
                dot={{ fill: 'hsl(var(--income))', r: 3 }}
                activeDot={{ r: 5 }}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="Expense" 
                stroke="hsl(var(--expense))" 
                dot={{ fill: 'hsl(var(--expense))', r: 3 }}
                activeDot={{ r: 5 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
