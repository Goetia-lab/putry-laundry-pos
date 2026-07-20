'use client'

import { useState } from 'react'
import { useBranches, useUpdateBranch, useCreateBranch, type Branch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { PageHeader, StatCard, EmptyState } from '@/components/shared/ui-bits'
import { formatRupiah } from '@/lib/format'
import { toast } from 'sonner'
import {
  Building2, Pencil, Plus, MapPin, Phone, Wallet, Droplets, Package, Receipt,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'

export function CabangView() {
  const { data: branches, isLoading } = useBranches()
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const totalFund = branches?.reduce((s, b) => s + b.operationalFundAmount, 0) ?? 0
  const activeCount = branches?.filter((b) => b.isActive).length ?? 0

  return (
    <div>
      <PageHeader
        title="Manajemen Cabang"
        description="Kelola lokasi usaha & dana operasional"
        action={
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Tambah Cabang
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Cabang" value={String(branches?.length ?? 0)} subtitle={`${activeCount} aktif`} icon={Building2} variant="primary" loading={isLoading} />
        <StatCard title="Total Dana Operasional/Hari" value={formatRupiah(totalFund)} subtitle="Disisihkan tiap tutup buku" icon={Droplets} variant="warning" loading={isLoading} />
        <StatCard title="Total Transaksi" value={String(branches?.reduce((s, b) => s + (b._count?.transactions ?? 0), 0) ?? 0)} subtitle="Sepanjang waktu" icon={Receipt} loading={isLoading} />
      </div>

      {/* Branch cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{[...Array(2)].map((_, i) => <Card key={i}><CardContent className="h-64 animate-pulse bg-muted/40" /></Card>)}</div>
      ) : !branches || branches.length === 0 ? (
        <EmptyState icon={Building2} title="Belum ada cabang" description="Tambahkan cabang pertama Anda" action={<Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Tambah Cabang</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {branches.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-xl font-bold text-primary-foreground shadow-md shadow-primary/20">
                      {b.code}
                    </div>
                    <div>
                      <CardTitle className="text-base">{b.name}</CardTitle>
                      <CardDescription className="text-xs">Kode: {b.code}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.isActive ? (
                      <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditBranch(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {b.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{b.address}</span>
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{b.phone}</span>
                  </div>
                )}

                <Separator />

                {/* Operational fund highlight */}
                <div className="rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 p-3 dark:from-amber-950/30 dark:to-orange-950/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dana Operasional Harian</p>
                        <p className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-300">{formatRupiah(b.operationalFundAmount)}</p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Disisihkan otomatis saat tutup buku untuk operasional keesokan harinya.
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Receipt className="h-4 w-4" /> Total transaksi
                  </span>
                  <span className="font-semibold">{b._count?.transactions ?? 0} order</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BranchDialog branch={editBranch} open={!!editBranch || addOpen} onClose={() => { setEditBranch(null); setAddOpen(false) }} />
    </div>
  )
}

function BranchDialog({ branch, open, onClose }: { branch: Branch | null; open: boolean; onClose: () => void }) {
  const updateBranch = useUpdateBranch()
  const createBranch = useCreateBranch()
  const isEdit = !!branch

  const [name, setName] = useState(branch?.name || '')
  const [code, setCode] = useState(branch?.code || '')
  const [address, setAddress] = useState(branch?.address || '')
  const [phone, setPhone] = useState(branch?.phone || '')
  const [operationalFundAmount, setOperationalFundAmount] = useState(branch?.operationalFundAmount?.toString() || '50000')
  const [isActive, setIsActive] = useState(branch?.isActive ?? true)

  useState(() => {
    if (branch) {
      setName(branch.name); setCode(branch.code); setAddress(branch.address || '')
      setPhone(branch.phone || ''); setOperationalFundAmount(branch.operationalFundAmount.toString())
      setIsActive(branch.isActive)
    }
  })

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error('Nama dan kode cabang wajib diisi')
      return
    }
    try {
      const data = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        operationalFundAmount: Number(operationalFundAmount) || 0,
        isActive,
      }
      if (isEdit && branch) {
        await updateBranch.mutateAsync({ id: branch.id, ...data })
        toast.success('Cabang diperbarui')
      } else {
        await createBranch.mutateAsync(data)
        toast.success('Cabang ditambahkan')
      }
      onClose()
      setName(''); setCode(''); setAddress(''); setPhone(''); setOperationalFundAmount('50000'); setIsActive(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Cabang' : 'Tambah Cabang'}
          </DialogTitle>
          <DialogDescription>{isEdit ? 'Perbarui informasi cabang' : 'Tambahkan lokasi usaha baru'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="bcode">Kode</Label>
              <Input id="bcode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="A" maxLength={3} className="uppercase" />
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label htmlFor="bname">Nama Cabang</Label>
              <Input id="bname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cabang Pusat" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="baddr">Alamat</Label>
            <Input id="baddr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Contoh No. 123" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bphone">No. Telepon</Label>
            <Input id="bphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxx" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bfund">Dana Operasional Harian (Rp)</Label>
            <Input id="bfund" type="number" value={operationalFundAmount} onChange={(e) => setOperationalFundAmount(e.target.value)} className="text-lg font-semibold tabular-nums" />
            <p className="text-xs text-muted-foreground">Jumlah yang disisihkan tiap tutup buku untuk operasional besok</p>
          </div>
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Status Aktif</Label>
                <p className="text-xs text-muted-foreground">Cabang nonaktif tidak muncul di pilihan</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={updateBranch.isPending || createBranch.isPending}>
            {isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
