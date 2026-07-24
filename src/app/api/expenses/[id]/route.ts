import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.operationalExpense.findUnique({ where: { id }, include: { branch: true } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Pengeluaran tidak ditemukan' }, { status: 404 })
    }
    // Check if there's a daily closing for this branch+date
    const start = new Date(existing.date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(existing.date)
    end.setHours(23, 59, 59, 999)
    const closing = await db.dailyClosing.findFirst({
      where: {
        branchId: existing.branchId,
        closingDate: { gte: start, lte: end },
      },
    })
    if (closing) {
      return NextResponse.json({ success: false, error: 'Tidak bisa menghapus pengeluaran setelah tutup buku. Batalkan tutup buku terlebih dahulu.' }, { status: 400 })
    }
    await db.operationalExpense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus pengeluaran' }, { status: 500 })
  }
}
