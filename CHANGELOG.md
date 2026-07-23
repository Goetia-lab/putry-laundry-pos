# Changelog

## 0.2.3 — 2026-07-22

### Added
- **Tombol "Bagikan ke WA"** di receipt dialog kasir: abis transaksi berhasil, kasir bisa klik → otomatis buka WhatsApp dengan format struk rapi ke nomor pelanggan (zero backend, zero biaya).
- **Format struk cetak** baru: header `━━━ PUTRY LAUNDRY ━━━`, info invoice, pesanan per-item, TOTAL highlight, bayar/kembali, estimasi selesai, footer.

### Changed
- **Print CSS**: width 80mm→72mm, padding 4mm→3mm, font 11px→9px (muat thermal printer 58/72mm).
- **Tgl di struk**: pake `formatDateTime` (22 Jul 2026 14:30) biar ada jam.

### Fixed
- **Auth 401 mutations**: POST/PATCH/DELETE endpoints missing `Authorization` header — added shared `mutate()` helper.

## 0.2.2 — 2026-07-22

### Added
- **Filter tanggal di Rekap Utama**: card summary sesuai periode yang dipilih (Hari Ini / 7 Hari / 30 Hari / 90 Hari / custom range), sama seperti Laporan.

### Changed
- **Node.js engine**: `>=20.0.0 <21` → `>=24.0.0 <25` (match Vercel runtime, hilangkan deprecation warning).

## 0.2.1 — 2026-07-22

### Fixed
- **401 "API key atau token tidak valid" on mutations**: POST/PATCH/DELETE missing `Authorization` header — GET-only bug. Added shared `mutate()` helper.
- **TypeScript `unknown` errors** in `kasir-view.tsx` where `mutateAsync` return type wasn't cast.

## 0.2.0 — 2026-07-21

Initial production release.
