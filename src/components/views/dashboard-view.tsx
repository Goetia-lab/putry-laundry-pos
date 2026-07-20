'use client'

import { useDashboard } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { StatCard, PageHeader, EmptyState } from '@/components/shared/ui-bits'
import { useNavStore } from '@/lib/stores'
import { formatRupiah, formatCompactRupiah, formatDate, formatTime, getLocalDateString, buildWhatsAppUrl, formatEstimatedDate } from '@/lib/format'
import { Wallet, TrendingUp, Receipt, Building2, Lock, ArrowRight,
  Package, Clock, CheckCircle2, AlertCircle, Droplets, Banknote,
  Calendar, Bell, History, ShoppingBag, Phone, MessageCircle, Tag,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'

const PIE_COLORS = ['oklch(0.62 0.14 165)', 'oklch(0.7 0.15 80)', 'oklch(0.65 0.2 30)', 'oklch(0.6 0.13 220)', 'oklch(0.75 0.16 300)']

export function DashboardView() {
  const { data, isLoading } = useDashboard()
  const { setView } = useNavStore()
  const isMobile = useIsMobile()
  const chartH = isMobile ? 180 : 260

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Ringkasan operasional harian" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardContent className="p-5"><Skeleton className="h-72 w-full" /></CardContent></Card>
          <Card><CardContent className="p-5"><Skeleton className="h-72 w-full" /></CardContent></Card>
        </div>
      </div>
    )
  }

  const t = data.totals
  const branchData = data.branches.map((b) => ({
    name: b.branch.code,
    fullName: b.branch.name,
    Pendapatan: b.grossIncome,
    Pengeluaran: b.operationalExpenses,
    Bersih: b.netIncome,
  }))

  const categoryPie = data.branches.flatMap((b) =>
    b.topServices.map((s) => ({ name: s.name, value: s.revenue }))
  ).slice(0, 5)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Ringkasan operasional · ${formatDate(getLocalDateString())}`}
        action={
          <Button onClick={() => setView('tutup-buku')} className="gap-2">
            <Lock className="h-4 w-4" />
            Tutup Buku
          </Button>
        }
      />

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pendapatan Hari Ini"
          value={formatRupiah(t.grossIncome)}
          subtitle={`${t.transactionCount} transaksi`}
          icon={TrendingUp}
          variant="primary"
          loading={isLoading}
        />
        <StatCard
          title="Pengeluaran Operasional"
          value={formatRupiah(t.operationalExpenses)}
          subtitle="2 cabang"
          icon={Wallet}
          loading={isLoading}
        />
        <StatCard
          title="Laba Bersih"
          value={formatRupiah(t.netIncome)}
          subtitle={`Margin ${t.grossIncome > 0 ? Math.round((t.netIncome / t.grossIncome) * 100) : 0}%`}
          icon={Banknote}
          variant="success"
          loading={isLoading}
        />
        <StatCard
          title="Masuk Rekap Utama"
          value={formatRupiah(t.grandTotalToMain)}
          subtitle={`Disisihkan operasional: ${formatRupiah(t.operationalFundTotal)}`}
          icon={Droplets}
          variant="warning"
          loading={isLoading}
        />
      </div>

      {/* Weekly trend */}
      {data.weeklyTrend && data.weeklyTrend.length > 0 && (
        <Card className="mt-6 animate-fade-in-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Tren 7 Hari Terakhir
                </CardTitle>
                <CardDescription>Pendapatan vs pengeluaran gabungan semua cabang</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={chartH}>
              <AreaChart data={data.weeklyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.62 0.14 165)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.62 0.14 165)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.2 30)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.65 0.2 30)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.01 165 / 0.5)" vertical={true} horizontal={true} />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 165)' }} axisLine={{ stroke: 'oklch(0.85 0.01 165)' }} tickLine={false} dy={8} />
                <YAxis tickFormatter={(v) => formatCompactRupiah(v)} tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 165)' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} labelFormatter={(l) => formatDate(l as string)} contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid oklch(0.85 0.01 165)', boxShadow: '0 4px 12px oklch(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                <Area type="monotone" dataKey="gross" name="Pendapatan" stroke="oklch(0.62 0.14 165)" fill="url(#grossGrad)" strokeWidth={2.5} dot={{ r: 3, fill: 'oklch(0.62 0.14 165)' }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="expenses" name="Pengeluaran" stroke="oklch(0.65 0.2 30)" fill="url(#expGrad)" strokeWidth={2.5} dot={{ r: 3, fill: 'oklch(0.65 0.2 30)' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Branch comparison */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Perbandingan Cabang
            </CardTitle>
            <CardDescription>Pendapatan, pengeluaran & laba bersih per cabang hari ini</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 165)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCompactRupiah(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  formatter={(v: number) => formatRupiah(v)}
                  contentStyle={{ borderRadius: 8, border: '1px solid oklch(0.9 0.01 165)', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Pendapatan" fill="oklch(0.62 0.14 165)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="oklch(0.65 0.2 30)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Bersih" fill="oklch(0.7 0.15 80)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Layanan Terlaris</CardTitle>
            <CardDescription>Top 5 layanan hari ini</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryPie.length === 0 ? (
              <EmptyState icon={Package} title="Belum ada transaksi" description="Transaksi akan muncul di sini" />
            ) : (
              <div className="space-y-3">
                {categoryPie.map((s, i) => {
                  const max = Math.max(...categoryPie.map((x) => x.value))
                  const pct = max > 0 ? (s.value / max) * 100 : 0
                  return (
                    <div key={s.name}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{s.name}</span>
                        <span className="shrink-0 font-semibold tabular-nums">{formatCompactRupiah(s.value)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Branch detail cards */}
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold">Status Cabang</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data.branches.map((b) => (
            <Card key={b.branch.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                      {b.branch.code}
                    </div>
                    <div>
                      <CardTitle className="text-base">{b.branch.name}</CardTitle>
                      <CardDescription className="text-xs">{b.branch.address || 'Tanpa alamat'}</CardDescription>
                    </div>
                  </div>
                  {b.isClosed ? (
                    <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      <Lock className="h-3 w-3" /> Ditutup
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
                      <Clock className="h-3 w-3" /> Aktif
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Pendapatan</p>
                    <p className="font-bold tabular-nums">{formatRupiah(b.grossIncome)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Pengeluaran</p>
                    <p className="font-bold tabular-nums text-rose-600">{formatRupiah(b.operationalExpenses)}</p>
                  </div>
                  <div className="col-span-2 rounded-lg bg-primary/5 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Laba Bersih (→ Rekap Utama)</p>
                        <p className="text-lg font-bold tabular-nums text-primary">{formatRupiah(b.netIncome)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Dana Operasional Besok</p>
                        <p className="text-sm font-semibold tabular-nums">{formatRupiah(b.branch.operationalFundAmount)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Receipt className="h-3.5 w-3.5" /> {b.transactionCount} transaksi
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" /> {b.pendingCount} antrian
                  </span>
                </div>

                <Separator />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setView('tutup-buku')}
                >
                  {b.isClosed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Buku Sudah Ditutup - Lihat Detail
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Tutup Buku Cabang {b.branch.code}
                    </>
                  )}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main recap status */}
      {data.mainRecap && (
        <Card className="mt-6 border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-50 dark:to-emerald-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Rekap Utama {formatDate(data.mainRecap.recapDate)}</CardTitle>
                  <CardDescription>Kasir utama gabungan 2 cabang</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setView('rekap')}>
                Lihat <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Gross</p>
                <p className="font-bold tabular-nums">{formatRupiah(data.mainRecap.totalGrossIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pengeluaran</p>
                <p className="font-bold tabular-nums text-rose-600">{formatRupiah(data.mainRecap.totalExpenses)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dana Operasional Dikeluarkan</p>
                <p className="font-bold tabular-nums text-amber-600">{formatRupiah(data.mainRecap.totalOperationalFundDisbursed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Masuk Kas Utama</p>
                <p className="text-lg font-bold tabular-nums text-emerald-600">{formatRupiah(data.mainRecap.grandTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending & Ready for Pickup alerts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Ready for pickup */}
        <Card className="border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-white">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Siap Diambil
                    {data.readyForPickup && data.readyForPickup.length > 0 && (
                      <Badge className="bg-sky-500 text-white">{data.readyForPickup.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">Order selesai, menunggu diambil customer</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setView('transaksi')}>
                Lihat <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!data.readyForPickup || data.readyForPickup.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada order siap diambil</p>
            ) : (
              <div className="space-y-2">
                {data.readyForPickup.slice(0, 5).map((t) => (
                  <div key={t.id} className="group flex items-center justify-between gap-2 rounded-lg border border-sky-200/50 bg-card p-2.5 text-sm transition-colors hover:border-sky-300">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                        {t.branch?.code}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{t.customerName}</p>
                        <p className="text-xs text-muted-foreground">{t.invoiceNo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.customerPhone && (
                        <>
                          <a
                            href={`tel:${t.customerPhone}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500 text-white transition-transform hover:scale-105 active:scale-95"
                            title={`Telepon ${t.customerName} di ${t.customerPhone}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={buildWhatsAppUrl(t.customerPhone, `Halo ${t.customerName}, laundry Anda dengan invoice ${t.invoiceNo} sudah selesai dan siap diambil. Terima kasih! - Putry Laundry`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-white transition-transform hover:scale-105 active:scale-95"
                            title={`WhatsApp ${t.customerName} di ${t.customerPhone}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </>
                      )}
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">{formatRupiah(t.totalAmount)}</p>
                        <p className="text-[10px] text-muted-foreground">{formatTime(t.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* In process */}
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Sedang Diproses
                    {data.pendingOrders && data.pendingOrders.length > 0 && (
                      <Badge className="bg-amber-500 text-white">{data.pendingOrders.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">Order dalam proses pencucian</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setView('transaksi')}>
                Lihat <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!data.pendingOrders || data.pendingOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada order dalam proses</p>
            ) : (
              <div className="space-y-2">
                {data.pendingOrders.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-200/50 bg-card p-2.5 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        {t.branch?.code}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{t.customerName}</p>
                        <p className="text-xs text-muted-foreground">{t.invoiceNo}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold tabular-nums">{formatRupiah(t.totalAmount)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatTime(t.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Transaksi Terbaru Hari Ini</CardTitle>
                <CardDescription>5 transaksi terakhir</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setView('transaksi')}>
              Semua <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!data.recentTransactions || data.recentTransactions.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="Belum ada transaksi hari ini" description="Transaksi yang dibuat akan muncul di sini" />
          ) : (
            <div className="space-y-2">
              {data.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {t.branch?.code}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-mono text-sm font-semibold">{t.invoiceNo}</p>
                        <Badge className={`h-5 text-[10px] ${t.status === 'PROSES' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : t.status === 'SELESAI' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                          {t.status}
                        </Badge>
                        {(t.discountPercent ?? 0) > 0 && (
                          <Badge className="h-5 gap-0.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                            <Tag className="h-2.5 w-2.5" />
                            {t.discountPercent}%
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm font-medium">{t.customerName}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(t.date)} WIB · {t.items?.length || 0} item</p>
                      {t.status === 'PROSES' && t.items && (
                        <DashboardEstBadge date={t.date} items={t.items} />
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold tabular-nums">{formatRupiah(t.totalAmount)}</p>
                    {t.paymentStatus === 'BELUM_BAYAR' && (
                      <Badge variant="destructive" className="h-4 text-[9px]">Belum Bayar</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!data.totals.allClosed && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Belum semua cabang melakukan tutup buku</p>
            <p className="text-amber-700 dark:text-amber-400">Lakukan tutup buku harian setiap pukul 20.00 WIB untuk merekap ke kasir utama.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact estimated date badge for dashboard
function DashboardEstBadge({ date, items }: { date: string; items: Array<{ variant?: string | null }> }) {
  const { label, isOverdue, daysLeft } = formatEstimatedDate(date, items)
  const colorClass = isOverdue
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
    : daysLeft <= 1
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
  return (
    <span className={`mt-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium ${colorClass}`}>
      {isOverdue ? <AlertCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
      {label}
    </span>
  )
}
