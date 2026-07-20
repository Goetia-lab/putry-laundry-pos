import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPoolUrl(): string {
  const raw = process.env.DATABASE_URL || ''
  if (!raw) return raw
  // Only patch PostgreSQL URLs — skip SQLite
  if (!raw.startsWith('postgres')) return raw
  // Already tagged — return as-is
  if (/\bpgbouncer=true\b/.test(raw)) return raw
  const [base, qs] = raw.split('?')
  const p = new URLSearchParams(qs || '')
  p.set('pgbouncer', 'true')
  p.set('connection_limit', '1')
  p.set('pool_timeout', '10')
  return base + '?' + p.toString()
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: getPoolUrl() } },
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
