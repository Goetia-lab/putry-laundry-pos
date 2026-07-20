import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPoolUrl(): string {
  const raw = process.env.DATABASE_URL || ''
  if (!raw) return raw
  if (!raw.startsWith('postgres')) return raw
  if (/\bpgbouncer=true\b/.test(raw)) return raw
  const [base, qs] = raw.split('?')
  const p = new URLSearchParams(qs || '')
  p.set('pgbouncer', 'true')
  p.set('connection_limit', '1')
  p.set('pool_timeout', '10')
  return base + '?' + p.toString()
}

const adapter = new PrismaPg({ connectionString: getPoolUrl() })

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
