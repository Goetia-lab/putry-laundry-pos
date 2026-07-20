import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get('branchId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (branchId) where.branchId = branchId
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { transactions: true } },
        branch: true,
      },
      take: 100,
    })

    // Aggregate total spent per customer
    const customersWithStats = await Promise.all(
      customers.map(async (c) => {
        const stats = await db.transaction.aggregate({
          where: { customerId: c.id, paymentStatus: 'LUNAS' },
          _sum: { totalAmount: true },
          _count: true,
        })
        return {
          ...c,
          totalSpent: stats._sum.totalAmount ?? 0,
          transactionCount: stats._count,
        }
      })
    )

    return NextResponse.json({ success: true, data: customersWithStats })
  } catch (error) {
    console.error('GET /api/customers error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat customer' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, address, branchId } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Nama customer wajib diisi' }, { status: 400 })
    }

    // Deduplication: if phone is provided, check for existing customer with same phone
    if (phone && phone.trim()) {
      const existing = await db.customer.findFirst({
        where: { phone: phone.trim() },
      })
      if (existing) {
        // Return existing customer instead of creating duplicate
        return NextResponse.json({ success: true, data: existing, deduplicated: true })
      }
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone: phone || null,
        address: address || null,
        branchId: branchId || null,
      },
    })
    return NextResponse.json({ success: true, data: customer, deduplicated: false })
  } catch (error) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat customer' }, { status: 500 })
  }
}
