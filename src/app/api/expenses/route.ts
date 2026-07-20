import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '')
}

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
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Format JSON tidak valid' }, { status: 400 })
    }
    const { branchId, category, description, amount, date } = body

    if (!branchId || !category || !description || !description.trim() || amount == null || isNaN(Number(amount))) {
      return NextResponse.json({ success: false, error: 'Cabang, kategori, deskripsi, dan jumlah valid wajib diisi' }, { status: 400 })
    }

    const numAmount = Number(amount)
    if (numAmount < 0) {
      return NextResponse.json({ success: false, error: 'Jumlah pengeluaran tidak boleh negatif' }, { status: 400 })
    }

    // Validate branchId exists
    const branch = await db.branch.findUnique({ where: { id: branchId } })
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Cabang tidak ditemukan' }, { status: 404 })
    }

    const dateObj = date ? new Date(date) : new Date()
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ success: false, error: 'Format tanggal tidak valid' }, { status: 400 })
    }

    const expense = await db.operationalExpense.create({
      data: {
        branchId,
        category: stripHtml(category),
        description: stripHtml(description),
        amount: numAmount,
        date: dateObj,
      },
      include: { branch: true },
    })
    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat pengeluaran' }, { status: 500 })
  }
}
