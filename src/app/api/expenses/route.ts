import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get('branchId')
    const date = searchParams.get('date') // YYYY-MM-DD

    const where: Record<string, unknown> = {}
    if (branchId) where.branchId = branchId
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`)
      const end = new Date(`${date}T23:59:59.999Z`)
      where.date = { gte: start, lte: end }
    }

    const expenses = await db.operationalExpense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { branch: true },
    })
    return NextResponse.json({ success: true, data: expenses })
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat pengeluaran' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { branchId, category, description, amount, date } = body

    if (!branchId || !category || !description || amount === undefined) {
      return NextResponse.json({ success: false, error: 'Cabang, kategori, deskripsi, dan jumlah wajib diisi' }, { status: 400 })
    }

    const expense = await db.operationalExpense.create({
      data: {
        branchId,
        category,
        description,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
      },
      include: { branch: true },
    })
    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat pengeluaran' }, { status: 500 })
  }
}
