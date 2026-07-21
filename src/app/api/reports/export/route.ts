import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getLocalDateString } from '@/lib/format'

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

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
      // H5: ✅ Only LUNAS for export — matching layar filter
      paymentStatus: 'LUNAS',
    }
    if (branchId && branchId !== 'all') txWhere.branchId = branchId

    const transactions = await db.transaction.findMany({
      where: txWhere,
      include: { branch: true, items: true },
      orderBy: { date: 'asc' },
    })

    // Build CSV
    const headers = [
      'Tanggal', 'Invoice', 'Cabang', 'Customer', 'HP',
      'Status', 'Status Bayar', 'Item', 'Kategori', 'Varian',
      'Harga', 'Satuan', 'Qty', 'Subtotal', 'Total Transaksi',
    ]

    const rows: string[][] = []
    transactions.forEach((t) => {
      if (t.items.length === 0) {
        rows.push([
          new Date(t.date).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
          t.invoiceNo,
          t.branch.name,
          t.customerName,
          t.customerPhone || '',
          t.status,
          t.paymentStatus,
          '', '', '', '', '', '', '',
          String(t.totalAmount),
        ])
      } else {
        t.items.forEach((item) => {
          rows.push([
            new Date(t.date).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
            t.invoiceNo,
            t.branch.name,
            t.customerName,
            t.customerPhone || '',
            t.status,
            t.paymentStatus,
            item.serviceName,
            item.category,
            item.variant || '',
            String(item.price),
            item.unit,
            String(item.quantity),
            String(item.subtotal),
            String(t.totalAmount),
          ])
        })
      }
    })

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map((r) => r.map(escapeCSV).join(',')),
    ].join('\n')

    // Add BOM for Excel UTF-8 compatibility
    const csvWithBOM = '\ufeff' + csv

    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="laparan-laundry-${startDate}-sampai-${endDate}.csv"`,
      },
    })
  } catch (error) {
    console.error('GET /api/reports/export error:', error)
    return NextResponse.json({ success: false, error: 'Gagal export laporan' }, { status: 500 })
  }
}
