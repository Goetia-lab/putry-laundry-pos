'use client'

import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

// Generic fetcher — auto-attach API key for auth
// ponytail: client-side API_KEY via NEXT_PUBLIC env. Upgrade to real session auth when >5 users.
// IMPORTANT: NEXT_PUBLIC_API_KEY must be set in Vercel env for browser requests to work
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request gagal' }))
    throw new Error(data.error || 'Request gagal')
  }
  return res.json()
}

// Mutation helper — same auto-auth, handles JSON body for POST/PATCH and bare DELETE
// ponytail: fuse with fetcher() when React Query v6 supports unified hooks
async function mutate<T>(url: string, options?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: options?.method || 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Gagal' }))
    throw new Error(err.error)
  }
  return res.json()
}

export interface Branch {
  id: string
  name: string
  code: string
  address?: string | null
  phone?: string | null
  operationalFundAmount: number
  isActive: boolean
  _count?: { transactions: number }
}

export interface Service {
  id: string
  category: string
  name: string
  variant: string | null
  price: number
  unit: string
  duration: string | null
  isActive: boolean
  sortOrder: number
}

export interface TransactionItem {
  id: string
  transactionId: string
  serviceId: string | null
  serviceName: string
  category: string
  variant: string | null
  price: number
  unit: string
  quantity: number
  subtotal: number
}

export interface Transaction {
  id: string
  invoiceNo: string
  branchId: string
  customerName: string
  customerPhone?: string | null
  customerOrderIndex?: number | null
  date: string
  pickupDate?: string | null
  status: string
  paymentStatus: string
  subtotal?: number
  discountPercent?: number
  discountAmount?: number
  totalAmount: number
  paidAmount: number
  changeAmount: number
  notes?: string | null
  branch?: Branch
  items?: TransactionItem[]
}

export interface DailyClosing {
  id: string
  branchId: string
  date: string
  closingDate: string
  grossIncome: number
  transactionCount: number
  operationalExpenses: number
  netIncome: number
  transferredToMain: number
  operationalFundRetained: number
  status: string
  closingTime: string
  notes?: string | null
  branch?: Branch
}

export interface MainRecapEntry {
  id: string
  recapId: string
  branchId: string
  grossIncome: number
  expenses: number
  netIncome: number
  operationalFundDisbursed: number
  netToMain: number
  branch?: Branch
}

export interface MainRecap {
  id: string
  recapDate: string
  totalGrossIncome: number
  totalExpenses: number
  totalNetIncome: number
  totalOperationalFundDisbursed: number
  grandTotal: number
  status: string
  notes?: string | null
  entries?: MainRecapEntry[]
}

export interface DashboardData {
  date: string
  branches: Array<{
    branch: Branch
    grossIncome: number
    transactionCount: number
    operationalExpenses: number
    netIncome: number
    isClosed: boolean
    closing?: DailyClosing | null
    pendingCount: number
    topServices: Array<{ name: string; category: string; qty: number; revenue: number }>
  }>
  mainRecap: (MainRecap & { entries?: MainRecapEntry[] }) | null
  weeklyTrend?: Array<{ date: string; gross: number; expenses: number; net: number; count: number }>
  recentTransactions?: Transaction[]
  pendingOrders?: Transaction[]
  readyForPickup?: Transaction[]
  recentExpenses?: OperationalExpense[]
  totals: {
    grossIncome: number
    operationalExpenses: number
    netIncome: number
    transactionCount: number
    operationalFundTotal: number
    grandTotalToMain: number
    allClosed: boolean
  }
}

export interface OperationalExpense {
  id: string
  branchId: string
  date: string
  category: string
  description: string
  amount: number
  branch?: Branch
}

export interface ReportData {
  startDate: string
  endDate: string
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  transactionCount: number
  totalSubtotal?: number
  totalDiscountGiven?: number
  discountedTransactionCount?: number
  avgDiscountPercent?: number
  salesByBranch: Array<{ branchId: string; branchName: string; code: string; revenue: number; count: number }>
  salesByCategory: Array<{ category: string; revenue: number; qty: number }>
  salesByService: Array<{ name: string; category: string; variant: string | null; revenue: number; qty: number }>
  dailyTrend: Array<{ date: string; revenue: number; count: number; expenses: number }>
}

// Hooks
export function useBranches() {
  return useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: () => fetcher<{ success: boolean; data: Branch[] }>('/api/branches').then((r) => r.data),
    staleTime: 30 * 60 * 1000,   // cabang jarang berubah
    gcTime: 60 * 60 * 1000,
  })
}

export function useServices(category?: string) {
  return useQuery<Service[]>({
    queryKey: ['services', category],
    queryFn: () =>
      fetcher<{ success: boolean; data: Service[] }>(
        `/api/services${category ? `?category=${category}` : ''}`
      ).then((r) => r.data),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}

export function useTransactions(params?: { branchId?: string; date?: string; status?: string; paymentStatus?: string; limit?: number }) {
  const qs = new URLSearchParams()
  if (params?.branchId) qs.set('branchId', params.branchId)
  if (params?.date) qs.set('date', params.date)
  if (params?.status) qs.set('status', params.status)
  if (params?.paymentStatus) qs.set('paymentStatus', params.paymentStatus)
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()
  return useQuery<Transaction[]>({
    queryKey: ['transactions', params],
    queryFn: () => fetcher<{ success: boolean; data: Transaction[] }>(`/api/transactions${query ? `?${query}` : ''}`).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000, // 30 detik — transaksi berubah lebih sering
  })
}

export function useExpenses(branchId?: string, date?: string) {
  const qs = new URLSearchParams()
  if (branchId) qs.set('branchId', branchId)
  if (date) qs.set('date', date)
  const query = qs.toString()
  return useQuery<OperationalExpense[]>({
    queryKey: ['expenses', branchId, date],
    queryFn: () => fetcher<{ success: boolean; data: OperationalExpense[] }>(`/api/expenses${query ? `?${query}` : ''}`).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useDailyClosings(branchId?: string, date?: string) {
  const qs = new URLSearchParams()
  if (branchId) qs.set('branchId', branchId)
  if (date) qs.set('date', date)
  const query = qs.toString()
  return useQuery<DailyClosing[]>({
    queryKey: ['daily-closings', branchId, date],
    queryFn: () => fetcher<{ success: boolean; data: DailyClosing[] }>(`/api/daily-closing${query ? `?${query}` : ''}`).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMainRecaps() {
  return useQuery<MainRecap[]>({
    queryKey: ['main-recaps'],
    queryFn: () => fetcher<{ success: boolean; data: MainRecap[] }>('/api/recap').then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDashboard(date?: string) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', date],
    queryFn: () => fetcher<{ success: boolean; data: DashboardData }>(`/api/dashboard${date ? `?date=${date}` : ''}`).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useReport(startDate: string, endDate: string, branchId?: string) {
  const qs = new URLSearchParams({ startDate, endDate })
  if (branchId && branchId !== 'all') qs.set('branchId', branchId)
  return useQuery<ReportData>({
    queryKey: ['report', startDate, endDate, branchId],
    queryFn: () => fetcher<{ success: boolean; data: ReportData }>(`/api/reports?${qs.toString()}`).then((r) => r.data),
    enabled: !!startDate && !!endDate,
    placeholderData: keepPreviousData,
  })
}

// Mutations
export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return mutate('/api/transactions', { body: data })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      return mutate(`/api/transactions/${id}`, { method: 'PATCH', body: data })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return mutate('/api/expenses', { body: data })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDailyClose() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { branchId: string; date?: string; notes?: string }) => {
      return mutate('/api/daily-closing', { body: data })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-closings'] })
      qc.invalidateQueries({ queryKey: ['main-recaps'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return mutate('/api/services', { body: data })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      return mutate(`/api/services/${id}`, { method: 'PATCH', body: data })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export function useUpdateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      return mutate(`/api/branches/${id}`, { method: 'PATCH', body: data })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  })
}

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return mutate('/api/branches', { body: data })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  })
}

// Use client-side time for Jakarta.
// Returns `null` on the first render (and during SSR) so that server and
// client markup match, avoiding hydration mismatches caused by the clock.
// The real time is set right after mount.
export function useJakartaNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  return now
}

// Delete transaction
export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return mutate(`/api/transactions/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Delete expense
export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return mutate(`/api/expenses/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Customer type
export interface Customer {
  id: string
  name: string
  phone?: string | null
  address?: string | null
  branchId?: string | null
  branch?: Branch | null
  createdAt: string
  _count?: { transactions: number }
  totalSpent?: number
  transactionCount?: number
}

// Customers hooks
export function useCustomers(search?: string, branchId?: string) {
  const qs = new URLSearchParams()
  if (search) qs.set('search', search)
  if (branchId) qs.set('branchId', branchId)
  const query = qs.toString()
  return useQuery<Customer[]>({
    queryKey: ['customers', search, branchId],
    queryFn: () => fetcher<{ success: boolean; data: Customer[] }>(`/api/customers${query ? `?${query}` : ''}`).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return mutate('/api/customers', { body: data })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      return mutate(`/api/customers/${id}`, { method: 'PATCH', body: data })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return mutate(`/api/customers/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
