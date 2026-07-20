'use client'

import dynamic from 'next/dynamic'
import { AppShell } from '@/components/layout/app-shell'
import { useNavStore } from '@/lib/stores'
import { Suspense } from 'react'

const DashboardView = dynamic(() => import('@/components/views/dashboard-view').then(m => ({ default: m.DashboardView })))
const KasirView = dynamic(() => import('@/components/views/kasir-view').then(m => ({ default: m.KasirView })))
const PricelistView = dynamic(() => import('@/components/views/pricelist-view').then(m => ({ default: m.PricelistView })))
const CabangView = dynamic(() => import('@/components/views/cabang-view').then(m => ({ default: m.CabangView })))
const TutupBukuView = dynamic(() => import('@/components/views/tutup-buku-view').then(m => ({ default: m.TutupBukuView })))
const RekapView = dynamic(() => import('@/components/views/rekap-view').then(m => ({ default: m.RekapView })))
const LaporanView = dynamic(() => import('@/components/views/laporan-view').then(m => ({ default: m.LaporanView })))
const TransaksiView = dynamic(() => import('@/components/views/transaksi-view').then(m => ({ default: m.TransaksiView })))
const PelangganView = dynamic(() => import('@/components/views/pelanggan-view').then(m => ({ default: m.PelangganView })))

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
