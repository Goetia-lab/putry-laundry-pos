import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLocalDateString, dateFromString } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get('branchId')
    const date = searchParams.get('date')

    const where: Record<string, unknown> = {}
    if (branchId) where.branchId = branchId
    if (date) where.closingDate = dateFromString(date)

    const closings = await db.dailyClosing.findMany({
      where,
      orderBy: { closingDate: 'desc' },
      include: { branch: true },
      take: 100,
    })
    return NextResponse.json({ success: true, data: closings })
  } catch (error) {
    console.error('GET /api/daily-closing error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat data tutup buku' }, { status: 500 })
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
    const { branchId, date, notes } = body

    if (!branchId) {
      return NextResponse.json({ success: false, error: 'Cabang wajib diisi' }, { status: 400 })
    }

    const branch = await db.branch.findUnique({ where: { id: branchId } })
    if (!branch) {
      return NextResponse.json({ success: false, error: 'Cabang tidak ditemukan' }, { status: 404 })
    }

    const closingDateStr = date || getLocalDateString()
    const closingDate = dateFromString(closingDateStr)
    const dayStart = new Date(`${closingDateStr}T00:00:00.000+07:00`)
    const dayEnd = new Date(`${closingDateStr}T23:59:59.999+07:00`)

    // Get all transactions for this branch on this date (paid only)
    const transactions = await db.transaction.findMany({
      where: {
        branchId,
        date: { gte: dayStart, lte: dayEnd },
        paymentStatus: 'LUNAS',
      },
    })

    const grossIncome = transactions.reduce((sum, t) => sum + t.totalAmount, 0)
    const transactionCount = transactions.length

    // Get operational expenses for this branch on this date
    const expenses = await db.operationalExpense.findMany({
      where: {
        branchId,
        date: { gte: dayStart, lte: dayEnd },
      },
    })

    const operationalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const netIncome = grossIncome - operationalExpenses
    const operationalFundRetained = branch.operationalFundAmount // float untuk besok

    // Upsert daily closing
    const closing = await db.dailyClosing.upsert({
      where: {
        branchId_closingDate: { branchId, closingDate },
      },
      create: {
        branchId,
        date: closingDate,
        closingDate,
        grossIncome,
        transactionCount,
        operationalExpenses,
        netIncome,
        transferredToMain: netIncome,
        operationalFundRetained,
        status: 'CLOSED',
        notes: notes || null,
      },
      update: {
        grossIncome,
        transactionCount,
        operationalExpenses,
        netIncome,
        transferredToMain: netIncome,
        operationalFundRetained,
        status: 'CLOSED',
        notes: notes || null,
        closingTime: new Date(),
      },
      include: { branch: true },
    })

    // Now update/create the MainRecap for this date
    await updateMainRecap(closingDateStr, closingDate)

    return NextResponse.json({ success: true, data: closing })
  } catch (error) {
    console.error('POST /api/daily-closing error:', error)
    return NextResponse.json({ success: false, error: 'Gagal melakukan tutup buku' }, { status: 500 })
  }
}

// Helper to update the main recap for a given date — H2: ✅ wrapped in $transaction for atomicity
async function updateMainRecap(dateStr: string, recapDate: Date) {
  const dayStart = new Date(`${dateStr}T00:00:00.000+07:00`)
  const dayEnd = new Date(`${dateStr}T23:59:59.999+07:00`)

  // Get all daily closings for this date (read-only — outside tx)
  const closings = await db.dailyClosing.findMany({
    where: { closingDate: recapDate },
    include: { branch: true },
  })

  const totalGrossIncome = closings.reduce((s, c) => s + c.grossIncome, 0)
  const totalExpenses = closings.reduce((s, c) => s + c.operationalExpenses, 0)
  const totalNetIncome = closings.reduce((s, c) => s + c.netIncome, 0)
  const totalOperationalFundDisbursed = closings.reduce((s, c) => s + c.operationalFundRetained, 0)
  const grandTotal = totalNetIncome

  return db.$transaction(async (tx) => {
    // Upsert main recap
    const recap = await tx.mainRecap.upsert({
      where: { recapDate },
      create: {
        recapDate,
        totalGrossIncome,
        totalExpenses,
        totalNetIncome,
        totalOperationalFundDisbursed,
        grandTotal,
        status: 'CLOSED',
      },
      update: {
        totalGrossIncome,
        totalExpenses,
        totalNetIncome,
        totalOperationalFundDisbursed,
        grandTotal,
      },
    })

    // Delete old entries and create new ones (atomic within transaction)
    await tx.mainRecapEntry.deleteMany({ where: { recapId: recap.id } })

    if (closings.length > 0) {
      await tx.mainRecapEntry.createMany({
        data: closings.map((c) => ({
          recapId: recap.id,
          branchId: c.branchId,
          grossIncome: c.grossIncome,
          expenses: c.operationalExpenses,
          netIncome: c.netIncome,
          operationalFundDisbursed: c.operationalFundRetained,
          netToMain: c.netIncome,
        })),
      })
    }

    return recap
  })
}
