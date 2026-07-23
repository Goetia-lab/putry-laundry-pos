import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dateFromString } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = Number(searchParams.get('limit')) || 50

    const where: Record<string, unknown> = {}
    if (startDate && endDate) {
      where.recapDate = {
        gte: new Date(`${startDate}T00:00:00.000+07:00`),
        lte: new Date(`${endDate}T23:59:59.999+07:00`),
      }
    }

    const recaps = await db.mainRecap.findMany({
      where,
      orderBy: { recapDate: 'desc' },
      take: limit,
      include: { entries: { include: { branch: true } } },
    })
    return NextResponse.json({ success: true, data: recaps })
  } catch (error) {
    console.error('GET /api/recap error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memuat rekap utama' }, { status: 500 })
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
    const { date } = body
    const dateStr = date || new Date().toISOString().slice(0, 10)
    const recapDate = dateFromString(dateStr)

    // Get closings for that date
    const closings = await db.dailyClosing.findMany({
      where: { closingDate: recapDate },
      include: { branch: true },
    })

    if (closings.length === 0) {
      return NextResponse.json({ success: false, error: 'Belum ada data tutup buku untuk tanggal ini' }, { status: 400 })
    }

    const totalGrossIncome = closings.reduce((s, c) => s + c.grossIncome, 0)
    const totalExpenses = closings.reduce((s, c) => s + c.operationalExpenses, 0)
    const totalNetIncome = closings.reduce((s, c) => s + c.netIncome, 0)
    const totalOperationalFundDisbursed = closings.reduce((s, c) => s + c.operationalFundRetained, 0)
    const grandTotal = totalNetIncome

    const recap = await db.$transaction(async (tx) => {
      const r = await tx.mainRecap.upsert({
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

      // Refresh entries atomically
      await tx.mainRecapEntry.deleteMany({ where: { recapId: r.id } })
      if (closings.length > 0) {
        await tx.mainRecapEntry.createMany({
          data: closings.map((c) => ({
            recapId: r.id,
            branchId: c.branchId,
            grossIncome: c.grossIncome,
            expenses: c.operationalExpenses,
            netIncome: c.netIncome,
            operationalFundDisbursed: c.operationalFundRetained,
            netToMain: c.netIncome,
          })),
        })
      }

      return tx.mainRecap.findUnique({
        where: { id: r.id },
        include: { entries: { include: { branch: true } } },
      })
    })

    return NextResponse.json({ success: true, data: recap })
  } catch (error) {
    console.error('POST /api/recap error:', error)
    return NextResponse.json({ success: false, error: 'Gagal membuat rekap' }, { status: 500 })
  }
}
