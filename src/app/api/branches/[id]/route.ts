import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const branch = await db.branch.findUnique({ where: { id } })
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Cabang tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: branch })
  } catch (error) {
    console.error('GET /api/branches/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat cabang' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Format JSON tidak valid' }, { status: 400 })
    }
    const { name, code, address, phone, operationalFundAmount, isActive } = body

    const branch = await db.branch.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code: code.toUpperCase() }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(operationalFundAmount !== undefined && { operationalFundAmount: Number(operationalFundAmount) }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return NextResponse.json({ success: true, data: branch })
  } catch (error) {
    console.error('PATCH /api/branches/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memperbarui cabang' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.branch.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/branches/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus cabang' }, { status: 500 })
  }
}
