import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLocalDateString } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get('branchId')
    const date = searchParams.get('date') // YYYY-MM-DD
    const status = searchParams.get('status')
    const limit = Number(searchParams.get('limit')) || 100

    const where: Record<string, unknown> = {}
    if (branchId) where.branchId = branchId
    if (status) where.status = status
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`)
      const end = new Date(`${date}T23:59:59.999Z`)
      where.date = { gte: start, lte: end }
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        branch: true,
        items: true,
      },
    })

        return NextResponse.json({ success: true, data: transactions })
  } catch (error) {
    console.error('GET /api/transactions error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat transaksi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { branchId, customerId, customerName, customerPhone, items, paymentStatus, paidAmount, notes, pickupDate, discountPercent } = body

    if (!branchId || !customerName || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cabang, nama customer, dan item wajib diisi' }, { status: 400 })
    }

    const branch = await db.branch.findUnique({ where: { id: branchId } })
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Cabang tidak ditemukan' }, { status: 404 })
    }

    // Calculate subtotal (before discount)
    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + (item.price * item.quantity)
    }, 0)

    // Apply loyalty discount
    const discountPct = Number(discountPercent) || 0
    const discountAmount = Math.round((subtotal * discountPct) / 100)
    const totalAmount = subtotal - discountAmount

    const paid = Number(paidAmount) || totalAmount
    const change = Math.max(0, paid - totalAmount)

    // Generate invoice number: INV-{CODE}-{YYYYMMDD}-{count}
    const today = getLocalDateString()
    const datePart = today.replace(/-/g, '')
    const countToday = await db.transaction.count({
      where: {
        branchId,
        date: {
          gte: new Date(`${today}T00:00:00.000Z`),
          lte: new Date(`${today}T23:59:59.999Z`),
        },
      },
    })
    const invoiceNo = `INV-${branch.code}-${datePart}-${String(countToday + 1).padStart(3, '0')}`

    const transaction = await db.transaction.create({
      data: {
        invoiceNo,
        branchId,
        customerId: customerId || null,
        customerName,
        customerPhone: customerPhone || null,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        status: 'PROSES',
        paymentStatus: paymentStatus || 'LUNAS',
        subtotal,
        discountPercent: discountPct,
        discountAmount,
        totalAmount,
        paidAmount: paid,
        changeAmount: change,
        notes: notes || null,
        items: {
          create: items.map((item: { serviceId?: string; serviceName: string; category: string; variant?: string; price: number; unit: string; quantity: number }) => ({
            serviceId: item.serviceId || null,
            serviceName: item.serviceName,
            category: item.category,
            variant: item.variant || null,
            price: Number(item.price),
            unit: item.unit,
            quantity: Number(item.quantity),
            subtotal: Number(item.price) * Number(item.quantity),
          })),
        },
      },
      include: {
        items: true,
        branch: true,
      },
    })

    
    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('POST /api/transactions error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat transaksi' }, { status: 500 })
  }
}
