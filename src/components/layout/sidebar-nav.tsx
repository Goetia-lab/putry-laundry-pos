'use client'

import { useNavStore, type ViewKey } from '@/lib/stores'
import { useBranches } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  ShoppingCart,
  ListOrdered,
  Building2,
  Lock,
  BookOpen,
  BarChart3,
  Receipt,
  Droplets,
  Moon,
  Sun,
  Users,
} from 'lucide-react'
import { useTheme } from 'next-themes'

const navItems: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard; desc: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Ringkasan harian' },
  { key: 'kasir', label: 'Kasir', icon: ShoppingCart, desc: 'Buat transaksi' },
  { key: 'transaksi', label: 'Transaksi', icon: Receipt, desc: 'Riwayat order' },
  { key: 'pricelist', label: 'Price List', icon: ListOrdered, desc: 'Daftar layanan' },
  { key: 'pelanggan', label: 'Pelanggan', icon: Users, desc: 'Database customer' },
  { key: 'cabang', label: 'Cabang', icon: Building2, desc: 'Kelola cabang' },
  { key: 'tutup-buku', label: 'Tutup Buku', icon: Lock, desc: 'Closing harian' },
  { key: 'rekap', label: 'Rekap Utama', icon: BookOpen, desc: 'Rekap kasir utama' },
  { key: 'laporan', label: 'Laporan', icon: BarChart3, desc: 'Analisis penjualan' },
]

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { currentView, setView } = useNavStore()
  const { data: branches } = useBranches()
  const qc = useQueryClient()

  const prefetch = (key: ViewKey) => {
    const map: Record<string, [string, string?]> = {
      dashboard: ['dashboard'],
      kasir: ['services'],
      transaksi: ['transactions'],
      pricelist: ['services'],
      pelanggan: ['customers'],
      cabang: ['branches'],
      tutupbuku: ['daily-closings'],
      rekap: ['main-recaps'],
      laporan: ['report'],
    }
    const [qk] = map[key]
    if (qk) qc.prefetchQuery({ queryKey: [qk] })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-md shadow-primary/20">
          <Droplets className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight text-sidebar-foreground leading-tight">
            Putry Laundry
          </h1>
          <p className="text-xs text-muted-foreground truncate">Laundry POS System</p>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4 custom-scroll">
        <div className="space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu Utama
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = currentView === item.key
            return (
              <button
                key={item.key}
                onClick={() => {
                  setView(item.key)
                  onNavigate?.()
                }}
                onMouseEnter={() => prefetch(item.key)}
                onFocus={() => prefetch(item.key)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className={cn('shrink-0', active ? 'text-sidebar-primary-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground')} style={{ width: '1.125rem', height: '1.125rem' }} />
                <div className="flex flex-col items-start min-w-0">
                  <span className="truncate">{item.label}</span>
                  <span className={cn('text-[10px] truncate', active ? 'text-sidebar-primary-foreground/70' : 'text-muted-foreground/70')}>
                    {item.desc}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <Separator className="my-4" />

        {/* Branches quick view */}
        <div className="space-y-1">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cabang Aktif
          </p>
          {branches?.map((b) => (
            <div key={b.id} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary font-bold">
                {b.code}
              </span>
              <span className="truncate text-sidebar-foreground">{b.name}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <ThemeToggle />
    </div>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="border-t border-sidebar-border p-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-full justify-start gap-2 text-muted-foreground"
      >
        <Sun className="h-4 w-4" />
        <Moon className="h-4 w-4" />
        <span>Ganti Tema</span>
      </Button>
    </div>
  )
}
