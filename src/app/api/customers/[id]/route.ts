import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        branch: true,
        transactions: {
          orderBy: { date: 'desc' },
          take: 20,
          include: { branch: true, items: true },
        },
      },
    })
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat customer' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, phone, address, branchId } = body

    const customer = await db.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null }),
        ...(branchId !== undefined && { branchId: branchId || null }),
      },
    })
    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    console.error('PATCH /api/customers/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memperbarui customer' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Gagal menghapus customer' }, { status: 500 })
  }
}
