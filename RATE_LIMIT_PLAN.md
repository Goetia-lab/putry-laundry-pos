# Rate Limit Production-Grade Plan

## Current State

In-memory `Map<string, { count: number; resetAt: number }>` per Vercel instance.
Works within a single serverless invocation; breaks across instances.

## Vercel Serverless Reality

- 3–10 concurrent instances per deployment
- Each has its own in-memory Map
- A client hitting 30 req/min === 15 per instance === no Map ever hits 30

**Lesson:** The in-memory rate limiter is effectively a placebo on Vercel.

## Production Solution: Vercel KV (Upstash Redis)

### Add to `package.json`:

Already has `@upstash/redis` if Vercel KV is enabled. Check:

```bash
npm ls @upstash/redis 2>/dev/null || echo "needs install"
```

### Implementation

**`src/lib/rate-limit.ts` (NEW):**

```ts
import { Redis } from '@upstash/redis'

const KV_REST_API_URL = process.env.KV_REST_API_URL
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN

const kv = KV_REST_API_URL && KV_REST_API_TOKEN
  ? new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN })
  : null  // graceful fallback

const WINDOW_MS = 60_000  // 1 minute
const MAX_REQUESTS = 60   // 60 req/min

export async function checkRateLimit(
  key: string,
  max?: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!kv) return { allowed: true, remaining: 999 }  // no KV = no limit

  const now = Date.now()
  const window = Math.floor(now / WINDOW_MS)
  const redisKey = `ratelimit:${key}:${window}`

  const count = await kv.incr(redisKey)
  if (count === 1) await kv.expire(redisKey, 120)  // TTL 2 min

  if (count > (max ?? MAX_REQUESTS)) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: (max ?? MAX_REQUESTS) - count }
}
```

### Middleware integration (`src/middleware.ts`):

```ts
const clientIp = req.headers.get('x-forwarded-for') || 'unknown'
const apiKey = authHeader?.replace('Bearer ', '') || 'unknown'
const { allowed } = await checkRateLimit(`api:${apiKey}:${clientIp}`)
if (!allowed) return NextResponse.json(
  { success: false, error: 'Too many requests' },
  { status: 429 }
)
```

### Fallback Behavior

| Condition | Behavior |
|-----------|----------|
| KV not configured | Pass through (no rate limit) |
| KV connection error | Pass through + console.error |
| KV overloaded (timeout > 1s) | Pass through |
| Client exceeds limit | 429 response |

### Setup Steps

1. **Vercel Dashboard:** Storage → KV → Create Database (free tier: 256 req/day)
2. **Link to project:** Vercel → project → Storage → Connect
3. **Env vars** auto-injected: `KV_REST_API_URL`, `KV_REST_API_TOKEN`
4. **Re-deploy:** KV vars take effect

### Testing

```bash
# Simulate 60 requests in 1 second
for i in $(seq 1 61); do
  curl -s -o /dev/null -w "%{http_code} " \
    -H "Authorization: Bearer $API_KEY" \
    "https://putry-laundry-pos.vercel.app/api/health"
done
# Expected: 60x 200, 1x 429
```

## Verdict

**⏸ External service setup required** (Vercel KV free tier sufficient).
