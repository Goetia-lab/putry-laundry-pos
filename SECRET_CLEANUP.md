# Secret History Cleanup Plan

## What Happened

Commit `6f5b366` included `.env.vercel` which contains `VERCEL_OIDC_TOKEN`.
It was already on `origin/main` (public repo) for several commits before being
untracked in commit `a9061e6`.

## Step 0: Rotate All Secrets First (BEFORE force push)

```bash
# 1. Vercel: create new OIDC token
#    Dashboard → Settings → Tokens → Create token → OIDC
# 2. Update .env.vercel locally with new values
# 3. Deploy with `npx vercel env pull` to sync
# 4. Revoke OLD Vercel OIDC token after push
```

**Secrets to rotate:**
- `VERCEL_OIDC_TOKEN` — **HIGH** Vercel deploy access
- `API_KEY` — **MEDIUM** API access
- `GAUTH_B64` — **MEDIUM** Google Sheets API
- `DATABASE_URL` — **LOW** (Supabase direct, would need password)
- `DIRECT_URL` — **LOW** (same as above)
- `NEXTAUTH_SECRET` — if used

## Step 1: Create Backup Branch

```bash
git checkout -b pre-cleanup-2026-07-21
git push origin pre-cleanup-2026-07-21
```

## Step 2: Remove .env.vercel from Git History

**Option A — BFG (faster):**
```bash
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
# On Linux/macOS:
brew install bfg  # or download jar directly

# Clone a fresh bare copy
git clone --mirror https://github.com/Goetia-lab/putry-laundry-pos.git putry-laundry-pos.git
cd putry-laundry-pos.git

# Delete .env.vercel from all commits
bfg --delete-files .env.vercel

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push back (FORCE PUSH)
git push origin --mirror
# WARNING: This rewrites history. All open PRs, branches, tags are affected.
```

**Option B — git filter-repo (more precise):**
```bash
pip install git-filter-repo

cd /tmp
git clone https://github.com/Goetia-lab/putry-laundry-pos.git
cd putry-laundry-pos
git filter-repo --path .env.vercel --invert-paths

# Force push
git remote add origin https://github.com/Goetia-lab/putry-laundry-pos.git
git push origin --force --all
```

## Step 3: Post-Cleanup Verification

```bash
# Verify file is gone from all commits
git log --all --full-history -- .env.vercel
# Should return NOTHING

# Verify head still works
git show HEAD:.gitignore | grep env.vercel
# Should show .env.vercel in .gitignore

# Verify build still passes
npm run build
```

## Step 4: Prevent Recurrence

### Pre-commit hook with secretlint (auto-setup)

```bash
# Already has .secretlintrc.yml — just activate the hook
npx secretlint --init

# Manual install:
npm install --save-dev @secretlint/secretlint-rule-preset-recommend
```

Configuration in `.secretlintrc.yml` already exists.

### GitHub secret scanning

Go to **Settings → Code security and analysis → Secret scanning** → Enable.
Push protection: **Enable for this repository** (prevents committing known patterns).

### Recommended `.gitattributes`

```gitattributes
.env* linguist-generated=true
```

## Verification Checklist

- [ ] `git log --all --full-history -- .env.vercel` → nothing
- [ ] No `VERCEL_OIDC_TOKEN` text in any commit
- [ ] `git rebase` of any open PRs completed
- [ ] All collaborators re-clone
- [ ] `.env.vercel` in `.gitignore`
- [ ] Pre-commit hook active
