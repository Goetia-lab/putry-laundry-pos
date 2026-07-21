import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLocalDateString } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate') || getLocalDateString()
    const endDate = searchParams.get('endDate') || getLocalDateString()
    const branchId = searchParams.get('branchId')

    const start = new Date(`${startDate}T00:00:00.000+07:00`)
    const end = new Date(`${endDate}T23:59:59.999+07:00`)

    const txWhere: Record<string, unknown> = {
      date: { gte: start, lte: end },
      paymentStatus: 'LUNAS',
    }
    if (branchId && branchId !== 'all') txWhere.branchId = branchId

    const transactions = await db.transaction.findMany({
      where: txWhere,
      include: { branch: true, items: true },
    })


    const totalRevenue = transactions.reduce((s, t) => s + t.totalAmount, 0)

    // Discount analytics
    const totalSubtotal = transactions.reduce((s, t: any) => s + (t.subtotal ?? t.totalAmount), 0)
    const totalDiscountGiven = transactions.reduce((s, t: any) => s + (t.discountAmount ?? 0), 0)
    const discountedTransactionCount = transactions.filter((t: any) => (t.discountPercent ?? 0) > 0).length
    const avgDiscountPercent = transactions.length > 0
      ? transactions.reduce((s, t: any) => s + (t.discountPercent ?? 0), 0) / transactions.length
      : 0

    // Sales by branch
    const branchMap: Record<string, { branchId: string; branchName: string; code: string; revenue: number; count: number }> = {}
    transactions.forEach((t) => {
      const key = t.branchId
      if (!branchMap[key]) {
        branchMap[key] = { branchId: t.branchId, branchName: t.branch.name, code: t.branch.code, revenue: 0, count: 0 }
      }
      branchMap[key].revenue += t.totalAmount
      branchMap[key].count += 1
    })
    const salesByBranch = Object.values(branchMap)

    // Sales by category
    const categoryMap: Record<string, { category: string; revenue: number; qty: number }> = {}
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        if (!categoryMap[item.category]) {
          categoryMap[item.category] = { category: item.category, revenue: 0, qty: 0 }
        }
        categoryMap[item.category].revenue += item.subtotal
        categoryMap[item.category].qty += item.quantity
      })
    })
    const salesByCategory = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue)

    // Sales by service
    const serviceMap: Record<string, { name: string; category: string; variant: string | null; revenue: number; qty: number }> = {}
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        const key = `${item.serviceName}-${item.variant || ''}`
        if (!serviceMap[key]) {
          serviceMap[key] = { name: item.serviceName, category: item.category, variant: item.variant, revenue: 0, qty: 0 }
        }
        serviceMap[key].revenue += item.subtotal
        serviceMap[key].qty += item.quantity
      })
    })
    const salesByService = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue)

    // Daily trend - fill ALL dates in range (even those with 0 transactions)
    const dailyMap: Record<string, { date: string; revenue: number; count: number; expenses: number }> = {}

    // Helper to get Jakarta local date string from a Date
    const getJakartaDateStr = (d: Date): string => {
      return new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).toISOString().slice(0, 10)
    }

    // Initialize all dates in range with 0 values
    const cursor = new Date(`${startDate}T12:00:00.000Z`)
    const endCursor = new Date(`${endDate}T12:00:00.000Z`)
    while (cursor <= endCursor) {
      const dStr = cursor.toISOString().slice(0, 10)
      dailyMap[dStr] = { date: dStr, revenue: 0, count: 0, expenses: 0 }
      cursor.setDate(cursor.getDate() + 1)
    }

    transactions.forEach((t) => {
      const d = getJakartaDateStr(t.date)
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, revenue: 0, count: 0, expenses: 0 }
      }
      dailyMap[d].revenue += t.totalAmount
      dailyMap[d].count += 1
    })

    // Get expenses for daily trend
    const expWhere: Record<string, unknown> = { date: { gte: start, lte: end } }
    if (branchId && branchId !== 'all') expWhere.branchId = branchId
    const expenses = await db.operationalExpense.findMany({ where: expWhere })
    expenses.forEach((e) => {
      const d = getJakartaDateStr(e.date)
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, revenue: 0, count: 0, expenses: 0 }
      }
      dailyMap[d].expenses += e.amount
    })

    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const netIncome = totalRevenue - totalExpenses

    return NextResponse.json({
      success: true,
      data: {
        startDate,
        endDate,
        totalRevenue,
        totalExpenses,
        netIncome,
        transactionCount: transactions.length,
        totalSubtotal,
        totalDiscountGiven,
        discountedTransactionCount,
        avgDiscountPercent,
        salesByBranch,
        salesByCategory,
        salesByService,
        dailyTrend,
      },
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat laporan' }, { status: 500 })
  }
}
