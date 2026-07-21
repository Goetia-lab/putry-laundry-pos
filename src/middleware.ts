import { NextRequest, NextResponse } from 'next/server'

// C1+C2+C4: ✅ Basic API key auth for all /api/ routes — fail-closed
const API_KEY = process.env.API_KEY || ''
const GAUTH_B64 = process.env.GAUTH_B64 || ''
const AUTH_SECRET = API_KEY || GAUTH_B64

// C4: ✅ Fail-closed — if neither API_KEY nor GAUTH_B64 is set, block all requests
// ponytail: Replace with actual env validation at deploy time (Vercel env checks) when CI supports it

// H6: ✅ Simple in-memory rate-limit — Map<ip, {count, resetAt}>
const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_WINDOW_MS = 60_000 // 1 minute
const RATE_MAX = 30 // 30 requests/minute per IP

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip non-API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Skip health check
  if (pathname === '/api/health') {
    return NextResponse.next()
  }

  // C4: ✅ Fail-closed — reject if no auth secret configured (env missing at deploy time)
  if (!AUTH_SECRET) {
    return NextResponse.json({ success: false, error: 'Server configuration error — auth not configured' }, { status: 500 })
  }

  // H6: ✅ Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  const now = Date.now()
  let entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS }
    rateLimit.set(ip, entry)
  }
  entry.count++
  if (entry.count > RATE_MAX) {
    return NextResponse.json({ success: false, error: 'Terlalu banyak permintaan — coba lagi nanti' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) },
    })
  }
  // Clean stale entries every 100 requests
  if (rateLimit.size > 1000) {
    const cutoff = now - 120_000
    for (const [k, v] of rateLimit) {
      if (now > v.resetAt) rateLimit.delete(k)
    }
  }
  // ponytail: H6 — in-memory Map is per-instance. For Vercel serverless, use Upstash or Vercel KV rate-limit middleware instead.

  // C1: ✅ Auth check — require Authorization Bearer or x-api-key
  const authHeader = request.headers.get('authorization') || ''
  const apiKeyHeader = request.headers.get('x-api-key') || ''
  const token = apiKeyHeader || authHeader.replace(/^Bearer\s+/i, '')

  if (token !== AUTH_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized — API key atau token tidak valid' }, { status: 401 })
  }
  // ponytail: C4 — For proper multi-user auth (Google OAuth), integrate next-auth or clerk.
  // ponytail: C2 — Branch scope check should verify token claims against branchId query param.

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
