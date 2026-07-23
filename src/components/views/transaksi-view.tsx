'use client'

import { useState } from 'react'
import { useTransactions, useBranches, useUpdateTransaction, useDeleteTransaction, type Transaction } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PageHeader, EmptyState } from '@/components/shared/ui-bits'
import { formatRupiah, formatDateTime, formatTime, formatEstimatedDate } from '@/lib/format'
import { toast } from 'sonner'
import {
  Receipt, Search, CheckCircle2, Check, Banknote, Printer, Trash2,
  Package, Phone, Clock, X, Tag, CalendarClock, Zap, AlertTriangle,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const STATUS_STYLES: Record<string, string> = {
  PROSES: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  SELESAI: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  DIAMBIL: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
}

const STATUS_LABELS: Record<string, string> = {
  PROSES: 'Sedang Diproses',
  SELESAI: 'Selesai - Siap Diambil',
  DIAMBIL: 'Sudah Diambil',
}

export function TransaksiView() {
  const [branchId, setBranchId] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [detailTx, setDetailTx] = useState<Transaction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: branches } = useBranches()
  const { data: transactions, isLoading } = useTransactions({
    branchId: branchId !== 'all' ? branchId : undefined,
    status: status !== 'all' ? status : undefined,
    paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
    limit: 200,
  })

  const filtered = transactions?.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.invoiceNo.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || (t.customerPhone?.toLowerCase().includes(q) ?? false)
  })

  const updateMutation = useUpdateTransaction()
  const handleQuickStatus = async (id: string, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ id, status: newStatus })
      toast.success(`Status diubah ke ${STATUS_LABELS[newStatus] || newStatus}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengubah status')
    }
  }

  return (
    <div>
      <PageHeader title="Riwayat Transaksi" description="Daftar semua order laundry" />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari invoice, nama, atau HP..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Cabang" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang</SelectItem>
              {branches?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PROSES">Proses</SelectItem>
              <SelectItem value="SELESAI">Selesai</SelectItem>
              <SelectItem value="DIAMBIL">Diambil</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Pembayaran" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pembayaran</SelectItem>
              <SelectItem value="LUNAS">Lunas</SelectItem>
              <SelectItem value="BELUM_BAYAR">Belum Bayar</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Transaction list */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Card key={i}><CardContent className="h-20 animate-pulse bg-muted/40" /></Card>)}</div>
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="Belum ada transaksi" description="Transaksi yang dibuat akan muncul di sini" />
      ) : (
        <div className="space-y-2 stagger-children">
          {filtered.map((t) => (
            <Card key={t.id} className="card-hover cursor-pointer overflow-hidden">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0" onClick={() => setDetailTx(t)}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-semibold">{t.invoiceNo}</p>
                      <Badge className={`h-5 gap-1 text-[10px] ${STATUS_STYLES[t.status]}`}>
                        {t.status}
                      </Badge>
                      {t.paymentStatus === 'BELUM_BAYAR' && (
                        <Badge variant="destructive" className="h-5 text-[10px]">Belum Bayar</Badge>
                      )}
                      {(t.discountPercent ?? 0) > 0 && (
                        <Badge className="h-5 gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                          <Tag className="h-2.5 w-2.5" />
                          {t.discountPercent}%
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium">{t.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.branch?.name} · {formatDateTime(t.date)}
                    </p>
                    {t.status === 'PROSES' && t.items && (
                      <EstimatedDateBadge date={t.date} items={t.items} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 md:flex-col md:items-end">
                  <p className="text-lg font-bold tabular-nums">{formatRupiah(t.totalAmount)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.status === 'PROSES' && (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => handleQuickStatus(t.id, 'SELESAI')}>
                        <Check className="h-3 w-3" /> Selesai
                      </Button>
                    )}
                    {t.status === 'SELESAI' && (
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => handleQuickStatus(t.id, 'DIAMBIL')}>
                        <CheckCircle2 className="h-3 w-3" /> Diambil
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setDetailTx(t)}>
                      Detail
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 text-rose-600 hover:text-rose-700 p-0" onClick={() => setDeleteId(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <TransactionDetail tx={detailTx} onClose={() => setDetailTx(null)} />

      {/* Delete confirmation */}
      <DeleteTransactionDialog
        id={deleteId}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}

function DeleteTransactionDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const deleteTx = useDeleteTransaction()
  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteTx.mutateAsync(id)
      toast.success('Transaksi dihapus')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus')
    }
  }
  return (
    <AlertDialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
          <AlertDialogDescription>
            Transaksi dan semua item di dalamnya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700" disabled={deleteTx.isPending}>
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function TransactionDetail({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  const updateMutation = useUpdateTransaction()

  if (!tx) return null

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateMutation.mutateAsync({ id: tx.id, status })
      toast.success(`Status diubah ke ${STATUS_LABELS[status] || status}`)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengubah status')
    }
  }

  const handleMarkPaid = async () => {
    try {
      await updateMutation.mutateAsync({ id: tx.id, paymentStatus: 'LUNAS', paidAmount: tx.totalAmount })
      toast.success('Pembayaran ditandai lunas')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal')
    }
  }

  return (
    <Dialog open={!!tx} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Detail Transaksi
          </DialogTitle>
          <DialogDescription className="font-mono">{tx.invoiceNo}</DialogDescription>
        </DialogHeader>

        {/* Print receipt */}
        <div className="print-receipt rounded-lg border border-dashed p-4">
          <div className="text-center">
            <p className="font-bold text-sm tracking-widest">━━━ PUTRY LAUNDRY ━━━</p>
            <p className="text-[10px] text-muted-foreground">{tx.branch?.name}</p>
            {tx.branch?.address && <p className="text-[10px] text-muted-foreground">{tx.branch.address}</p>}
          </div>
          <Separator className="my-2" />
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between"><span className="text-muted-foreground">No</span><span className="font-medium">{tx.invoiceNo}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tgl</span><span>{formatDateTime(tx.date)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pelanggan</span><span className="font-medium">{tx.customerName}</span></div>
            {tx.customerPhone && <div className="flex justify-between"><span className="text-muted-foreground">HP</span><span>{tx.customerPhone}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-semibold text-emerald-600">✅ {tx.paymentStatus === 'LUNAS' ? 'LUNAS' : 'BELUM BAYAR'}</span></div>
          </div>
          <Separator className="my-2" />
          <p className="text-[10px] text-muted-foreground mb-1">─ Pesanan ─</p>
          <div className="space-y-1 text-[11px]">
            {tx.items?.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between">
                  <span className="truncate pr-2">{item.serviceName}{item.variant ? ` (${item.variant})` : ''}</span>
                  <span className="tabular-nums font-medium">{formatRupiah(item.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground pl-2">
                  <span>{item.quantity} {item.unit}</span>
                  <span></span>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-2" />
          {(tx.discountPercent ?? 0) > 0 ? (
            <>
              <div className="flex justify-between text-[11px]">
                <span>SUBTOTAL</span>
                <span className="tabular-nums">{formatRupiah(tx.subtotal ?? tx.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-700">
                <span>DISKON ({tx.discountPercent}%)</span>
                <span className="tabular-nums">- {formatRupiah(tx.discountAmount ?? 0)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-[12px]">
                <span>TOTAL</span>
                <span className="tabular-nums text-emerald-600">{formatRupiah(tx.totalAmount)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between font-bold text-[12px]">
              <span>TOTAL</span>
              <span className="tabular-nums text-emerald-600">{formatRupiah(tx.totalAmount)}</span>
            </div>
          )}
          {tx.paymentStatus === 'LUNAS' && (
            <>
              <Separator className="my-1" />
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Bayar</span><span className="tabular-nums">{formatRupiah(tx.paidAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Kembali</span><span className="tabular-nums font-medium">{formatRupiah(tx.changeAmount)}</span></div>
              </div>
            </>
          )}
          {tx.status === 'PROSES' && tx.items && (
            <>
              <Separator className="my-2" />
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Estimasi selesai</span>
                <span className="font-medium">{formatEstimatedDate(tx.date, tx.items).dateStr}</span>
              </div>
            </>
          )}
          <Separator className="my-2" />
          <p className="text-center text-[10px] text-muted-foreground">Terima kasih 🙏</p>
          <p className="text-center text-[9px] text-muted-foreground">Putry Laundry — {tx.branch?.name}</p>
        </div>

        {/* Customer info */}
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm no-print">
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="font-medium">{tx.customerName}</p>
            {tx.customerOrderIndex && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Order ke-{tx.customerOrderIndex}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">No. HP</p>
            <p className="font-medium">{tx.customerPhone || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cabang</p>
            <p className="font-medium">{tx.branch?.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tanggal Masuk</p>
            <p className="font-medium">{formatDateTime(tx.date)}</p>
          </div>
          {tx.status === 'PROSES' && tx.items && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Estimasi Selesai</p>
              <EstimatedDateBadge date={tx.date} items={tx.items} />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex flex-wrap gap-2 no-print">
          <Badge className={STATUS_STYLES[tx.status]}>{STATUS_LABELS[tx.status] || tx.status}</Badge>
          {tx.paymentStatus === 'LUNAS' ? (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Lunas</Badge>
          ) : (
            <Badge variant="destructive">Belum Bayar</Badge>
          )}
        </div>

        {/* Items */}
        <div className="no-print">
          <p className="mb-2 text-sm font-semibold">Item Layanan</p>
          <div className="space-y-1.5">
            {tx.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.serviceName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRupiah(item.price)}/{item.unit} × {item.quantity} {item.variant && `· ${item.variant}`}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">{formatRupiah(item.subtotal)}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="no-print" />

        {/* Total */}
        <div className="space-y-1.5 text-sm no-print">
          {(tx.discountPercent ?? 0) > 0 ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{formatRupiah(tx.subtotal ?? tx.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1.5">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <Tag className="h-3.5 w-3.5" />
                  Diskon Loyalty ({tx.discountPercent}%)
                </span>
                <span className="font-semibold tabular-nums text-emerald-600">- {formatRupiah(tx.discountAmount ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5">
                <span className="font-medium">Total</span>
                <span className="text-base font-bold tabular-nums text-primary">{formatRupiah(tx.totalAmount)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold tabular-nums">{formatRupiah(tx.totalAmount)}</span>
            </div>
          )}
          {tx.paymentStatus === 'LUNAS' && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibayar</span>
                <span className="font-semibold tabular-nums">{formatRupiah(tx.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kembalian</span>
                <span className="font-semibold tabular-nums">{formatRupiah(tx.changeAmount)}</span>
              </div>
            </>
          )}
        </div>

        {tx.notes && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-sm no-print">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Catatan</p>
            <p className="mt-0.5">{tx.notes}</p>
          </div>
        )}

        <DialogFooter className="gap-2 no-print">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Cetak Struk
          </Button>
          {tx.paymentStatus === 'BELUM_BAYAR' && (
            <Button className="gap-2" onClick={handleMarkPaid} disabled={updateMutation.isPending}>
              <Banknote className="h-4 w-4" /> Tandai Lunas
            </Button>
          )}
          {tx.status === 'PROSES' && (
            <Button onClick={() => handleStatusUpdate('SELESAI')} className="gap-2" disabled={updateMutation.isPending}>
              <Check className="h-4 w-4" /> Tandai Selesai
            </Button>
          )}
          {tx.status === 'SELESAI' && (
            <Button onClick={() => handleStatusUpdate('DIAMBIL')} className="gap-2" disabled={updateMutation.isPending}>
              <CheckCircle2 className="h-4 w-4" /> Tandai Diambil
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Estimated completion date badge component
function EstimatedDateBadge({ date, items }: { date: string; items: Array<{ variant?: string | null }> }) {
  const { dateStr, label, isOverdue, daysLeft } = formatEstimatedDate(date, items)
  const hasExpress = items.some((i) => i.variant === 'Express')

  const colorClass = isOverdue
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
    : daysLeft <= 1
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${colorClass}`}>
        {isOverdue ? (
          <AlertTriangle className="h-3 w-3" />
        ) : hasExpress ? (
          <Zap className="h-3 w-3" />
        ) : (
          <CalendarClock className="h-3 w-3" />
        )}
        Estimasi: {dateStr}
      </span>
      <span className={`text-[10px] ${isOverdue ? 'text-rose-600 font-semibold' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  )
}
