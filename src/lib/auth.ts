// Branch scope auth — server-side key-to-branch mapping
// ponytail: BRANCH_KEYS env var as JSON. Falls back to "all-access" if unset.

export interface BranchKeyEntry {
  key: string
  branches: string[]     // branch IDs this key can access. [] = all branches
  label?: string         // optional human label for audit
}

let parsedKeys: BranchKeyEntry[] | null = null

function getBranchKeys(): BranchKeyEntry[] {
  if (parsedKeys) return parsedKeys
  const raw = process.env.BRANCH_KEYS
  if (!raw) {
    parsedKeys = []
    return parsedKeys
  }
  try {
    parsedKeys = JSON.parse(raw) as BranchKeyEntry[]
    return parsedKeys
  } catch {
    console.error('BRANCH_KEYS: invalid JSON — defaulting to all-access')
    parsedKeys = []
    return parsedKeys
  }
}

export function clearBranchKeyCache(): void {
  parsedKeys = null
}

function getApiKeyFromRequest(authHeader: string, apiKeyHeader: string): string {
  return apiKeyHeader || authHeader.replace(/^Bearer\s+/i, '')
}

export function getAllowedBranchIds(apiKey: string): string[] | null {
  const keys = getBranchKeys()
  if (keys.length === 0) return null // null = all branches (BRANCH_KEYS not set)

  const entry = keys.find((k) => k.key === apiKey)
  if (!entry) return null // unknown key — null means NOT in keys list
  return entry.branches // [] = all branches
}

export function authorizeBranchAccess(
  authHeader: string,
  apiKeyHeader: string,
  requestedBranchId: string | null,
): { allowed: boolean; error?: string } {
  const apiKey = getApiKeyFromRequest(authHeader, apiKeyHeader)
  const keys = getBranchKeys()
  if (keys.length === 0) return { allowed: true } // BRANCH_KEYS not configured → all-access

  const entry = keys.find((k) => k.key === apiKey)
  if (!entry) return { allowed: false, error: 'API key tidak dikenal' }
  const branches = entry.branches

  // [] = key has access to all branches (admin key)
  if (branches.length === 0) return { allowed: true }

  // No specific branch requested
  if (!requestedBranchId) {
    return { allowed: true }
  }

  // specific branches
  if (branches.includes(requestedBranchId)) return { allowed: true }

  return { allowed: false, error: 'Akses cabang ditolak' }
}
