# Branch IDOR / Authorization Fix Plan

## Current State

All API routes accept `branchId` as a query parameter and trust it unconditionally.
Authentication is per-api-key only — any valid key accesses any branch.

**Affected endpoints:**
| Endpoint | branchId usage |
|----------|----------------|
| `GET /api/transactions` | filter |
| `POST /api/transactions` | create |
| `GET /api/customers` | filter |
| `GET /api/expenses` | filter |
| `POST /api/expenses` | create |
| `GET /api/daily-closing` | filter |
| `POST /api/daily-closing` | create |
| `GET /api/reports` | filter |
| `GET /api/dashboard` | filter |

## Proposed Model

### Token → Branch Mapping

**Option A (recommended):** Embed branch membership in GAUTH_B64 payload.

GAUTH_B64 currently is a static base64 string. Replace with JWT-like payload:

```ts
// Decode GAUTH_B64 -> parsed object:
interface AuthToken {
  branches: string[]      // branch IDs this token can access
  role: 'admin' | 'manager' | 'staff'
}
```

### Implementation

#### 1. Middleware Enhancement (`src/middleware.ts`)

```ts
export function parseAuth(token: string): { branches: string[]; role: string } | null {
  try {
    const decoded = JSON.parse(atob(token.replace('Bearer ', '')))
    if (!decoded.branches) return null  // invalid format
    return decoded
  } catch { return null }
}
```

#### 2. Branch Scope Helper (`src/lib/auth.ts` — NEW)

```ts
export function requireBranchAccess(
  authData: { branches: string[]; role: string },
  requestedBranchId: string
): void {
  if (authData.role === 'admin') return  // admin = all branches
  if (!authData.branches.includes(requestedBranchId)) {
    throw new UnauthorizedError('Akses ditolak untuk cabang ini')
  }
}
```

#### 3. Apply to each route handler

```ts
const auth = parseAuth(req.headers.get('authorization') || '')
if (!auth) return 401

const branchId = searchParams.get('branchId')
if (branchId) {
  requireBranchAccess(auth, branchId)
}
```

## Per-Route Risk Assessment

| Route | Risk | Auto-fix? |
|-------|------|-----------|
| `GET /api/*` | Read-only | Low risk |
| `POST /api/transactions` | Creates financial data | **Manual approval** |
| `POST /api/expenses` | Creates financial data | **Manual approval** |
| `POST /api/daily-closing` | Closes books | **Manual approval** |
| `GET /api/reports` | Exports | Low risk |

## Test Plan

```ts
// Envisioned test (needs DB + multiple tokens)
describe('branch authorization', () => {
  it('token without branch access gets 401', async () => {
    // create token with branches=['branch-a']
    // request with branchId='branch-b'
    // expect 401
  })
  it('admin token accesses any branch', async () => {
    // create admin token
    // request with any branchId
    // expect 200
  })
})
```

## Rollout Plan

1. Create `GAUTH_B64` format spec document
2. Generate new tokens for each branch
3. Update Vercel env with new GAUTH_B64
4. Deploy middleware enhancement (fail-closed: reject unknown)
5. Test each branch independently
6. Monitor for auth errors
7. Old tokens deprecated after 7 days

## Status

**⏸ MANUAL APPROVAL REQUIRED** — affects all financial write operations.
