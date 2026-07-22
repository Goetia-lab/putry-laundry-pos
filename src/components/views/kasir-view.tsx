'use client'

import { useState, useMemo } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useServices, useBranches, useCreateTransaction, useCreateCustomer, useCustomers } from '@/lib/api'
import { useCartStore } from '@/lib/stores'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Switch } from '@/components/ui/switch'
import { PageHeader, EmptyState } from '@/components/shared/ui-bits'
import { formatRupiah, SERVICE_CATEGORIES, formatEstimatedDate } from '@/lib/format'
import { toast } from 'sonner'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, X, CheckCircle2,
  Package, ShoppingCart as CartIcon, Printer, Banknote, Clock,
  UserCheck, UserPlus, ChevronsUpDown, Check, CalendarClock, Zap,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

export function KasirView() {
  const { data: services, isLoading } = useServices()
  const { data: branches } = useBranches()
  const { items, addItem, removeItem, updateQuantity, updatePrice, clearCart, total } = useCartStore()
  const createTx = useCreateTransaction()
  const createCustomer = useCreateCustomer()

  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)
  const [saveCustomer, setSaveCustomer] = useState(true)
  const [paidAmount, setPaidAmount] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<'LUNAS' | 'BELUM_BAYAR'>('LUNAS')
  const [notes, setNotes] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<{ invoiceNo: string; total: number; paid: number; change: number; customerName: string; items: Array<{ variant?: string | null }> } | null>(null)
  const isMobile = useIsMobile()
  const [mobileTab, setMobileTab] = useState<'services' | 'cart'>('services')

  const { data: customers } = useCustomers(customerSearch || undefined)

  const filteredServices = useMemo(() => {
    if (!services) return []
    return services.filter((s) => {
      const matchCat = activeCategory === 'all' || s.category === activeCategory
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        (s.variant?.toLowerCase().includes(search.toLowerCase()) ?? false)
      return matchCat && matchSearch
    })
  }, [services, activeCategory, search])

  // Group by category
  const groupedServices = useMemo(() => {
    const groups: Record<string, typeof filteredServices> = {}
    filteredServices.forEach((s) => {
      if (!groups[s.category]) groups[s.category] = []
      groups[s.category].push(s)
    })
    return groups
  }, [filteredServices])

  const totalAmount = total()
  const finalTotal = totalAmount
  const paid = paymentStatus === 'LUNAS' ? (Number(paidAmount) || finalTotal) : 0
  const change = Math.max(0, paid - finalTotal)

  const handleCheckout = async () => {
    if (!selectedBranch) {
      toast.error('Pilih cabang terlebih dahulu')
      return
    }
    if (!customerName.trim()) {
      toast.error('Nama customer wajib diisi')
      return
    }
    if (items.length === 0) {
      toast.error('Keranjang masih kosong')
      return
    }
    if (paymentStatus === 'LUNAS' && Number(paidAmount) < finalTotal) {
      toast.error('Jumlah bayar kurang dari total')
      return
    }

    try {
      // Auto-save new customer if not from DB and saveCustomer is enabled
      let finalCustomerId = selectedCustomerId
      if (!selectedCustomerId && saveCustomer && customerName.trim()) {
        try {
          const custRes = await createCustomer.mutateAsync({
            name: customerName.trim(),
            phone: customerPhone.trim() || null,
            branchId: selectedBranch || null,
          })
          finalCustomerId = (custRes as { data: { id: string } }).data.id
        } catch {
          // Customer creation failed (maybe duplicate) - continue without linking
          console.error('Auto-save customer failed, continuing without link')
        }
      }

      const res = await createTx.mutateAsync({
        branchId: selectedBranch,
        customerId: finalCustomerId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        paymentStatus,
        paidAmount: paymentStatus === 'LUNAS' ? paid : 0,
        discountPercent: 0,
        notes: notes.trim() || null,
        items: items.map((i) => ({
          serviceId: i.serviceId,
          serviceName: i.serviceName,
          category: i.category,
          variant: i.variant,
          price: i.price,
          unit: i.unit,
          quantity: i.quantity,
        })),
      })
      setLastInvoice({
        invoiceNo: (res as { data: { invoiceNo: string; totalAmount: number; paidAmount: number; changeAmount: number } }).data.invoiceNo,
        total: (res as { data: { invoiceNo: string; totalAmount: number; paidAmount: number; changeAmount: number } }).data.totalAmount,
        paid: (res as { data: { invoiceNo: string; totalAmount: number; paidAmount: number; changeAmount: number } }).data.paidAmount,
        change: (res as { data: { invoiceNo: string; totalAmount: number; paidAmount: number; changeAmount: number; customerName: string } }).data.changeAmount,
        customerName: (res as { data: { invoiceNo: string; totalAmount: number; paidAmount: number; changeAmount: number; customerName: string } }).data.customerName,
        items: items.map((i) => ({ variant: i.variant })),
      })
      clearCart()
      setCustomerName('')
      setCustomerPhone('')
      setSelectedCustomerId(null)
      setCustomerSearch('')
      setPaidAmount('')
      setNotes('')
      setCheckoutOpen(false)
      toast.success(`Transaksi ${(res as { data: { invoiceNo: string } }).data.invoiceNo} berhasil dibuat`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membuat transaksi')
    }
  }

  const quickAmounts = [finalTotal, 50000, 100000, 200000].filter((v, i, a) => a.indexOf(v) === i && v > 0)

  return (
    <div>
      <PageHeader
        title="Kasir"
        description="Buat transaksi penjualan laundry"
        action={
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Pilih Cabang" /></SelectTrigger>
            <SelectContent>
              {branches?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">{b.code}</span>
                    {b.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Mobile tabs */}
      {isMobile && (
        <div className="mb-4 flex gap-0 rounded-xl border bg-card p-1 sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <button
            onClick={() => setMobileTab('services')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              mobileTab === 'services' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pilih Layanan
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors relative ${
              mobileTab === 'cart' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Keranjang{items.length > 0 && <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-bold">{items.length}</span>}
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* Service catalog */}
        <div className={isMobile && mobileTab === 'cart' ? 'hidden' : 'space-y-4'}>
          {/* Search & filter */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari layanan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <TabsList className="inline-flex">
                <TabsTrigger value="all">Semua</TabsTrigger>
                {SERVICE_CATEGORIES.map((c) => (
                  <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </Tabs>

          {/* Services grouped */}
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <Card key={i}><CardContent className="h-24 animate-pulse bg-muted/40" /></Card>
              ))}
            </div>
          ) : Object.keys(groupedServices).length === 0 ? (
            <EmptyState icon={Package} title="Tidak ada layanan" description="Coba kata kunci atau kategori lain" />
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedServices).map(([cat, svcList]) => (
                <div key={cat}>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{cat}</h3>
                    <Badge variant="secondary" className="text-xs">{svcList.length}</Badge>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {svcList.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => addItem({
                          serviceId: s.id,
                          serviceName: s.name,
                          category: s.category,
                          variant: s.variant,
                          price: s.price,
                          unit: s.unit,
                          quantity: 1,
                        })}
                        className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{s.name}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {s.variant && (
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium">
                                {s.variant}
                              </Badge>
                            )}
                            {s.duration && (
                              <span className="text-[10px] text-muted-foreground">{s.duration}</span>
                            )}
                          </div>
                          <p className="mt-1 text-base font-bold text-primary">
                            {s.price === 0 ? 'Sesuai ukuran' : formatRupiah(s.price)}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">/{s.unit}</span>
                          </p>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Plus className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <Card className={`${isMobile && mobileTab === 'services' ? 'hidden' : ''} lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)] lg:flex lg:flex-col lg:block`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CartIcon className="h-5 w-5 text-primary" />
                Keranjang
                <Badge>{items.length}</Badge>
              </CardTitle>
              {items.length > 0 && (
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-rose-600 hover:text-rose-700" onClick={clearCart}>
                  <Trash2 className="h-3.5 w-3.5" /> Kosongkan
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-emerald-100 dark:to-emerald-950">
                  <ShoppingCart className="h-8 w-8 text-primary" strokeWidth={1.8} />
                </div>
                <p className="text-base font-semibold">Keranjang Kosong</p>
                <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
                  Pilih layanan dari katalog di samping untuk menambahkan ke keranjang
                </p>
              </div>
            ) : (
              <>
                <ScrollArea className="-mx-2 flex-1 px-2 custom-scroll">
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="rounded-lg border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{item.serviceName}</p>
                            <div className="flex items-center gap-1.5">
                              {item.variant && <Badge variant="outline" className="h-5 px-1 text-[10px]">{item.variant}</Badge>}
                              <span className="text-xs text-muted-foreground">{formatRupiah(item.price)}/{item.unit}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-rose-600" onClick={() => removeItem(item.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-md border">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, Math.max(0.1, item.quantity - (item.unit === 'KG' ? 0.5 : 1)))}>
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, Number(e.target.value) || 0)}
                              className="h-8 w-14 border-0 px-1 text-center text-sm tabular-nums focus-visible:ring-0"
                              step={item.unit === 'KG' ? 0.5 : 1}
                              min={0}
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + (item.unit === 'KG' ? 0.5 : 1))}>
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold tabular-nums">{formatRupiah(item.subtotal)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Total */}
                <div className="space-y-3 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm font-medium tabular-nums">{formatRupiah(totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-xl font-bold tabular-nums text-primary">{formatRupiah(finalTotal)}</span>
                  </div>
                  <Button className="w-full gap-2" size="lg" onClick={() => setCheckoutOpen(true)} disabled={!selectedBranch || items.length === 0}>
                    <Banknote className="h-4 w-4" />
                    Checkout
                  </Button>
                  {!selectedBranch && (
                    <p className="text-center text-xs text-amber-600">Pilih cabang terlebih dahulu</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Checkout Pembayaran
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Customer picker */}
            <div className="grid gap-2">
              <Label className="flex items-center justify-between">
                <span>Pelanggan *</span>
                {selectedCustomerId && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      setSelectedCustomerId(null)
                      setCustomerName('')
                      setCustomerPhone('')
                      setCustomerSearch('')
                    }}
                  >
                    Hapus pilihan
                  </button>
                )}
              </Label>
              <Popover open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerPickerOpen}
                    className="w-full justify-between"
                  >
                    {selectedCustomerId ? (
                      <span className="flex items-center gap-2 truncate">
                        <UserCheck className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{customerName || 'Pelanggan terpilih'}</span>
                      </span>
                    ) : customerName ? (
                      <span className="truncate">{customerName}</span>
                    ) : (
                      <span className="text-muted-foreground">Cari atau pilih pelanggan...</span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Ketik nama atau HP..."
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {customerSearch ? 'Pelanggan tidak ditemukan' : 'Ketik untuk mencari'}
                      </CommandEmpty>
                      <CommandGroup heading="Pelanggan tersimpan">
                        {customers?.slice(0, 20).map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.id}
                            onSelect={() => {
                              setSelectedCustomerId(c.id)
                              setCustomerName(c.name)
                              setCustomerPhone(c.phone || '')
                              setCustomerSearch('')
                              setCustomerPickerOpen(false)
                            }}
                            className="gap-2"
                          >
                            <Check className={`h-4 w-4 ${selectedCustomerId === c.id ? 'opacity-100' : 'opacity-0'}`} />
                            <div className="flex flex-1 items-center justify-between min-w-0">
                              <span className="truncate">{c.name}</span>
                              {c.phone && <span className="text-xs text-muted-foreground shrink-0">{c.phone}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {customerSearch && (
                        <CommandGroup>
                          <CommandItem
                            value="new"
                            onSelect={() => {
                              setSelectedCustomerId(null)
                              setCustomerName(customerSearch)
                              setCustomerPickerOpen(false)
                            }}
                            className="gap-2"
                          >
                            <UserPlus className="h-4 w-4 text-primary" />
                            <span>Gunakan nama: "<strong>{customerSearch}</strong>"</span>
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {/* Manual name input fallback */}
              {!selectedCustomerId && (
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Atau ketik nama pelanggan langsung"
                  className="mt-1"
                />
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">No. HP</Label>
              <Input id="phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08xxx" disabled={!!selectedCustomerId} />
            </div>
            {/* Auto-save customer toggle */}
            {!selectedCustomerId && customerName.trim() && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="min-w-0">
                  <Label htmlFor="savecust" className="text-sm font-medium flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5 text-primary" />
                    Simpan ke database pelanggan
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">Pelanggan baru akan tersimpan untuk transaksi berikutnya</p>
                </div>
                <Switch id="savecust" checked={saveCustomer} onCheckedChange={setSaveCustomer} />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Status Pembayaran</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentStatus === 'LUNAS' ? 'default' : 'outline'}
                  onClick={() => setPaymentStatus('LUNAS')}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" /> Lunas
                </Button>
                <Button
                  variant={paymentStatus === 'BELUM_BAYAR' ? 'default' : 'outline'}
                  onClick={() => setPaymentStatus('BELUM_BAYAR')}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" /> Belum Bayar
                </Button>
              </div>
            </div>
            {paymentStatus === 'LUNAS' && (
              <div className="grid gap-2">
                <Label htmlFor="paid">Jumlah Bayar</Label>
                <Input
                  id="paid"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={String(finalTotal)}
                  className="text-lg font-semibold tabular-nums"
                />
                <div className="flex flex-wrap gap-1.5">
                  {quickAmounts.map((amt) => (
                    <Button key={amt} variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPaidAmount(String(amt))}>
                      {formatRupiah(amt)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="notes">Catatan</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan tambahan (opsional)" />
            </div>

            <Separator />

            <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatRupiah(totalAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total Bayar</span>
                <span className="text-lg font-bold tabular-nums text-primary">{formatRupiah(finalTotal)}</span>
              </div>
              {paymentStatus === 'LUNAS' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dibayar</span>
                    <span className="font-semibold tabular-nums">{formatRupiah(paid)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Kembalian</span>
                    <span className="font-bold tabular-nums text-primary">{formatRupiah(change)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Batal</Button>
            <Button onClick={handleCheckout} disabled={createTx.isPending} className="gap-2">
              {createTx.isPending ? 'Memproses...' : 'Konfirmasi & Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!lastInvoice} onOpenChange={(o) => !o && setLastInvoice(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <DialogTitle>Transaksi Berhasil</DialogTitle>
              <DialogDescription className="sr-only">Struk transaksi berhasil dibuat</DialogDescription>
            </div>
          </DialogHeader>
          {lastInvoice && (
            <div className="space-y-3">
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-xs text-muted-foreground">No. Invoice</p>
                <p className="font-mono text-lg font-bold">{lastInvoice.invoiceNo}</p>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{lastInvoice.customerName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium tabular-nums">{formatRupiah(lastInvoice.total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dibayar</span><span className="font-medium tabular-nums">{formatRupiah(lastInvoice.paid)}</span></div>
                <Separator />
                <div className="flex justify-between text-base"><span className="font-semibold">Kembalian</span><span className="font-bold tabular-nums text-primary">{formatRupiah(lastInvoice.change)}</span></div>
              </div>
              {/* Estimated completion */}
              {(() => {
                const est = formatEstimatedDate(new Date().toISOString(), lastInvoice.items)
                const hasExpress = lastInvoice.items.some((i) => i.variant === 'Express')
                return (
                  <div className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${hasExpress ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-sky-50 dark:bg-sky-950/30'}`}>
                    {hasExpress ? <Zap className="h-4 w-4 shrink-0 text-amber-600" /> : <CalendarClock className="h-4 w-4 shrink-0 text-sky-600" />}
                    <div>
                      <p className={`font-semibold ${hasExpress ? 'text-amber-700 dark:text-amber-400' : 'text-sky-700 dark:text-sky-400'}`}>
                        Estimasi Selesai: {est.dateStr}
                      </p>
                      <p className="text-muted-foreground">
                        {hasExpress ? 'Layanan Express (24 jam)' : 'Layanan Reguler (2-3 hari)'} · {est.label}
                      </p>
                    </div>
                  </div>
                )
              })()}
              <Button variant="outline" className="w-full gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Cetak Struk
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
