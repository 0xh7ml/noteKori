'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ChartSkeleton } from '@/components/shared/loading-skeleton'
import { useAnalyticsSummary, useCategoryBreakdown, useDailyTrend } from '@/hooks/use-analytics'
import { useProfile } from '@/hooks/use-profile'
import { formatCurrency } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, subDays, startOfYear } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

type PeriodType = 'week' | 'month' | 'quarter'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<PeriodType>('month')
  const { data: profile } = useProfile()
  const currency = profile?.currency ?? 'USD'
  
  const now = new Date()
  let from: Date, to: Date

  if (period === 'week') {
    from = subDays(now, 7)
    to = now
  } else if (period === 'quarter') {
    from = startOfYear(now)
    to = now
  } else {
    from = startOfMonth(now)
    to = endOfMonth(now)
  }

  const fromStr = format(from, "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const toStr = format(to, "yyyy-MM-dd'T'HH:mm:ss'Z'")

  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(fromStr, toStr)
  const { data: byCategory = [], isLoading: categoryLoading } = useCategoryBreakdown(fromStr, toStr, 'expense')
  const { data: dailyTrend = [], isLoading: trendLoading } = useDailyTrend(fromStr, toStr)

  const chartData = dailyTrend.map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    income: d.income,
    expense: d.expense,
  }))

  const pieData = byCategory.map(c => ({
    name: c.name,
    value: c.total,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            View insights into your financial patterns
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-7 bg-muted rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold text-income">{formatCurrency(summary?.totalIncome ?? 0, currency)}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Money in
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-7 bg-muted rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold text-expense">{formatCurrency(summary?.totalExpense ?? 0, currency)}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Money out
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="h-7 bg-muted rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold" style={{ color: summary && summary.balance >= 0 ? 'hsl(var(--income))' : 'hsl(var(--expense))' }}>
                  {formatCurrency(summary?.balance ?? 0, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Wallet className="h-3 w-3" /> Net balance
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Trend</CardTitle>
          <CardDescription>Income vs Expense over time</CardDescription>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <ChartSkeleton height={300} />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--popover)',
                    color: 'var(--popover-foreground)',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--income))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expense" stroke="hsl(var(--expense))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Distribution of expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <ChartSkeleton height={250} />
            ) : byCategory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expense data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {byCategory.map((entry, i) => (
                      <Cell key={entry.categoryId} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Top spending categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : byCategory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expense data available
              </div>
            ) : (
              <div className="space-y-4">
                {byCategory.slice(0, 5).map(cat => (
                  <div key={cat.categoryId}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{cat.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}