import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Debt, DebtPayment, DebtType } from '@notekori/types'

export interface DebtInput {
  id: string
  title: string
  type: DebtType
  totalAmount: number
  dueDate?: string | null
  counterparty?: string | null
  notes?: string | null
}

export interface PaymentInput {
  id: string
  amount: number
  date: string
  notes?: string | null
}

export const debtKeys = {
  all:      ['debts'] as const,
  list:     ['debts', 'list'] as const,
  payments: (debtId: string) => ['debts', 'payments', debtId] as const,
}

const wasQueued = (res: unknown) => !!(res as { queued?: boolean } | undefined)?.queued

const EPSILON = 0.005
const statusFor = (total: number, paid: number) => (paid >= total - EPSILON ? 'settled' : 'active')

export function useDebts() {
  return useQuery({
    queryKey: debtKeys.list,
    queryFn: () => api.get<{ data: Debt[] }>('/api/debts').then(r => r.data.data),
    staleTime: 30_000,
  })
}

export function useDebtPayments(debtId: string | undefined) {
  return useQuery({
    queryKey: debtKeys.payments(debtId ?? ''),
    queryFn: () =>
      api.get<{ data: DebtPayment[] }>(`/api/debts/${debtId}/payments`).then(r => r.data.data),
    enabled: !!debtId,
    staleTime: 30_000,
  })
}

export function useAddDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: DebtInput) => api.post('/api/debts', input).then(r => r.data),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: debtKeys.list })
      const previous = qc.getQueryData<Debt[]>(debtKeys.list)
      const optimistic: Debt = {
        ...input,
        userId: '',
        paidAmount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      qc.setQueryData<Debt[]>(debtKeys.list, (old = []) => [optimistic, ...old])
      return { previous }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(debtKeys.list, ctx?.previous),
    onSuccess: (res) => { if (!wasQueued(res)) qc.invalidateQueries({ queryKey: debtKeys.all }) },
  })
}

export function useUpdateDebt(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Omit<DebtInput, 'id'>>) =>
      api.patch(`/api/debts/${id}`, data).then(r => r.data),
    onSuccess: (res) => { if (!wasQueued(res)) qc.invalidateQueries({ queryKey: debtKeys.all }) },
  })
}

export function useDeleteDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/debts/${id}`).then(r => r.data),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: debtKeys.list })
      const previous = qc.getQueryData<Debt[]>(debtKeys.list)
      qc.setQueryData<Debt[]>(debtKeys.list, (old = []) => old.filter(d => d.id !== id))
      return { previous }
    },
    onError: (_e, _v, ctx) => qc.setQueryData(debtKeys.list, ctx?.previous),
    onSuccess: (res) => { if (!wasQueued(res)) qc.invalidateQueries({ queryKey: debtKeys.all }) },
  })
}

export function useAddPayment(debtId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PaymentInput) =>
      api.post(`/api/debts/${debtId}/payments`, input).then(r => r.data),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: debtKeys.all })
      const previousDebts = qc.getQueryData<Debt[]>(debtKeys.list)
      const previousPayments = qc.getQueryData<DebtPayment[]>(debtKeys.payments(debtId))

      qc.setQueryData<Debt[]>(debtKeys.list, (old = []) =>
        old.map(d => {
          if (d.id !== debtId) return d
          const paidAmount = d.paidAmount + input.amount
          return { ...d, paidAmount, status: statusFor(d.totalAmount, paidAmount) }
        }),
      )
      qc.setQueryData<DebtPayment[]>(debtKeys.payments(debtId), (old = []) => [
        { ...input, debtId, userId: '' },
        ...old,
      ])
      return { previousDebts, previousPayments }
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(debtKeys.list, ctx?.previousDebts)
      qc.setQueryData(debtKeys.payments(debtId), ctx?.previousPayments)
    },
    onSuccess: (res) => { if (!wasQueued(res)) qc.invalidateQueries({ queryKey: debtKeys.all }) },
  })
}

export function useDeletePayment(debtId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: string) =>
      api.delete(`/api/debts/${debtId}/payments/${paymentId}`).then(r => r.data),
    onMutate: async (paymentId) => {
      await qc.cancelQueries({ queryKey: debtKeys.all })
      const previousDebts = qc.getQueryData<Debt[]>(debtKeys.list)
      const previousPayments = qc.getQueryData<DebtPayment[]>(debtKeys.payments(debtId))
      const removed = previousPayments?.find(p => p.id === paymentId)

      if (removed) {
        qc.setQueryData<Debt[]>(debtKeys.list, (old = []) =>
          old.map(d => {
            if (d.id !== debtId) return d
            const paidAmount = Math.max(0, d.paidAmount - removed.amount)
            return { ...d, paidAmount, status: statusFor(d.totalAmount, paidAmount) }
          }),
        )
        qc.setQueryData<DebtPayment[]>(debtKeys.payments(debtId), (old = []) =>
          old.filter(p => p.id !== paymentId),
        )
      }
      return { previousDebts, previousPayments }
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(debtKeys.list, ctx?.previousDebts)
      qc.setQueryData(debtKeys.payments(debtId), ctx?.previousPayments)
    },
    onSuccess: (res) => { if (!wasQueued(res)) qc.invalidateQueries({ queryKey: debtKeys.all }) },
  })
}
