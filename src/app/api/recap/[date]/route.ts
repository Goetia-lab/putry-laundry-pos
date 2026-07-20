import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dateFromString } from '@/lib/format'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params
    const recapDate = dateFromString(date)

    const recap = await db.mainRecap.findUnique({
      where: { recapDate },
      include: { entries: { include: { branch: true } } },
    })

    if (!recap) {
      return NextResponse.json({ success: false, error: 'Rekap tidak ditemukan untuk tanggal ini' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: recap })
  } catch (error) {
    console.error('GET /api/recap/[date] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat rekap' }, { status: 500 })
  }
}
