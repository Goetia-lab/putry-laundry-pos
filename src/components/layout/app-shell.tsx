'use client'

import { useState } from 'react'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Menu, Droplets, Clock, LayoutDashboard, ShoppingCart, Receipt, ListOrdered } from 'lucide-react'
import { useJakartaNow } from '@/lib/api'
import { formatTime, formatDate, getLocalDateString } from '@/lib/format'
import { useNavStore, type ViewKey } from '@/lib/stores'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const now = useJakartaNow()
  const isPastClosing = now ? now.getHours() >= 20 : false
  const { currentView, setView } = useNavStore()

  const bottomNav: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'kasir', label: 'Kasir', icon: ShoppingCart },
    { key: 'transaksi', label: 'Transaksi', icon: Receipt },
    { key: 'pricelist', label: 'Price List', icon: ListOrdered },
  ]

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <SidebarNav />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Buka menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Mobile brand */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground">
              <Droplets className="h-4 w-4" />
            </div>
            <span className="font-bold">Putry Laundry</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Clock & closing status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold tabular-nums" suppressHydrationWarning>
                {now ? `${formatTime(now)} WIB` : '--:-- WIB'}
              </span>
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                {now ? formatDate(now) : '\u00A0'}
              </span>
            </div>
            {isPastClosing ? (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <Clock className="h-3.5 w-3.5" />
                Waktu Tutup Buku
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Buka
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>

        {/* Footer sticky bottom */}
        <footer className="mt-auto border-t bg-background px-4 py-4 lg:px-6">
          <div className="hidden sm:flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Droplets className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Putry Laundry POS</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline" suppressHydrationWarning>{getLocalDateString()}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Tutup kas harian pukul 20.00 WIB</span>
              <span className="hidden sm:inline">v1.0</span>
            </div>
          </div>
        </footer>

        {/* Mobile bottom nav */}
        <nav className="sticky bottom-0 z-30 flex border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden safe-area-bottom">
          {bottomNav.map((item) => {
            const Icon = item.icon
            const active = currentView === item.key
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-1.5 text-xs font-medium transition-colors min-h-[44px]',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
