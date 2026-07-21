import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// M5: ✅ Health check with DB probe — returns 503 when DB is unreachable
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({
      success: true,
      status: 'healthy',
      db: 'connected',
    })
  } catch (error) {
    console.error('Health check failed — DB unreachable:', error)
    return NextResponse.json(
      { success: false, status: 'unhealthy', db: 'disconnected' },
      { status: 503 }
    )
  }
}
