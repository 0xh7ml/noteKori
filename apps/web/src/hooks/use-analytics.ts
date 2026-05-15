import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AnalyticsSummary, CategoryBreakdown, TrendData, MonthlyTrendData } from '@notekori/types'

export const analyticsKeys = {
  all:           ['analytics'] as const,
  summary:       (from?: string, to?: string) => ['analytics', 'summary', from, to] as const,
  byCategory:    (from?: string, to?: string, type?: string) => ['analytics', 'byCategory', from, to, type] as const,
  dailyTrend:    (from?: string, to?: string) => ['analytics', 'dailyTrend', from, to] as const,
  monthlyTrend:  (months?: number) => ['analytics', 'monthlyTrend', months] as const,
}

export function useAnalyticsSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: analyticsKeys.summary(from, to),
    queryFn:  () =>
      api.get<{ data: AnalyticsSummary }>('/api/analytics/summary', { params: { from, to } })
         .then(r => r.data.data),
    staleTime: 60_000,
  })
}

export function useCategoryBreakdown(from?: string, to?: string, type: 'income' | 'expense' = 'expense') {
  return useQuery({
    queryKey: analyticsKeys.byCategory(from, to, type),
    queryFn:  () =>
      api.get<{ data: CategoryBreakdown[] }>('/api/analytics/by-category', { params: { from, to, type } })
         .then(r => r.data.data),
    staleTime: 60_000,
  })
}

export function useDailyTrend(from?: string, to?: string) {
  return useQuery({
    queryKey: analyticsKeys.dailyTrend(from, to),
    queryFn:  () =>
      api.get<{ data: TrendData[] }>('/api/analytics/daily-trend', { params: { from, to } })
         .then(r => r.data.data),
    staleTime: 60_000,
  })
}

export function useMonthlyTrend(months = 6) {
  return useQuery({
    queryKey: analyticsKeys.monthlyTrend(months),
    queryFn:  () =>
      api.get<{ data: MonthlyTrendData[] }>('/api/analytics/monthly-trend', { params: { months } })
         .then(r => r.data.data),
    staleTime: 60_000,
  })
}
