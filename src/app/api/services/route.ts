import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') !== 'false'

    const services = await db.service.findMany({
      where: {
        ...(category && category !== 'all' && { category }),
        ...(activeOnly && { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json({ success: true, data: services })
  } catch (error) {
    console.error('GET /api/services error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat layanan' }, { status: 500 })
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
    const { category, name, variant, price, unit, duration, sortOrder } = body

    if (!category || !name || !unit) {
      return NextResponse.json({ success: false, error: 'Kategori, nama, dan satuan wajib diisi' }, { status: 400 })
    }

    const lastService = await db.service.findFirst({ orderBy: { sortOrder: 'desc' } })
    const maxOrder = lastService?.sortOrder ?? 0
    const service = await db.service.create({
      data: {
        category,
        name,
        variant: variant || null,
        price: Number(price) || 0,
        unit,
        duration: duration || null,
        sortOrder: sortOrder ?? (maxOrder ?? 0) + 1,
      },
    })
    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('POST /api/services error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat layanan' }, { status: 500 })
  }
}
