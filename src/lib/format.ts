// Currency & formatting helpers for Laundry POS

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount)
}

export function formatCompactRupiah(amount: number): string {
  if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}jt`
  if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}rb`
  return `Rp ${amount}`
}

// Get local date string (YYYY-MM-DD) in Asia/Jakarta timezone
export function getLocalDateString(date: Date = new Date()): string {
  const jakartaTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const y = jakartaTime.getFullYear()
  const m = String(jakartaTime.getMonth() + 1).padStart(2, '0')
  const d = String(jakartaTime.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Convert local date string to a Date at start of day (for storage)
export function dateFromString(dateStr: string): Date {
  // Create date at noon to avoid timezone shift issues
  return new Date(`${dateStr}T12:00:00.000Z`)
}

// Get date range for today in Jakarta — unused, kept for reference only
// ❌ NEVER USE - has timezone bug. Use getLocalDateString() with T00:00:00+07:00 instead.
// export function getTodayRange(): { start: Date; end: Date } { ... }

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(d)
}

// Check if current time is at/after 8 PM (closing time)
export function isPastClosingTime(date: Date = new Date()): boolean {
  const jakartaTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  return jakartaTime.getHours() >= 20
}

export const SERVICE_CATEGORIES = [
  'Jasa',
  'Sepatu',
  'Gorden',
  'Selimut',
  'Bed Cover',
  'Lain-lain',
] as const

export const EXPENSE_CATEGORIES = [
  'DETERGEN',
  'PARFUM',
  'PLASTIK',
  'LISTRIK',
  'AIR',
  'GAJI',
  'TRANSPORT',
  'LAINNYA',
] as const

export const TRANSACTION_STATUS = {
  PROSES: 'PROSES',
  SELESAI: 'SELESAI',
  DIAMBIL: 'DIAMBIL',
} as const

export const PAYMENT_STATUS = {
  LUNAS: 'LUNAS',
  BELUM_BAYAR: 'BELUM_BAYAR',
} as const

// Format Indonesian phone number for WhatsApp (convert 08xxx to 628xxx)
export function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1)
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }
  return cleaned
}

// Build WhatsApp click-to-chat URL with prefilled message
export function buildWhatsAppUrl(phone: string, message: string): string {
  const num = formatWhatsAppNumber(phone)
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`
}

// Customer loyalty tiers based on total spent
export interface LoyaltyTier {
  name: string
  level: number
  minSpent: number
  discountPercent: number
  color: string
  bgColor: string
  borderColor: string
  icon: string
  description: string
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'Bronze',
    level: 1,
    minSpent: 0,
    discountPercent: 0,
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40',
    borderColor: 'border-amber-300 dark:border-amber-800',
    icon: '🥉',
    description: 'Pelanggan baru',
  },
  {
    name: 'Silver',
    level: 2,
    minSpent: 100000,
    discountPercent: 5,
    color: 'text-slate-600 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800/40',
    borderColor: 'border-slate-300 dark:border-slate-700',
    icon: '🥈',
    description: 'Pelanggan setia',
  },
  {
    name: 'Gold',
    level: 3,
    minSpent: 500000,
    discountPercent: 10,
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-950/40',
    borderColor: 'border-yellow-300 dark:border-yellow-800',
    icon: '🥇',
    description: 'Pelanggan VIP',
  },
  {
    name: 'Platinum',
    level: 4,
    minSpent: 1000000,
    discountPercent: 15,
    color: 'text-violet-700 dark:text-violet-300',
    bgColor: 'bg-violet-100 dark:bg-violet-950/40',
    borderColor: 'border-violet-300 dark:border-violet-800',
    icon: '💎',
    description: 'Pelanggan terhormat',
  },
]

export function getLoyaltyTier(totalSpent: number): LoyaltyTier {
  let tier = LOYALTY_TIERS[0]
  for (const t of LOYALTY_TIERS) {
    if (totalSpent >= t.minSpent) tier = t
  }
  return tier
}

export function getNextTier(totalSpent: number): LoyaltyTier | null {
  for (const t of LOYALTY_TIERS) {
    if (totalSpent < t.minSpent) return t
  }
  return null // Already at highest tier
}

export function getProgressToNextTier(totalSpent: number): { current: LoyaltyTier; next: LoyaltyTier | null; progress: number } {
  const current = getLoyaltyTier(totalSpent)
  const next = getNextTier(totalSpent)
  if (!next) return { current, next: null, progress: 100 }
  const range = next.minSpent - current.minSpent
  const progress = Math.min(100, Math.round(((totalSpent - current.minSpent) / range) * 100))
  return { current, next, progress }
}

// Calculate estimated completion date based on transaction items
// Express = +1 day (24 hours), Reguler = +3 days
export function getEstimatedCompletionDate(entryDate: Date | string, items?: Array<{ variant?: string | null }>): Date {
  const date = typeof entryDate === 'string' ? new Date(entryDate) : new Date(entryDate)
  // Check if any item is Express
  const hasExpress = items?.some((item) => item.variant === 'Express')
  const daysToAdd = hasExpress ? 1 : 3
  const result = new Date(date)
  result.setDate(result.getDate() + daysToAdd)
  return result
}

// Format estimated date with relative label
export function formatEstimatedDate(entryDate: Date | string, items?: Array<{ variant?: string | null }>): { dateStr: string; label: string; isOverdue: boolean; daysLeft: number } {
  const est = getEstimatedCompletionDate(entryDate, items)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const estDay = new Date(est.getFullYear(), est.getMonth(), est.getDate())
  const diffDays = Math.round((estDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(est)

  let label = ''
  if (diffDays < 0) {
    label = `Terlambat ${Math.abs(diffDays)} hari`
  } else if (diffDays === 0) {
    label = 'Hari ini selesai'
  } else if (diffDays === 1) {
    label = 'Besok selesai'
  } else {
    label = `${diffDays} hari lagi`
  }

  return {
    dateStr,
    label,
    isOverdue: diffDays < 0,
    daysLeft: diffDays,
  }
}
