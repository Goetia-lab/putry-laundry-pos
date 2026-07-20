import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Inject PgBouncer-compatible pool params into DATABASE_URL *before* PrismaClient reads it.
// Supabase session pooler (port 6543) free tier caps at 5 concurrent connections.
// Without this, 3+ concurrent Vercel functions exhaust the pool → EMAXCONNSESSION.
function ensurePoolParams() {
  const raw = process.env.DATABASE_URL
  if (!raw) return
  // Only patch PostgreSQL URLs. SQLite (file:./...) dan datasource non-postgres
  // akan rusak kalau dipaksa pake query string PgBouncer — skip mereka.
  if (!raw.startsWith('postgres')) return
  // Skip if already tagged
  if (/\bpgbouncer=true\b/.test(raw)) return
  const [base, qs] = raw.split('?')
  const p = new URLSearchParams(qs || '')
  p.set('pgbouncer', 'true')
  p.set('connection_limit', '1')
  p.set('pool_timeout', '10')
  process.env.DATABASE_URL = base + '?' + p.toString()
}
ensurePoolParams()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
