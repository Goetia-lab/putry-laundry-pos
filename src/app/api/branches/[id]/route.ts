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
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Format JSON tidak valid' }, { status: 400 })
    }
    const { name, code, address, phone, operationalFundAmount, isActive } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (code !== undefined) data.code = String(code).toUpperCase()
    if (address !== undefined) data.address = address
    if (phone !== undefined) data.phone = phone
    if (operationalFundAmount !== undefined) data.operationalFundAmount = Number(operationalFundAmount)
    if (isActive !== undefined) data.isActive = isActive

    const branch = await db.branch.update({
      where: { id },
      data: data as any,
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
