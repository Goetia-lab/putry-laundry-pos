import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getUrl() {
  const base = process.env.DATABASE_URL || ''
  // pg_bouncer session pooler on Supabase free tier = 5 conn limit
  // limit per client instance to 1 + transaction mode to avoid pool exhaustion
  const params = new URLSearchParams(base.split('?')[1] || '')
  if (!params.has('pgbouncer')) params.set('pgbouncer', 'true')
  if (!params.has('connection_limit')) params.set('connection_limit', '1')
  if (!params.has('pool_timeout')) params.set('pool_timeout', '10')
  return base.split('?')[0] + '?' + params.toString()
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getUrl(),
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
