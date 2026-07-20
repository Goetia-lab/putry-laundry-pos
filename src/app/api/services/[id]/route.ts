import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Format JSON tidak valid' }, { status: 400 })
    }
    const { category, name, variant, price, unit, duration, sortOrder, isActive } = body

    const service = await db.service.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(name !== undefined && { name }),
        ...(variant !== undefined && { variant: variant || null }),
        ...(price !== undefined && { price: Number(price) }),
        ...(unit !== undefined && { unit }),
        ...(duration !== undefined && { duration: duration || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return NextResponse.json({ success: true, data: service })
  } catch (error) {
    console.error('PATCH /api/services/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memperbarui layanan' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.service.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/services/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus layanan' }, { status: 500 })
  }
}
