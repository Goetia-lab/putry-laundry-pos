// Shared pagination helper — cursor + offset hybrid for Prisma
// ponytail: cursor-based for id-having models, offset for others. Add redis-based cursor when >10K records.

export interface PaginationParams {
  cursor?: string
  take?: number
}

export interface PaginationMeta {
  nextCursor: string | null
  hasMore: boolean
  limit: number
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export function parsePagination(searchParams: URLSearchParams): Required<PaginationParams> {
  const raw = searchParams.get('take')
  const num = raw ? Number(raw) : NaN
  const safe = isNaN(num) ? DEFAULT_LIMIT : Math.max(1, num)
  return {
    cursor: searchParams.get('cursor') || '',
    take: Math.min(safe, MAX_LIMIT),
  }
}

export function buildPaginationMeta<T extends { id: string }>(
  items: T[],
  params: Required<PaginationParams>,
): PaginationMeta {
  const hasMore = items.length >= params.take // fetched at least "take" items → probably more
  return {
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    hasMore,
    limit: params.take,
  }
}
