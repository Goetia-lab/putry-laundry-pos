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

    // Aggregate total spent per customer in ONE grouped query instead of N+1
    const customerIds = customers.map((c) => c.id)
    const stats =
      customerIds.length > 0
        ? await db.transaction.groupBy({
            by: ['customerId'],
            where: { customerId: { in: customerIds }, paymentStatus: 'LUNAS' },
            _sum: { totalAmount: true },
            _count: { id: true },
          })
        : []
    const statsMap = new Map(stats.map((s) => [s.customerId, s]))

    const customersWithStats = customers.map((c) => {
      const s = statsMap.get(c.id)
      return {
        ...c,
        totalSpent: s?._sum.totalAmount ?? 0,
        transactionCount: s?._count.id ?? 0,
      }
    })

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

    // Dedup: by phone OR by case-insensitive name
    const trimmedName = name.trim()
    const trimmedPhone = (phone || '').trim()
    const orClauses = []
    if (trimmedPhone) orClauses.push({ phone: trimmedPhone })
    if (!trimmedPhone) orClauses.push({ name: { equals: trimmedName, mode: 'insensitive' as const } })

    const existing = await db.customer.findFirst({
      where: { OR: orClauses.length > 0 ? orClauses : undefined },
    })

    if (existing) {
      // Return existing customer instead of creating duplicate
      return NextResponse.json({ success: true, data: existing, deduplicated: true })
    }

    const customer = await db.customer.create({
      data: {
        name: stripHtml(trimmedName),
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
