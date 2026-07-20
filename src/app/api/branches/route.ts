import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const branches = await db.branch.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    })
    return NextResponse.json({ success: true, data: branches })
  } catch (error) {
    console.error('GET /api/branches error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat data cabang' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Format JSON tidak valid' }, { status: 400 })
    }
    const { name, code, address, phone, operationalFundAmount } = body

    if (!name || !code) {
      return NextResponse.json({ success: false, error: 'Nama dan kode cabang wajib diisi' }, { status: 400 })
    }

    const existing = await db.branch.findUnique({ where: { code: String(code).toUpperCase() } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Kode cabang sudah digunakan' }, { status: 400 })
    }

    const branch = await db.branch.create({
      data: {
        name,
        code: String(code).toUpperCase(),
        address: address || null,
        phone: phone || null,
        operationalFundAmount: Number(operationalFundAmount) || 50000,
      },
    })
    return NextResponse.json({ success: true, data: branch })
  } catch (error) {
    console.error('POST /api/branches error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat cabang' }, { status: 500 })
  }
}
