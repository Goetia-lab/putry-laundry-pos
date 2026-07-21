import { describe, it, expect, beforeEach } from 'vitest'
import {
  formatRupiah, formatNumber, formatCompactRupiah,
  getLocalDateString, formatDate, formatTime,
  getEstimatedCompletionDate, isPastClosingTime, formatWhatsAppNumber,
  SERVICE_CATEGORIES, EXPENSE_CATEGORIES, TRANSACTION_STATUS, PAYMENT_STATUS,
} from './format'
import { cn } from './utils'
import { parsePagination, buildPaginationMeta } from './pagination'

// ─── Pure utility tests (no DB, no HTTP) ──────────────────────────

describe('formatRupiah', () => {
  it('formats whole numbers', () => {
    expect(formatRupiah(15000)).toBe('Rp\u00a015.000')
  })
  it('formats zero', () => {
    expect(formatRupiah(0)).toBe('Rp\u00a00')
  })
  it('formats millions', () => {
    expect(formatRupiah(1_000_000)).toBe('Rp\u00a01.000.000')
  })
})

describe('formatNumber', () => {
  it('formats with ID locale separators', () => {
    expect(formatNumber(15000)).toBe('15.000')
  })
})

describe('formatCompactRupiah', () => {
  it('shows jt for millions', () => {
    expect(formatCompactRupiah(1_000_000)).toBe('Rp 1.0jt')
  })
  it('shows rb for thousands', () => {
    expect(formatCompactRupiah(2000)).toBe('Rp 2rb')
  })
  it('shows full for small amounts', () => {
    expect(formatCompactRupiah(500)).toBe('Rp 500')
  })
})

describe('getLocalDateString', () => {
  it('returns YYYY-MM-DD format', () => {
    const s = getLocalDateString(new Date('2026-07-21T12:00:00Z'))
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatWhatsAppNumber', () => {
  it('converts 08xxx to 628xxx', () => {
    expect(formatWhatsAppNumber('08123456789')).toBe('628123456789')
  })
  it('converts +62xxx to 62xxx', () => {
    expect(formatWhatsAppNumber('+628123456789')).toBe('628123456789')
  })
  it('passes through 62xxx', () => {
    expect(formatWhatsAppNumber('628123456789')).toBe('628123456789')
  })
})

describe('isPastClosingTime', () => {
  it('returns boolean', () => {
    const r = isPastClosingTime(new Date())
    expect(typeof r).toBe('boolean')
  })
})

describe('getEstimatedCompletionDate', () => {
  it('adds 3 days for regular', () => {
    const base = new Date('2026-07-21T10:00:00Z')
    const est = getEstimatedCompletionDate(base)
    expect(est.getDate()).toBe(24)
  })
  it('adds 1 day for express', () => {
    const base = new Date('2026-07-21T10:00:00Z')
    const est = getEstimatedCompletionDate(base, [{ variant: 'Express' }])
    expect(est.getDate()).toBe(22)
  })
})

describe('constants', () => {
  it('SERVICE_CATEGORIES has expected value', () => {
    expect(SERVICE_CATEGORIES).toContain('Jasa')
  })
  it('EXPENSE_CATEGORIES has expected value', () => {
    expect(EXPENSE_CATEGORIES).toContain('LISTRIK')
  })
  it('TRANSACTION_STATUS values match', () => {
    expect(Object.values(TRANSACTION_STATUS)).toEqual(['PROSES', 'SELESAI', 'DIAMBIL'])
  })
  it('PAYMENT_STATUS values match', () => {
    expect(Object.values(PAYMENT_STATUS)).toEqual(['LUNAS', 'BELUM_BAYAR'])
  })
})

// ─── Pagination helper tests ──────────────────────────────────────

describe('parsePagination', () => {
  it('uses default limit=50', () => {
    const p = parsePagination(new URLSearchParams(''))
    expect(p.take).toBe(50)
    expect(p.cursor).toBe('')
  })
  it('respects take param', () => {
    const p = parsePagination(new URLSearchParams('take=10'))
    expect(p.take).toBe(10)
  })
  it('caps at 100', () => {
    const p = parsePagination(new URLSearchParams('take=999'))
    expect(p.take).toBe(100)
  })
  it('minimum 1', () => {
    const p = parsePagination(new URLSearchParams('take=0'))
    expect(p.take).toBe(1)
  })
  it('reads cursor', () => {
    const p = parsePagination(new URLSearchParams('cursor=abc123&take=5'))
    expect(p.cursor).toBe('abc123')
    expect(p.take).toBe(5)
  })
})

describe('buildPaginationMeta', () => {
  it('hasMore=false when fewer items than take', () => {
    const items = [{ id: 'a' }]
    const meta = buildPaginationMeta(items, { cursor: '', take: 50 })
    expect(meta.hasMore).toBe(false)
    expect(meta.nextCursor).toBeNull()
    expect(meta.limit).toBe(50)
  })
  it('nextCursor=last id when hasMore=true', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const meta = buildPaginationMeta(items, { cursor: '', take: 3 })
    expect(meta.hasMore).toBe(true)
    expect(meta.nextCursor).toBe('c')
  })
})

// ─── cn utility ───────────────────────────────────────────────────

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })
  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })
})
