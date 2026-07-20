'use client'

import { AppShell } from '@/components/layout/app-shell'
import { useNavStore } from '@/lib/stores'
import { DashboardView } from '@/components/views/dashboard-view'
import { KasirView } from '@/components/views/kasir-view'
import { PricelistView } from '@/components/views/pricelist-view'
import { CabangView } from '@/components/views/cabang-view'
import { TutupBukuView } from '@/components/views/tutup-buku-view'
import { RekapView } from '@/components/views/rekap-view'
import { LaporanView } from '@/components/views/laporan-view'
import { TransaksiView } from '@/components/views/transaksi-view'
import { PelangganView } from '@/components/views/pelanggan-view'
import { Suspense } from 'react'

export default function Home() {
  const { currentView } = useNavStore()

  return (
    <AppShell>
      <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">Memuat...</div>}>
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'kasir' && <KasirView />}
        {currentView === 'transaksi' && <TransaksiView />}
        {currentView === 'pricelist' && <PricelistView />}
        {currentView === 'pelanggan' && <PelangganView />}
        {currentView === 'cabang' && <CabangView />}
        {currentView === 'tutup-buku' && <TutupBukuView />}
        {currentView === 'rekap' && <RekapView />}
        {currentView === 'laporan' && <LaporanView />}
      </Suspense>
    </AppShell>
  )
}
