'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RecurringPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recurring Transactions</h1>
        <p className="text-muted-foreground">
          Set up automatic recurring income and expenses
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recurring Transactions</CardTitle>
          <CardDescription>
            Automate your regular income and expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            No recurring transactions set up yet
          </div>
        </CardContent>
      </Card>
    </div>
  )
}