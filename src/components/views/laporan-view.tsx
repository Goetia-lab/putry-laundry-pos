'use client'

import { useState } from 'react'
import { useReport, useBranches } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader, EmptyState, StatCard } from '@/components/shared/ui-bits'
import { formatRupiah, formatCompactRupiah, formatDate, getLocalDateString } from '@/lib/format'
import { toast } from 'sonner'
import {
  BarChart3, TrendingUp, Wallet, Receipt, Building2, Package, Calendar, Download, Tag, Crown, Percent,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Area, AreaChart,
} from 'recharts'

const PIE_COLORS = ['oklch(0.62 0.14 165)', 'oklch(0.7 0.15 80)', 'oklch(0.65 0.2 30)', 'oklch(0.6 0.13 220)', 'oklch(0.75 0.16 300)', 'oklch(0.7 0.15 200)']

function getDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  // Use local date string to avoid timezone shift
  const jakartaTime = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const y = jakartaTime.getFullYear()
  const m = String(jakartaTime.getMonth() + 1).padStart(2, '0')
  const day = String(jakartaTime.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function LaporanView() {
  const [endDate, setEndDate] = useState(getLocalDateString())
  const [startDate, setStartDate] = useState(() => getDateDaysAgo(6))
  const [branchId, setBranchId] = useState('all')
  const [tab, setTab] = useState('overview')

  const { data: branches } = useBranches()
  const { data: report, isLoading } = useReport(startDate, endDate, branchId)

  const handleExport = () => {
    const qs = new URLSearchParams({ startDate, endDate })
    if (branchId !== 'all') qs.set('branchId', branchId)
    window.open(`/api/reports/export?${qs.toString()}`, '_blank')
    toast.success('Mengekspor laporan CSV...')
  }

  return (
    <div>
      <PageHeader
        title="Laporan"
        description="Analisis penjualan & performa cabang"
        action={
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end lg:flex-wrap">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Dari Tanggal</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full lg:w-[160px]" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Sampai Tanggal</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full lg:w-[160px]" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Cabang</label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-full lg:w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Cabang</SelectItem>
                {branches?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-1.5 lg:ml-auto">
            <Button variant="outline" size="sm" onClick={() => { setStartDate(getDateDaysAgo(0)); setEndDate(getLocalDateString()); }}>Hari Ini</Button>
            <Button variant="outline" size="sm" onClick={() => { setStartDate(getDateDaysAgo(6)); setEndDate(getLocalDateString()); }}>7 Hari</Button>
            <Button variant="outline" size="sm" onClick={() => { setStartDate(getDateDaysAgo(29)); setEndDate(getLocalDateString()); }}>30 Hari</Button>
            <Button variant="outline" size="sm" onClick={() => { setStartDate(getDateDaysAgo(89)); setEndDate(getLocalDateString()); }}>90 Hari</Button>
          </div>
        </CardContent>
      </Card>

      {isLoading || !report ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Card key={i}><CardContent className="h-24 animate-pulse bg-muted/40" /></Card>)}</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Pendapatan" value={formatRupiah(report.totalRevenue)} subtitle={`${report.transactionCount} transaksi`} icon={TrendingUp} variant="primary" />
            <StatCard title="Total Pengeluaran" value={formatRupiah(report.totalExpenses)} icon={Wallet} />
            <StatCard title="Laba Bersih" value={formatRupiah(report.netIncome)} subtitle={`Margin ${report.totalRevenue > 0 ? Math.round((report.netIncome / report.totalRevenue) * 100) : 0}%`} icon={Receipt} variant="success" />
            <StatCard title="Rata-rata / Transaksi" value={formatRupiah(report.transactionCount > 0 ? Math.round(report.totalRevenue / report.transactionCount) : 0)} icon={BarChart3} />
          </div>

          {/* Discount Analytics */}
          {(report.totalDiscountGiven ?? 0) > 0 && (
            <Card className="mt-4 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:border-emerald-900 dark:from-emerald-950/30 dark:to-teal-950/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Analitik Diskon Loyalty</CardTitle>
                      <CardDescription>Ringkasan diskon diberikan kepada pelanggan loyal</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-emerald-200/50 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <Tag className="h-3.5 w-3.5" />
                      <p className="text-[10px] uppercase font-medium">Total Diskon</p>
                    </div>
                    <p className="mt-1 text-lg font-bold tabular-nums text-emerald-600">{formatRupiah(report.totalDiscountGiven ?? 0)}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200/50 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <Receipt className="h-3.5 w-3.5" />
                      <p className="text-[10px] uppercase font-medium">Transaksi Diskon</p>
                    </div>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {report.discountedTransactionCount ?? 0}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">/ {report.transactionCount}</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-200/50 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <Percent className="h-3.5 w-3.5" />
                      <p className="text-[10px] uppercase font-medium">Rata-rata Diskon</p>
                    </div>
                    <p className="mt-1 text-lg font-bold tabular-nums">{(report.avgDiscountPercent ?? 0).toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200/50 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <p className="text-[10px] uppercase font-medium">Pendapatan Asli</p>
                    </div>
                    <p className="mt-1 text-lg font-bold tabular-nums">{formatRupiah(report.totalSubtotal ?? report.totalRevenue)}</p>
                  </div>
                </div>
                {/* Discount rate insight */}
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100/50 dark:bg-emerald-950/30 px-3 py-2 text-xs">
                  <Crown className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-emerald-800 dark:text-emerald-300">
                    {report.transactionCount > 0
                      ? `${Math.round(((report.discountedTransactionCount ?? 0) / report.transactionCount) * 100)}% transaksi mendapat diskon loyalty · ${(report.avgDiscountPercent ?? 0).toFixed(1)}% rata-rata diskon per transaksi`
                      : 'Belum ada transaksi dengan diskon'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList>
              <TabsTrigger value="overview">Tren & Cabang</TabsTrigger>
              <TabsTrigger value="services">Layanan</TabsTrigger>
            </TabsList>

            {tab === 'overview' && (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {/* Daily trend */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5 text-primary" />
                      Tren Pendapatan Harian
                    </CardTitle>
                    <CardDescription>Pendapatan vs pengeluaran per hari</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={report.dailyTrend}>
                        <defs>
                          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.62 0.14 165)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="oklch(0.62 0.14 165)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.65 0.2 30)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="oklch(0.65 0.2 30)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 165)" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(v) => formatCompactRupiah(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                        <Tooltip formatter={(v: number) => formatRupiah(v)} labelFormatter={(l) => formatDate(l as string)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Area type="monotone" dataKey="revenue" name="Pendapatan" stroke="oklch(0.62 0.14 165)" fill="url(#rev)" strokeWidth={2} />
                        <Area type="monotone" dataKey="expenses" name="Pengeluaran" stroke="oklch(0.65 0.2 30)" fill="url(#exp)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Sales by branch */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-5 w-5 text-primary" />
                      Per Cabang
                    </CardTitle>
                    <CardDescription>Pendapatan & jumlah transaksi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.salesByBranch.length === 0 ? (
                      <EmptyState icon={Building2} title="Tidak ada data" />
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={report.salesByBranch} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 165)" horizontal={false} />
                          <XAxis type="number" tickFormatter={(v) => formatCompactRupiah(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="code" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="revenue" name="Pendapatan" fill="oklch(0.62 0.14 165)" radius={[0, 4, 4, 0]} barSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <div className="mt-3 space-y-1.5">
                      {report.salesByBranch.map((b) => (
                        <div key={b.branchId} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">{b.code}</span>
                            <span className="truncate">{b.branchName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">{b.count} trx</Badge>
                            <span className="font-semibold tabular-nums">{formatRupiah(b.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sales by category pie */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-5 w-5 text-primary" />
                      Per Kategori
                    </CardTitle>
                    <CardDescription>Distribusi pendapatan per kategori layanan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.salesByCategory.length === 0 ? (
                      <EmptyState icon={Package} title="Tidak ada data" />
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={report.salesByCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                            {report.salesByCategory.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'services' && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-5 w-5 text-primary" />
                    Penjualan per Layanan
                  </CardTitle>
                  <CardDescription>Detail performa setiap layanan</CardDescription>
                </CardHeader>
                <CardContent>
                  {report.salesByService.length === 0 ? (
                    <EmptyState icon={Package} title="Tidak ada data" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                            <th className="py-2 pr-3 font-medium">Layanan</th>
                            <th className="py-2 px-3 font-medium">Kategori</th>
                            <th className="py-2 px-3 text-right font-medium">Qty</th>
                            <th className="py-2 px-3 text-right font-medium">Pendapatan</th>
                            <th className="py-2 pl-3 text-right font-medium">% Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.salesByService.map((s, i) => {
                            const pct = report.totalRevenue > 0 ? (s.revenue / report.totalRevenue) * 100 : 0
                            return (
                              <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                                <td className="py-2.5 pr-3">
                                  <span className="font-medium">{s.name}</span>
                                  {s.variant && <Badge variant="outline" className="ml-2 h-5 text-[10px]">{s.variant}</Badge>}
                                </td>
                                <td className="py-2.5 px-3"><Badge variant="secondary" className="text-xs">{s.category}</Badge></td>
                                <td className="py-2.5 px-3 text-right tabular-nums">{s.qty} {s.category === 'Jasa' || s.category === 'Gorden' ? 'kg' : 'pcs'}</td>
                                <td className="py-2.5 px-3 text-right font-semibold tabular-nums">{formatRupiah(s.revenue)}</td>
                                <td className="py-2.5 pl-3 text-right tabular-nums text-muted-foreground">{pct.toFixed(1)}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </Tabs>
        </>
      )}
    </div>
  )
}
