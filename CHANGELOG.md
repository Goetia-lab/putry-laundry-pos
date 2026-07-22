# Changelog

## 0.2.1 — 2026-07-22

### Fixed
- **401 "API key atau token tidak valid" on all mutations**: POST/PATCH/DELETE endpoints (create transaction, delete customer, etc.) were missing `Authorization` header — only GET queries sent the API key. Added shared `mutate()` helper that sends auth on every request.
- **TypeScript `unknown` errors** in `kasir-view.tsx` where `mutateAsync` return type wasn't cast.

## 0.2.0 — 2026-07-21

Initial production release.
