import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '')
}

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
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Format JSON tidak valid' }, { status: 400 })
    }
    const { name, phone, address, branchId } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Nama customer wajib diisi' }, { status: 400 })
    }

    // Validate branchId exists
    if (branchId) {
      const branch = await db.branch.findUnique({ where: { id: branchId } })
      if (!branch) {
        return NextResponse.json({ success: false, error: 'Cabang tidak ditemukan' }, { status: 404 })
      }
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
        name: stripHtml(name),
        phone: phone || null,
        address: address ? stripHtml(address) : null,
        branchId: branchId || null,
      },
    })
    return NextResponse.json({ success: true, data: customer, deduplicated: false })
  } catch (error) {
    console.error('POST /api/customers error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat customer' }, { status: 500 })
  }
}
