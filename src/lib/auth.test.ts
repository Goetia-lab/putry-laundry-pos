import { describe, it, expect, afterEach } from 'vitest'
import { clearBranchKeyCache, getAllowedBranchIds, authorizeBranchAccess } from './auth'

const KEY_A = 'key-a'
const KEY_ADMIN = 'key-admin'

function setBranchKeys(keys: unknown) {
  process.env.BRANCH_KEYS = JSON.stringify(keys)
  clearBranchKeyCache()
}

function unsetBranchKeys() {
  delete process.env.BRANCH_KEYS
  clearBranchKeyCache()
}

// ─── getAllowedBranchIds ─────────────────────────────────────────

describe('getAllowedBranchIds', () => {
  afterEach(() => unsetBranchKeys())

  it('returns null when BRANCH_KEYS is not set (all-access)', () => {
    unsetBranchKeys()
    expect(getAllowedBranchIds('any-key')).toBeNull()
  })

  it('returns null when BRANCH_KEYS is empty string (all-access)', () => {
    process.env.BRANCH_KEYS = ''
    clearBranchKeyCache()
    expect(getAllowedBranchIds('any-key')).toBeNull()
  })

  it('returns null when BRANCH_KEYS is invalid JSON (all-access)', () => {
    process.env.BRANCH_KEYS = 'not-json'
    clearBranchKeyCache()
    expect(getAllowedBranchIds('any-key')).toBeNull()
  })

  it('returns branches for known key', () => {
    setBranchKeys([
      { key: 'key-a', branches: ['branch-1', 'branch-2'], label: 'Cabang A' },
    ])
    expect(getAllowedBranchIds('key-a')).toEqual(['branch-1', 'branch-2'])
  })

  it('returns null for unknown key', () => {
    setBranchKeys([{ key: 'key-a', branches: ['branch-1'] }])
    expect(getAllowedBranchIds('unknown-key')).toBeNull() // null = not in keys list
  })

  it('returns [] for admin key (all branches)', () => {
    setBranchKeys([{ key: 'key-admin', branches: [], label: 'Admin' }])
    expect(getAllowedBranchIds('key-admin')).toEqual([])
  })

  it('handles multiple keys', () => {
    setBranchKeys([
      { key: 'key-1', branches: ['a', 'b'] },
      { key: 'key-2', branches: ['c'] },
      { key: 'key-3', branches: [] },
    ])
    expect(getAllowedBranchIds('key-1')).toEqual(['a', 'b'])
    expect(getAllowedBranchIds('key-2')).toEqual(['c'])
    expect(getAllowedBranchIds('key-3')).toEqual([])
    expect(getAllowedBranchIds('missing')).toBeNull()
  })
})

// ─── authorizeBranchAccess ───────────────────────────────────────

describe('authorizeBranchAccess', () => {
  afterEach(() => unsetBranchKeys())

  it('allows key with matching branch via Authorization header', () => {
    setBranchKeys([
      { key: KEY_A, branches: ['branch-1', 'branch-2'] },
    ])
    const r = authorizeBranchAccess(`Bearer ${KEY_A}`, '', 'branch-1')
    expect(r.allowed).toBe(true)
  })

  it('allows key with matching branch via x-api-key header', () => {
    setBranchKeys([
      { key: KEY_A, branches: ['branch-1', 'branch-2'] },
    ])
    const r = authorizeBranchAccess('', KEY_A, 'branch-2')
    expect(r.allowed).toBe(true)
  })

  it('rejects cross-branch access (branch A cannot read branch B)', () => {
    setBranchKeys([
      { key: KEY_A, branches: ['branch-1'] },
    ])
    const r = authorizeBranchAccess('', KEY_A, 'branch-3')
    expect(r.allowed).toBe(false)
    expect(r.error).toContain('ditolak')
  })

  it('rejects unknown key', () => {
    setBranchKeys([
      { key: KEY_A, branches: ['branch-1'] },
    ])
    const r = authorizeBranchAccess('Bearer unknown', '', 'branch-1')
    expect(r.allowed).toBe(false)
  })

  it('admin key accesses any branch', () => {
    setBranchKeys([
      { key: KEY_ADMIN, branches: [], label: 'Admin' },
    ])
    expect(authorizeBranchAccess('', KEY_ADMIN, 'branch-1').allowed).toBe(true)
    expect(authorizeBranchAccess('', KEY_ADMIN, 'branch-999').allowed).toBe(true)
    expect(authorizeBranchAccess('', KEY_ADMIN, '').allowed).toBe(true)
  })

  it('no BRANCH_KEYS → all-access', () => {
    unsetBranchKeys()
    expect(authorizeBranchAccess('Bearer any', '', 'branch-1').allowed).toBe(true)
    expect(authorizeBranchAccess('Bearer any', '', null).allowed).toBe(true)
  })

  it('handles Bearer with various cases', () => {
    setBranchKeys([{ key: KEY_A, branches: ['b1'] }])
    expect(authorizeBranchAccess('BEARER ' + KEY_A, '', 'b1').allowed).toBe(true)
    expect(authorizeBranchAccess(KEY_A, '', 'b1').allowed).toBe(true)
  })
})
