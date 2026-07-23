'use client'

import { useState } from 'react'
import { useBranches, useDashboard, useExpenses, useDailyClose, useCreateExpense, useDailyClosings, useDeleteExpense, useJakartaNow, type OperationalExpense } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, EmptyState, StatCard } from '@/components/shared/ui-bits'
import { formatRupiah, formatDate, getLocalDateString, EXPENSE_CATEGORIES, isPastClosingTime } from '@/lib/format'
import { toast } from 'sonner'
import {
  Lock, CheckCircle2, Building2, Wallet, TrendingUp, Droplets,
  Plus, Trash2, Receipt, Banknote, Clock, AlertCircle, ArrowRight, Package,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'

const EXPENSE_LABELS: Record<string, string> = {
  DETERGEN: 'Detergen / Sabun',
  PARFUM: 'Parfum / Pewangi',
  PLASTIK: 'Plastik / Packaging',
  LISTRIK: 'Listrik',
  AIR: 'Air',
  GAJI: 'Gaji Karyawan',
  TRANSPORT: 'Transport',
  LAINNYA: 'Lain-lain',
}

export function TutupBukuView() {
  const now = useJakartaNow()
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString())
  const { data: dashboard, isLoading } = useDashboard(selectedDate)
  const { data: branches } = useBranches()
  const dailyClose = useDailyClose()
  const [closingBranch, setClosingBranch] = useState<string | null>(null)
  const [closingNotes, setClosingNotes] = useState('')
  const [expenseDialogBranch, setExpenseDialogBranch] = useState<string | null>(null)

  const isToday = selectedDate === getLocalDateString()
  const pastClosing = isToday ? isPastClosingTime(now ?? undefined) : true

  if (isLoading || !dashboard) {
    return (
      <div>
        <PageHeader title="Tutup Buku" description="Closing kas harian per cabang" />
        <div className="grid gap-4 sm:grid-cols-2">{[...Array(2)].map((_, i) => <Card key={i}><CardContent className="h-64 animate-pulse bg-muted/40" /></Card>)}</div>
      </div>
    )
  }

  const handleClose = async (branchId: string) => {
    try {
      await dailyClose.mutateAsync({ branchId, date: selectedDate, notes: closingNotes || undefined })
      toast.success('Tutup buku berhasil! Data masuk ke rekap utama.')
      setClosingBranch(null)
      setClosingNotes('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal tutup buku')
    }
  }

  const branchInDialog = dashboard.branches.find((b) => b.branch.id === closingBranch)

  return (
    <div>
      <PageHeader
        title="Tutup Buku Harian"
        description="Closing kas per cabang · pukul 20.00 WIB"
        action={
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[180px]"
          />
        }
      />

      {/* Info banner */}
      <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${pastClosing ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'}`}>
        {pastClosing ? <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" /> : <Clock className="h-5 w-5 shrink-0 text-emerald-600" />}
        <div className="text-sm">
          <p className={`font-semibold ${pastClosing ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
            {pastClosing ? 'Waktunya Tutup Buku!' : 'Belum waktunya tutup buku'}
          </p>
          <p className={pastClosing ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>
            {pastClosing
              ? 'Tutup buku dilakukan setiap hari pukul 20.00 WIB. Laba bersih tiap cabang masuk ke rekap utama, dan dana operasional otomatis disisihkan untuk besok.'
              : `Tutup buku bisa dilakukan mulai pukul 20.00 WIB. Sekarang pukul ${(now ?? new Date()).getHours().toString().padStart(2, '0')}:${(now ?? new Date()).getMinutes().toString().padStart(2, '0')} WIB.`
            }
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Gross Hari Ini" value={formatRupiah(dashboard.totals.grossIncome)} icon={TrendingUp} variant="primary" />
        <StatCard title="Total Pengeluaran" value={formatRupiah(dashboard.totals.operationalExpenses)} icon={Wallet} />
        <StatCard title="Total Laba Bersih" value={formatRupiah(dashboard.totals.netIncome)} icon={Banknote} variant="success" />
        <StatCard title="Dana Operasional Besok" value={formatRupiah(dashboard.totals.operationalFundTotal)} icon={Droplets} variant="warning" />
      </div>

      {/* Branch closing cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {dashboard.branches.map((b) => (
          <BranchClosingCard
            key={b.branch.id}
            branchStat={b}
            date={selectedDate}
            onAddExpense={() => setExpenseDialogBranch(b.branch.id)}
            onClose={() => { setClosingBranch(b.branch.id); setClosingNotes('') }}
          />
        ))}
      </div>

      {/* Closing confirmation dialog */}
      <Dialog open={!!closingBranch} onOpenChange={(o) => !o && setClosingBranch(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Konfirmasi Tutup Buku
            </DialogTitle>
            <DialogDescription>
              {branchInDialog && `Cabang ${branchInDialog.branch.name} · ${formatDate(selectedDate)}`}
            </DialogDescription>
          </DialogHeader>
          {branchInDialog && (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Pendapatan Kotor</span><span className="font-semibold tabular-nums">{formatRupiah(branchInDialog.grossIncome)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pengeluaran Operasional</span><span className="font-semibold tabular-nums text-rose-600">{formatRupiah(branchInDialog.operationalExpenses)}</span></div>
                <Separator />
                <div className="flex justify-between text-base"><span className="font-semibold">Laba Bersih</span><span className="font-bold tabular-nums text-emerald-600">{formatRupiah(branchInDialog.netIncome)}</span></div>
                <div className="mt-2 rounded-md bg-primary/10 p-2 text-xs">
                  <p className="font-medium text-primary">→ Masuk Rekap Utama: {formatRupiah(branchInDialog.netIncome)}</p>
                  <p className="mt-0.5 text-muted-foreground">→ Dana operasional besok (float): {formatRupiah(branchInDialog.branch.operationalFundAmount)}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cnotes">Catatan (opsional)</Label>
                <Input id="cnotes" value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} placeholder="Catatan tutup buku..." />
              </div>
              {branchInDialog.isClosed && (
                <p className="flex items-center gap-2 text-xs text-amber-600">
                  <AlertCircle className="h-4 w-4" /> Cabang ini sudah ditutup. Menutup ulang akan memperbarui data.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosingBranch(null)}>Batal</Button>
            <Button onClick={() => closingBranch && handleClose(closingBranch)} disabled={dailyClose.isPending} className="gap-2">
              {dailyClose.isPending ? 'Memproses...' : 'Konfirmasi Tutup Buku'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense dialog */}
      <ExpenseDialog
        branchId={expenseDialogBranch}
        date={selectedDate}
        onClose={() => setExpenseDialogBranch(null)}
      />
    </div>
  )
}

function BranchClosingCard({ branchStat, date, onAddExpense, onClose }: {
  branchStat: NonNullable<ReturnType<typeof useDashboard>['data']>['branches'][number]
  date: string
  onAddExpense: () => void
  onClose: () => void
}) {
  const { data: expenses } = useExpenses(branchStat.branch.id, date)
  const b = branchStat

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
              {b.branch.code}
            </div>
            <div>
              <CardTitle className="text-base">{b.branch.name}</CardTitle>
              <CardDescription className="text-xs">{b.transactionCount} transaksi · {b.pendingCount} antrian proses</CardDescription>
            </div>
          </div>
          {b.isClosed ? (
            <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              <CheckCircle2 className="h-3 w-3" /> Selesai
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
              <Clock className="h-3 w-3" /> Aktif
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Income breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
            <span className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" /> Pendapatan (Lunas)</span>
            <span className="font-bold tabular-nums">{formatRupiah(b.grossIncome)}</span>
          </div>
          {b.pendingAmount > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
              <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> Belum Bayar ({b.pendingCount})</span>
              <span className="font-bold tabular-nums text-amber-600">{formatRupiah(b.pendingAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg bg-rose-50 dark:bg-rose-950/30 px-3 py-2">
            <span className="flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" /> Pengeluaran</span>
            <span className="font-bold tabular-nums text-rose-600">{formatRupiah(b.operationalExpenses)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5">
            <span className="font-semibold">Laba Bersih</span>
            <span className="text-lg font-bold tabular-nums text-primary">{formatRupiah(b.netIncome)}</span>
          </div>
        </div>

        {/* Expense list */}
        {expenses && expenses.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rincian Pengeluaran</p>
            <div className="max-h-32 space-y-1 overflow-y-auto custom-scroll">
              {expenses.map((e) => (
                <div key={e.id} className="group flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="h-5 shrink-0 text-[10px]">{EXPENSE_LABELS[e.category] || e.category}</Badge>
                    <span className="truncate">{e.description}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-semibold tabular-nums text-rose-600">{formatRupiah(e.amount)}</span>
                    <ExpenseDeleteButton id={e.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Recap preview */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
          <p className="font-semibold text-primary">Ringkasan ke Rekap Utama</p>
          <div className="mt-1.5 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Laba bersih → rekap utama</span>
              <span className="font-semibold tabular-nums">{formatRupiah(b.netIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dana operasional besok (float)</span>
              <span className="font-semibold tabular-nums text-amber-600">{formatRupiah(b.branch.operationalFundAmount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={onAddExpense}>
            <Plus className="h-4 w-4" /> Pengeluaran
          </Button>
          <Button size="sm" className="flex-1 gap-1.5" onClick={onClose}>
            {b.isClosed ? <><CheckCircle2 className="h-4 w-4" /> Tutup Ulang</> : <><Lock className="h-4 w-4" /> Tutup Buku</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ExpenseDialog({ branchId, date, onClose }: { branchId: string | null; date: string; onClose: () => void }) {
  const createExpense = useCreateExpense()
  const { data: branches } = useBranches()
  const [category, setCategory] = useState('DETERGEN')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const branch = branches?.find((b) => b.id === branchId)

  const handleSubmit = async () => {
    if (!branchId) return
    if (!description.trim() || !amount) {
      toast.error('Deskripsi dan jumlah wajib diisi')
      return
    }
    try {
      await createExpense.mutateAsync({
        branchId,
        category,
        description: description.trim(),
        amount: Number(amount),
        date,
      })
      toast.success('Pengeluaran ditambahkan')
      setDescription('')
      setAmount('')
      setCategory('DETERGEN')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menambah pengeluaran')
    }
  }

  return (
    <Dialog open={!!branchId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Tambah Pengeluaran
          </DialogTitle>
          <DialogDescription>
            {branch && `${branch.name} · ${formatDate(date)}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{EXPENSE_LABELS[c] || c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Deskripsi</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contoh: Beli detergen 5kg" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amt">Jumlah (Rp)</Label>
            <Input id="amt" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="text-lg font-semibold tabular-nums" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={createExpense.isPending}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExpenseDeleteButton({ id }: { id: string }) {
  const deleteExpense = useDeleteExpense()
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteExpense.mutateAsync(id)
      toast.success('Pengeluaran dihapus')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }
  return (
    <button
      onClick={handleDelete}
      className="ml-1 flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100"
      title="Hapus pengeluaran"
    >
      <Trash2 className="h-3 w-3" />
    </button>
  )
}
