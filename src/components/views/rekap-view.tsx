'use client'

import { useMainRecaps } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { PageHeader, EmptyState, StatCard } from '@/components/shared/ui-bits'
import { formatRupiah, formatDate } from '@/lib/format'
import {
  BookOpen, TrendingUp, Wallet, Banknote, Droplets, ChevronDown, ChevronUp, Building2, ArrowRight,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function RekapView() {
  const { data: recaps, isLoading } = useMainRecaps()
  const [expanded, setExpanded] = useState<string | null>(null)

  const totals = recaps?.reduce(
    (acc, r) => ({
      gross: acc.gross + r.totalGrossIncome,
      expenses: acc.expenses + r.totalExpenses,
      net: acc.net + r.totalNetIncome,
      disbursed: acc.disbursed + r.totalOperationalFundDisbursed,
      grand: acc.grand + r.grandTotal,
    }),
    { gross: 0, expenses: 0, net: 0, disbursed: 0, grand: 0 }
  ) ?? { gross: 0, expenses: 0, net: 0, disbursed: 0, grand: 0 }

  return (
    <div>
      <PageHeader title="Rekap Utama" description="Gabungan kasir utama dari seluruh cabang" />

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Gross" value={formatRupiah(totals.gross)} icon={TrendingUp} variant="primary" loading={isLoading} />
        <StatCard title="Total Pengeluaran" value={formatRupiah(totals.expenses)} icon={Wallet} loading={isLoading} />
        <StatCard title="Total Dana Operasional" value={formatRupiah(totals.disbursed)} icon={Droplets} variant="warning" loading={isLoading} />
        <StatCard title="Total Kas Utama" value={formatRupiah(totals.grand)} icon={Banknote} variant="success" loading={isLoading} />
      </div>

      {/* Recap list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Riwayat Rekap Harian
          </CardTitle>
          <CardDescription>Klik tanggal untuk melihat rincian per cabang</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : !recaps || recaps.length === 0 ? (
            <EmptyState icon={BookOpen} title="Belum ada rekap" description="Lakukan tutup buku harian untuk membuat rekap utama." />
          ) : (
            <div className="space-y-2">
              {recaps.map((r) => {
                const isOpen = expanded === r.id
                return (
                  <div key={r.id} className="overflow-hidden rounded-xl border transition-colors hover:bg-muted/30">
                    <button
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{formatDate(r.recapDate)}</p>
                          <p className="text-xs text-muted-foreground">{r.entries?.length || 0} cabang · {formatRupiah(r.grandTotal)} masuk kas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden text-right sm:block">
                          <p className="text-xs text-muted-foreground">Kas Utama</p>
                          <p className="font-bold tabular-nums text-emerald-600">{formatRupiah(r.grandTotal)}</p>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Badge>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t bg-muted/20 p-4">
                        {/* Summary bar */}
                        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2.5">
                            <p className="text-[10px] uppercase text-muted-foreground">Gross</p>
                            <p className="text-sm font-bold tabular-nums">{formatRupiah(r.totalGrossIncome)}</p>
                          </div>
                          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-2.5">
                            <p className="text-[10px] uppercase text-muted-foreground">Pengeluaran</p>
                            <p className="text-sm font-bold tabular-nums">{formatRupiah(r.totalExpenses)}</p>
                          </div>
                          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5">
                            <p className="text-[10px] uppercase text-muted-foreground">Dana Operasional</p>
                            <p className="text-sm font-bold tabular-nums">{formatRupiah(r.totalOperationalFundDisbursed)}</p>
                          </div>
                          <div className="rounded-lg bg-primary/10 p-2.5">
                            <p className="text-[10px] uppercase text-muted-foreground">Kas Utama</p>
                            <p className="text-sm font-bold tabular-nums text-primary">{formatRupiah(r.grandTotal)}</p>
                          </div>
                        </div>

                        {/* Per branch entries */}
                        <div className="space-y-2">
                          {r.entries?.map((e) => (
                            <div key={e.id} className="rounded-lg border bg-card p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                                    {e.branch?.code}
                                  </span>
                                  <span className="text-sm font-medium">{e.branch?.name}</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold tabular-nums text-emerald-600">{formatRupiah(e.netToMain)}</p>
                                  <p className="text-[10px] text-muted-foreground">net ke kas utama</p>
                                </div>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                                <div>
                                  <p className="text-muted-foreground">Gross</p>
                                  <p className="font-semibold tabular-nums">{formatRupiah(e.grossIncome)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Pengeluaran</p>
                                  <p className="font-semibold tabular-nums text-rose-600">{formatRupiah(e.expenses)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Laba Bersih</p>
                                  <p className="font-semibold tabular-nums">{formatRupiah(e.netIncome)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Operasional Besok</p>
                                  <p className="font-semibold tabular-nums text-amber-600">{formatRupiah(e.operationalFundDisbursed)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-xs">
                          <ArrowRight className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">
                            Total laba bersih <span className="font-semibold text-foreground">{formatRupiah(r.totalNetIncome)}</span> masuk rekap utama,
                            lalu <span className="font-semibold text-amber-600">{formatRupiah(r.totalOperationalFundDisbursed)}</span> disisihkan kembali sebagai dana operasional cabang besok.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
