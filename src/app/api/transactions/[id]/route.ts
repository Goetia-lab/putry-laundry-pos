import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: { branch: true, items: true },
    })
    if (!transaction) {
      return NextResponse.json({ success: false, error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('GET /api/transactions/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat transaksi' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, paymentStatus, paidAmount, notes } = body

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus
    if (notes !== undefined) updateData.notes = notes
    if (paidAmount !== undefined) {
      const tx = await db.transaction.findUnique({ where: { id } })
      if (tx) {
        updateData.paidAmount = Number(paidAmount)
        updateData.changeAmount = Math.max(0, Number(paidAmount) - tx.totalAmount)
        if (Number(paidAmount) >= tx.totalAmount) {
          updateData.paymentStatus = 'LUNAS'
        }
      }
    }

    const transaction = await db.transaction.update({ where: { id }, data: updateData, include: { items: true, branch: true } })
    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('PATCH /api/transactions/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memperbarui transaksi' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Get transaction to check if its date is already closed
    const tx = await db.transaction.findUnique({ where: { id }, select: { branchId: true, date: true } })
    if (!tx) {
      return NextResponse.json({ success: false, error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }
    // Check if there's a daily closing for this branch+date
    const start = new Date(tx.date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(tx.date)
    end.setHours(23, 59, 59, 999)
    const closing = await db.dailyClosing.findFirst({
      where: {
        branchId: tx.branchId,
        closingDate: { gte: start, lte: end },
      },
    })
    if (closing) {
      return NextResponse.json({ success: false, error: 'Tidak bisa menghapus transaksi setelah tutup buku. Batalkan tutup buku terlebih dahulu.' }, { status: 400 })
    }
    // Items will be cascade deleted
    await db.transaction.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/transactions/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus transaksi' }, { status: 500 })
  }
}
