import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLocalDateString, dateFromString } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date') || getLocalDateString()
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`)
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`)

    const branches = await db.branch.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } })

    const branchStats = await Promise.all(
      branches.map(async (branch) => {
        const transactions = await db.transaction.findMany({
          where: {
            branchId: branch.id,
            date: { gte: dayStart, lte: dayEnd },
            paymentStatus: 'LUNAS',
          },
          include: { items: true },
        })

        const grossIncome = transactions.reduce((s, t) => s + t.totalAmount, 0)
        const transactionCount = transactions.length

        const expenses = await db.operationalExpense.findMany({
          where: {
            branchId: branch.id,
            date: { gte: dayStart, lte: dayEnd },
          },
        })
        const operationalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
        const netIncome = grossIncome - operationalExpenses

        // Check if daily closing exists
        const closing = await db.dailyClosing.findUnique({
          where: { branchId_closingDate: { branchId: branch.id, closingDate: dateFromString(dateStr) } },
        })

        // Pending transactions (in process, not picked up)
        const pendingCount = await db.transaction.count({
          where: {
            branchId: branch.id,
            status: 'PROSES',
          },
        })

        // Top services today
        const serviceMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {}
        transactions.forEach((t) => {
          t.items.forEach((item) => {
            const key = `${item.serviceName}-${item.variant || ''}`
            if (!serviceMap[key]) {
              serviceMap[key] = { name: `${item.serviceName}${item.variant ? ` (${item.variant})` : ''}`, category: item.category, qty: 0, revenue: 0 }
            }
            serviceMap[key].qty += item.quantity
            serviceMap[key].revenue += item.subtotal
          })
        })
        const topServices = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

        return {
          branch,
          grossIncome,
          transactionCount,
          operationalExpenses,
          netIncome,
          isClosed: !!closing,
          closing,
          pendingCount,
          topServices,
        }
      })
    )

    // Main recap for the date
    const mainRecap = await db.mainRecap.findUnique({
      where: { recapDate: dateFromString(dateStr) },
      include: { entries: { include: { branch: true } } },
    })

    const totalGross = branchStats.reduce((s, b) => s + b.grossIncome, 0)
    const totalExpenses = branchStats.reduce((s, b) => s + b.operationalExpenses, 0)
    const totalNet = branchStats.reduce((s, b) => s + b.netIncome, 0)
    const totalTransactions = branchStats.reduce((s, b) => s + b.transactionCount, 0)
    const allClosed = branchStats.every((b) => b.isClosed)
    const operationalFundTotal = branches.reduce((s, b) => s + b.operationalFundAmount, 0)

    // 7-day trend — batched into 2 queries instead of 14
    const trendStart = new Date()
    trendStart.setDate(trendStart.getDate() - 6)
    const trendStartStr = trendStart.toISOString().slice(0, 10)
    const trendEndStr = getLocalDateString()
    const trendDayStart = new Date(`${trendStartStr}T00:00:00.000Z`)
    const trendDayEnd = new Date(`${trendEndStr}T23:59:59.999Z`)

    const [allDayTx, allDayExp] = await Promise.all([
      db.transaction.findMany({
        where: { date: { gte: trendDayStart, lte: trendDayEnd }, paymentStatus: 'LUNAS' },
        select: { date: true, totalAmount: true },
      }),
      db.operationalExpense.findMany({
        where: { date: { gte: trendDayStart, lte: trendDayEnd } },
        select: { date: true, amount: true },
      }),
    ])

    const trend: Array<{ date: string; gross: number; expenses: number; net: number; count: number }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dStr = d.toISOString().slice(0, 10)
      const dayTx = allDayTx.filter((t) => t.date.toISOString().slice(0, 10) === dStr)
      const dayExp = allDayExp.filter((e) => e.date.toISOString().slice(0, 10) === dStr)
      const gross = dayTx.reduce((s, t) => s + t.totalAmount, 0)
      const exp = dayExp.reduce((s, e) => s + e.amount, 0)
      trend.push({ date: dStr, gross, expenses: exp, net: gross - exp, count: dayTx.length })
    }

    // Recent transactions (last 5 today)
    const recentTransactions = await db.transaction.findMany({
      where: {
        date: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { date: 'desc' },
      take: 5,
      include: { branch: true, items: true },
    })

    // Pending orders (PROSES status, ready for pickup soon)
    const pendingOrders = await db.transaction.findMany({
      where: { status: 'PROSES' },
      orderBy: { date: 'asc' },
      take: 10,
      include: { branch: true, items: true },
    })

    // Ready for pickup (SELESAI status, not yet picked up)
    const readyForPickup = await db.transaction.findMany({
      where: { status: 'SELESAI' },
      orderBy: { date: 'asc' },
      take: 10,
      include: { branch: true, items: true },
    })


    return NextResponse.json({
      success: true,
      data: {
        date: dateStr,
        branches: branchStats,
        mainRecap,
        weeklyTrend: trend,
        recentTransactions,
        pendingOrders,
        readyForPickup,
        totals: {
          grossIncome: totalGross,
          operationalExpenses: totalExpenses,
          netIncome: totalNet,
          transactionCount: totalTransactions,
          operationalFundTotal,
          grandTotalToMain: mainRecap?.grandTotal ?? (totalNet - operationalFundTotal),
          allClosed,
        },
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat dashboard' }, { status: 500 })
  }
}
