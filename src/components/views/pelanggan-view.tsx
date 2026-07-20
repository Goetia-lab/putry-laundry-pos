'use client'

import { useState } from 'react'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, useBranches, type Customer } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader, EmptyState, StatCard } from '@/components/shared/ui-bits'
import { formatRupiah, formatDate, getLoyaltyTier, getProgressToNextTier, LOYALTY_TIERS } from '@/lib/format'
import { toast } from 'sonner'
import {
  Users, Plus, Search, Pencil, Trash2, Phone, MapPin, User,
  ShoppingBag, TrendingUp, Mail, Crown, Award, Star, Gem,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function PelangganView() {
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('all')
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: customers, isLoading } = useCustomers(search || undefined, branchId !== 'all' ? branchId : undefined)
  const { data: branches } = useBranches()
  const deleteCustomer = useDeleteCustomer()

  const totalCustomers = customers?.length ?? 0
  const totalSpent = customers?.reduce((s, c) => s + (c.totalSpent ?? 0), 0) ?? 0
  const totalTransactions = customers?.reduce((s, c) => s + (c.transactionCount ?? 0), 0) ?? 0
  const avgSpent = totalCustomers > 0 ? Math.round(totalSpent / totalCustomers) : 0

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCustomer.mutateAsync(deleteId)
      toast.success('Customer dihapus')
      setDeleteId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus')
    }
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div>
      <PageHeader
        title="Pelanggan"
        description="Database customer & riwayat transaksi"
        action={
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Tambah Pelanggan
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Pelanggan" value={String(totalCustomers)} icon={Users} variant="primary" loading={isLoading} />
        <StatCard title="Total Transaksi" value={String(totalTransactions)} subtitle="Semua customer" icon={ShoppingBag} loading={isLoading} />
        <StatCard title="Total Belanja" value={formatRupiah(totalSpent)} icon={TrendingUp} variant="success" loading={isLoading} />
        <StatCard title="Rata-rata / Customer" value={formatRupiah(avgSpent)} icon={User} variant="warning" loading={isLoading} />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari nama atau HP..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang</SelectItem>
              {branches?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Loyalty tiers legend */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-50/50 dark:to-emerald-950/10">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Program Loyalitas Pelanggan</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LOYALTY_TIERS.map((t) => {
              const count = customers?.filter((c) => getLoyaltyTier(c.totalSpent ?? 0).name === t.name).length ?? 0
              return (
                <div key={t.name} className={`rounded-lg border ${t.borderColor} ${t.bgColor} p-3 text-center`}>
                  <div className="text-2xl">{t.icon}</div>
                  <p className={`mt-1 text-sm font-bold ${t.color}`}>{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatRupiah(t.minSpent)}+</p>
                  <p className="mt-1 text-xs font-semibold tabular-nums">{count} pelanggan</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Customer grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Card key={i}><CardContent className="h-40 animate-pulse bg-muted/40" /></Card>)}</div>
      ) : !customers || customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada pelanggan"
          description="Tambahkan pelanggan atau buat transaksi dengan nama customer untuk mengisi database."
          action={<Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Tambah Pelanggan</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c, idx) => {
            const tier = getLoyaltyTier(c.totalSpent ?? 0)
            const { next, progress } = getProgressToNextTier(c.totalSpent ?? 0)
            return (
              <Card key={c.id} className={`card-hover group animate-scale-in overflow-hidden border-l-4 ${tier.borderColor}`} style={{ animationDelay: `${idx * 30}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-emerald-100 text-primary font-bold">
                            {getInitials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card text-sm shadow-sm" title={`${tier.name} - ${tier.description}`}>
                          {tier.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{c.name}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {c.branch && (
                            <Badge variant="outline" className="h-5 text-[10px]">{c.branch.code}</Badge>
                          )}
                          <Badge className={`h-5 gap-1 text-[10px] ${tier.bgColor} ${tier.color} hover:opacity-80`} title={tier.description}>
                            <Crown className="h-2.5 w-2.5" />
                            {tier.name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditCustomer(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:text-rose-700" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm">
                    {c.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{c.phone}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                    {!c.phone && !c.address && (
                      <div className="flex items-center gap-2 text-muted-foreground/60">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs italic">Belum ada kontak</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Transaksi</p>
                      <p className="text-sm font-bold tabular-nums">{c.transactionCount ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Total Belanja</p>
                      <p className="text-sm font-bold tabular-nums text-primary">{formatRupiah(c.totalSpent ?? 0)}</p>
                    </div>
                  </div>

                  {/* Loyalty progress bar */}
                  {next ? (
                    <div className="mt-3 border-t pt-3">
                      <div className="mb-1 flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">{tier.icon} {tier.name}</span>
                        <span className="font-medium text-muted-foreground">{next.icon} {next.name}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {progress}% menuju {next.name} · {formatRupiah(next.minSpent - (c.totalSpent ?? 0))} lagi
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-1.5 rounded-md bg-violet-100 px-2 py-1.5 text-[11px] font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-t">
                      <Gem className="h-3.5 w-3.5" />
                      Tier tertinggi tercapai! 🎉
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CustomerDialog customer={editCustomer} open={!!editCustomer || addOpen} onClose={() => { setEditCustomer(null); setAddOpen(false) }} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelanggan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak bisa dibatalkan. Data customer akan dihapus permanen. Transaksi terkait tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CustomerDialog({ customer, open, onClose }: { customer: Customer | null; open: boolean; onClose: () => void }) {
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const { data: branches } = useBranches()
  const isEdit = !!customer

  const [name, setName] = useState(customer?.name || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [address, setAddress] = useState(customer?.address || '')
  const [branchId, setBranchId] = useState(customer?.branchId || 'none')

  // Reset when customer changes - use key prop on dialog content instead would be cleaner but this works
  useState(() => {
    if (customer) {
      setName(customer.name); setPhone(customer.phone || ''); setAddress(customer.address || '')
      setBranchId(customer.branchId || 'none')
    }
  })

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nama wajib diisi')
      return
    }
    try {
      const data = {
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        branchId: branchId === 'none' ? null : branchId,
      }
      if (isEdit && customer) {
        await updateCustomer.mutateAsync({ id: customer.id, ...data })
        toast.success('Pelanggan diperbarui')
      } else {
        await createCustomer.mutateAsync(data)
        toast.success('Pelanggan ditambahkan')
      }
      onClose()
      setName(''); setPhone(''); setAddress(''); setBranchId('none')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
          </DialogTitle>
          <DialogDescription>{isEdit ? 'Perbarui informasi pelanggan' : 'Tambahkan pelanggan baru ke database'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="cname">Nama *</Label>
            <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cphone">No. HP</Label>
            <Input id="cphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxx" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="caddr">Alamat</Label>
            <Input id="caddr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat (opsional)" />
          </div>
          <div className="grid gap-1.5">
            <Label>Cabang (opsional)</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa cabang</SelectItem>
                {branches?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={createCustomer.isPending || updateCustomer.isPending}>
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
