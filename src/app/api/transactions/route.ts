import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLocalDateString } from '@/lib/format'
import { parsePagination, buildPaginationMeta } from '@/lib/pagination'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get('branchId')
    const date = searchParams.get('date') // YYYY-MM-DD
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const { cursor, take } = parsePagination(searchParams)

    const where: Record<string, unknown> = {}
    if (branchId) where.branchId = branchId
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (date) {
      const start = new Date(`${date}T00:00:00.000+07:00`)
      const end = new Date(`${date}T23:59:59.999+07:00`)
      where.date = { gte: start, lte: end }
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: cursor ? take + 1 : take, // +1 to detect hasMore with cursor
      skip: 0,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        branch: true,
        items: true,
      },
    })

    const hasMore = transactions.length > take
    if (hasMore) transactions.pop() // remove the extra item

    const pagination = buildPaginationMeta(transactions, { cursor, take })

    return NextResponse.json({ success: true, data: transactions, pagination })
  } catch (error) {
    console.error('GET /api/transactions error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat transaksi' }, { status: 500 })
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
    const { branchId, customerId, customerName, customerPhone, items, paymentStatus, paidAmount, notes, pickupDate, discountPercent } = body

    if (!branchId || !customerName || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cabang, nama customer, dan item wajib diisi' }, { status: 400 })
    }

    // C3: ✅ Validate branch exists
    const branch = await db.branch.findUnique({ where: { id: branchId } })
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Cabang tidak ditemukan' }, { status: 404 })
    }

    // Validate items
    if (items.some((item: any) => isNaN(Number(item.price)) || isNaN(Number(item.quantity)))) {
      return NextResponse.json({ success: false, error: 'Harga dan quantity item harus angka valid' }, { status: 400 })
    }

    // C3: ✅ Lookup price server-side — trust DB not client
    const serviceIds = items
      .map((item: any) => item.serviceId)
      .filter((id: string | undefined): id is string => !!id)
    let serviceMap: Record<string, { price: number; name: string; category: string; variant: string | null; unit: string }> = {}
    if (serviceIds.length > 0) {
      const services = await db.service.findMany({ where: { id: { in: serviceIds } } })
      for (const s of services) {
        serviceMap[s.id] = { price: s.price, name: s.name, category: s.category, variant: s.variant, unit: s.unit }
      }
    }
    // Override client price with server price for known services
    const validatedItems = items.map((item: any) => {
      const svc = item.serviceId ? serviceMap[item.serviceId] : null
      if (svc) {
        return { ...item, price: svc.price, serviceName: svc.name, category: svc.category, variant: svc.variant, unit: svc.unit }
      }
      return item
    })

    // Calculate subtotal (before discount)
    const subtotal = validatedItems.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + (item.price * item.quantity)
    }, 0)

    // Discount clamp — max 15%
    const discountPct = Math.min(Number(discountPercent) || 0, 15)
    const discountAmount = Math.round((subtotal * discountPct) / 100)
    const totalAmount = subtotal - discountAmount

    const paid = paidAmount != null && paidAmount !== '' ? Number(paidAmount) : totalAmount
    const change = Math.max(0, paid - totalAmount)

    // H1: ✅ Retry loop — count-then-create, retry on P2002 race
    const today = getLocalDateString()
    const datePart = today.replace(/-/g, '')
    const customerOrderIndex = customerId
      ? (await db.transaction.count({ where: { customerId } })) + 1
      : null
    const MAX_RETRIES = 3
    let lastError: unknown
    let transaction: any
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const countToday = await db.transaction.count({
          where: { branchId, date: { gte: new Date(`${today}T00:00:00.000+07:00`), lte: new Date(`${today}T23:59:59.999+07:00`) } },
        })
        const invoiceNo = `INV-${branch.code}-${datePart}-${String(countToday + 1).padStart(3, '0')}`

        transaction = await db.transaction.create({
          data: {
            invoiceNo, branchId, date: new Date(),
            customerId: customerId || null, customerName,
            customerPhone: customerPhone || null, customerOrderIndex,
            pickupDate: pickupDate ? new Date(pickupDate) : null,
            status: 'PROSES', paymentStatus: paymentStatus || 'LUNAS',
            subtotal, discountPercent: discountPct, discountAmount,
            totalAmount, paidAmount: paid, changeAmount: change,
            notes,
            items: {
              create: validatedItems.map((item: any) => ({
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
          include: { items: true, branch: true },
        })
        break // success
      } catch (err: any) {
        lastError = err
        if (err?.code === 'P2002' && attempt < MAX_RETRIES) continue
        throw err
      }
    }
    // ponytail: H1 — for truly race-free, use db.$transaction(isolationLevel=Serializable) which
    // serializes concurrent POSTs on the same branch+day. Deferred until perf data justifies cost.

    return NextResponse.json({ success: true, data: transaction })
  } catch (error) {
    console.error('POST /api/transactions error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat transaksi' }, { status: 500 })
  }
}
