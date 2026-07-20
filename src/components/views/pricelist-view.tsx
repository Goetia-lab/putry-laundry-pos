'use client'

import { useState } from 'react'
import { useServices, useCreateService, useUpdateService, type Service } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, EmptyState } from '@/components/shared/ui-bits'
import { formatRupiah, SERVICE_CATEGORIES } from '@/lib/format'
import { toast } from 'sonner'
import {
  ListOrdered, Plus, Pencil, Search, Package, Clock, DollarSign,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'

const UNITS = ['KG', 'PCS', 'PSG', 'M2']

export function PricelistView() {
  const { data: services, isLoading } = useServices('all')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [editService, setEditService] = useState<Service | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const filtered = services?.filter((s) => {
    const matchCat = activeCategory === 'all' || s.category === activeCategory
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.variant?.toLowerCase().includes(search.toLowerCase()) ?? false)
    return matchCat && matchSearch
  })

  const grouped = filtered?.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div>
      <PageHeader
        title="Daftar Harga Layanan"
        description="Kelola pricelist jasa laundry"
        action={
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Tambah Layanan
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari layanan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Tabs>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Card key={i}><CardContent className="h-32 animate-pulse bg-muted/40" /></Card>)}</div>
      ) : !grouped || Object.keys(grouped).length === 0 ? (
        <EmptyState icon={Package} title="Tidak ada layanan" description="Tambahkan layanan baru untuk dimulai" />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, list]) => (
            <Card key={cat}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ListOrdered className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{cat}</CardTitle>
                      <CardDescription className="text-xs">{list.length} layanan</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => (
                    <div
                      key={s.id}
                      className={`group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md ${!s.isActive ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-semibold leading-tight">{s.name}</p>
                            {s.variant && (
                              <Badge
                                variant={s.variant === 'Express' ? 'default' : 'secondary'}
                                className={`h-5 shrink-0 px-2 text-[10px] font-medium ${s.variant === 'Express' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'}`}
                              >
                                {s.variant}
                              </Badge>
                            )}
                          </div>
                          {s.duration && (
                            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" /> {s.duration}
                            </p>
                          )}
                          <div className="mt-2 flex items-baseline gap-1">
                            <p className="text-xl font-bold text-primary tabular-nums">
                              {s.price === 0 ? 'Sesuai ukuran' : formatRupiah(s.price)}
                            </p>
                            {s.price > 0 && (
                              <span className="text-xs font-normal text-muted-foreground">/{s.unit}</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => setEditService(s)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {!s.isActive && (
                        <Badge variant="secondary" className="mt-2 bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 text-[10px]">
                          Nonaktif
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceDialog service={editService} open={!!editService || addOpen} onClose={() => { setEditService(null); setAddOpen(false) }} />
    </div>
  )
}

function ServiceDialog({ service, open, onClose }: { service: Service | null; open: boolean; onClose: () => void }) {
  const createService = useCreateService()
  const updateService = useUpdateService()
  const isEdit = !!service

  const [category, setCategory] = useState(service?.category || 'Jasa')
  const [name, setName] = useState(service?.name || '')
  const [variant, setVariant] = useState(service?.variant || '')
  const [price, setPrice] = useState(service?.price?.toString() || '')
  const [unit, setUnit] = useState(service?.unit || 'KG')
  const [duration, setDuration] = useState(service?.duration || '')
  const [isActive, setIsActive] = useState(service?.isActive ?? true)

  // Reset when service changes
  useState(() => {
    if (service) {
      setCategory(service.category)
      setName(service.name)
      setVariant(service.variant || '')
      setPrice(service.price.toString())
      setUnit(service.unit)
      setDuration(service.duration || '')
      setIsActive(service.isActive)
    }
  })

  const handleSubmit = async () => {
    if (!name.trim() || !category || !unit) {
      toast.error('Nama, kategori, dan satuan wajib diisi')
      return
    }
    try {
      const data = {
        category,
        name: name.trim(),
        variant: variant.trim() || null,
        price: Number(price) || 0,
        unit,
        duration: duration.trim() || null,
        isActive,
      }
      if (isEdit && service) {
        await updateService.mutateAsync({ id: service.id, ...data })
        toast.success('Layanan diperbarui')
      } else {
        await createService.mutateAsync(data)
        toast.success('Layanan ditambahkan')
      }
      onClose()
      // reset
      setName(''); setVariant(''); setPrice(''); setDuration(''); setCategory('Jasa'); setUnit('KG'); setIsActive(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Layanan' : 'Tambah Layanan'}
          </DialogTitle>
          <DialogDescription>{isEdit ? 'Perbarui informasi layanan' : 'Tambahkan layanan baru ke pricelist'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Satuan</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sname">Nama Layanan</Label>
            <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Cuci Setrika" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="svar">Varian (opsional)</Label>
              <Input id="svar" value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="Reguler / Express" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sdur">Durasi (opsional)</Label>
              <Input id="sdur" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="2-3 Hari" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sprice">Harga (Rp)</Label>
            <Input id="sprice" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="text-lg font-semibold tabular-nums" />
            <p className="text-xs text-muted-foreground">Isi 0 jika harga menyesuaikan ukuran</p>
          </div>
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Status Aktif</Label>
                <p className="text-xs text-muted-foreground">Layanan nonaktif tidak muncul di kasir</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={createService.isPending || updateService.isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
