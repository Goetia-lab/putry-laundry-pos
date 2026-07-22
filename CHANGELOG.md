# Changelog

## 0.2.2 — 2026-07-22

### Added
- **Filter tanggal di Rekap Utama**: card summary sekarang sesuai periode yang dipilih (Hari Ini / 7 Hari / 30 Hari / 90 Hari / custom range), sama seperti Laporan.

### Changed
- **Node.js engine**: `>=20.0.0 <21` → `>=24.0.0 <25` (match Vercel runtime, menghilangkan warning deprecation).

## 0.2.1 — 2026-07-22

### Fixed
- **401 "API key atau token tidak valid" on all mutations**: POST/PATCH/DELETE endpoints (create transaction, delete customer, etc.) were missing `Authorization` header — only GET queries sent the API key. Added shared `mutate()` helper that sends auth on every request.
- **TypeScript `unknown` errors** in `kasir-view.tsx` where `mutateAsync` return type wasn't cast.

## 0.2.0 — 2026-07-21

Initial production release.
