import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.operationalExpense.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Pengeluaran tidak ditemukan' }, { status: 404 })
    }
    await db.operationalExpense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus pengeluaran' }, { status: 500 })
  }
}
