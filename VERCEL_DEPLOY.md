# 🚀 Panduan Deploy ke Vercel + Supabase (Super Komprehensif)

> **Untuk siapa?** Siapa pun yang ingin menjalankan aplikasi **Putry Laundry POS** ini sendiri — di akun kamu sendiri, gratis, tanpa perlu pengalaman deploy sebelumnya. Panduan ini dibuat step-by-step dari nol.

> **Berapa biayanya?** **$0** untuk mulai (Vercel Free + Supabase Free). Cukup untuk uji coba dan skala kecil. Lihat [section estimasi biaya](#-estimasi-biaya) untuk detail naik tier.

> **Berapa lama?** Sekitar **30–45 menit** untuk selesai dari awal sampai aplikasi online.

---

## 📑 Daftar Isi

0. [Apa yang akan kita bangun](#0-apa-yang-akan-kita-bangun)
1. [Prasyarat](#1-prasyarat)
2. [Fork & Clone Repo](#2-fork--clone-repo)
3. [Setup Database di Supabase](#3-setup-database-di-supabase)
4. [Ganti Prisma ke PostgreSQL](#4-ganti-prisma-ke-postgresql)
5. [Setup Environment Lokal](#5-setup-environment-lokal)
6. [Push Perubahan ke GitHub](#6-push-perubahan-ke-github)
7. [Deploy ke Vercel](#7-deploy-ke-vercel)
8. [Inisialisasi Data Production](#8-inisialisasi-data-production)
9. [Verifikasi & Test](#9-verifikasi--test)
10. [Modifikasi & Update](#10-modifikasi--update)
11. [Custom Domain (opsional)](#11-custom-domain-opsional)
12. [Troubleshooting](#12-troubleshooting)
13. [Estimasi Biaya](#-estimasi-biaya)

---

## 0. Apa yang akan kita bangun

Kita akan men-deploy aplikasi **Putry Laundry POS** (kasir laundry multi-cabang) ke arsitektur ini:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Browser user  │ ───▶ │   Vercel (host)  │ ───▶ │ Supabase (DB)   │
│                 │      │  Next.js app     │      │  PostgreSQL     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                              Serverless              Free 500MB
                              Free tier               Auto-backup
```

**Kenapa dua layanan?**
- **Vercel** = hosting aplikasi web (menjalankan kode Next.js). Gratis, cepat, auto-deploy dari GitHub.
- **Supabase** = database PostgreSQL. Vercel tidak punya database bawaan, jadi kita pakai Supabase untuk menyimpan data transaksi, pelanggan, cabang, dll.

> ⚠️ **Penting:** Aplikasi ini secara default pakai **SQLite** (file lokal) untuk development. Untuk production di Vercel, kita **wajib** ganti ke **PostgreSQL** karena Vercel (serverless) tidak punya filesystem permanen — file SQLite akan hilang tiap deploy.

---

## 1. Prasyarat

### Akun yang perlu dibuat (semua gratis)

| Layanan | URL | Untuk apa |
|---------|-----|-----------|
| **GitHub** | [github.com](https://github.com) | Menyimpan kode (Vercel baca dari sini) |
| **Vercel** | [vercel.com](https://vercel.com) | Hosting aplikasi Next.js |
| **Supabase** | [supabase.com](https://supabase.com) | Database PostgreSQL |

> 💡 Sign up Vercel & Supabase pakai akun GitHub kamu (lebih cepat, 1 klik).

### Tool yang perlu di-install di komputer

| Tool | Cara cek | Download |
|------|----------|----------|
| **Node.js 18+** | `node --version` | [nodejs.org](https://nodejs.org/) (pilih LTS) |
| **Git** | `git --version` | [git-scm.com](https://git-scm.com/) |

Buka **Terminal** (Mac/Linux) atau **Command Prompt / PowerShell** (Windows) untuk menjalankan perintah di panduan ini.

> 🪟 **Windows:** disarankan pakai [Git Bash](https://git-scm.com/downloads) (sudah termasuk saat install Git) supaya semua perintah di panduan ini jalan persis sama.

---

## 2. Fork & Clone Repo

### 2.1 Fork repo ke akun kamu

1. Buka repo: **https://github.com/Goetia-lab/putry-laundry-pos-v2**
2. Klik tombol **Fork** di pojok kanan atas
3. Pada dialog, biarkan default (Owner = akun kamu) → klik **Create fork**

Sekarang kamu punya **copy repo sendiri** di `https://github.com/[USERNAME-KAMU]/putry-laundry-pos-v2`.

> 💡 **Kenapa fork?** Supaya kamu bebas modifikasi tanpa minta izin ke pemilik repo asli. Perubahan kamu tidak mengganggu repo original.

### 2.2 Clone ke komputer

```bash
# Ganti USERNAME-KAMU dengan username GitHub kamu
git clone https://github.com/USERNAME-KAMU/putry-laundry-pos-v2.git
cd putry-laundry-pos-v2
```

### 2.3 Install dependencies

```bash
npm install
```

> Tunggu 2–5 menit. Akan muncul banyak teks — itu normal. Di akhir akan ada pesan `Prisma Client generated` dari postinstall hook.

---

## 3. Setup Database di Supabase

### 3.1 Buat project Supabase baru

1. Login ke [supabase.com](https://supabase.com) → klik **New project**
2. Isi form:
   - **Name:** `putry-laundry` (atau nama apa pun)
   - **Database Password:** buat password kuat (campuran huruf, angka, simbol)
     - ⚠️ **SIMPAN PASSWORD INI!** Supabase **tidak akan** menampilkan lagi. Catat di tempat aman (password manager / notes).
   - **Region:** `Southeast Asia (Singapore)` — terdekat dengan Indonesia, paling cepat
   - **Pricing Plan:** `Free`
3. Klik **Create new project** → tunggu **±2 menit** sampai status jadi "Ready"

### 3.2 Ambil connection string

Setelah project ready:

1. Di sidebar kiri Supabase Dashboard → klik **Project Settings** (⚙️ icon)
2. Klik **Database**
3. Scroll ke section **Connection string** → pastikan di tab **URI**
4. Ada **2 URL** yang perlu kamu copy:

#### URL 1 — Transaction pooler (untuk `DATABASE_URL`)

```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-southeast-1.pooler.supabase.com:6543/postgres
```

> Ciri-ciri: ada **`:6543`** dan ada kata **`pooler`** di hostname.

#### URL 2 — Session pooler (untuk `DIRECT_URL`)

```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-southeast-1.supabase.com:5432/postgres
```

> Ciri-ciri: ada **`:5432`** dan **tidak ada** kata `pooler`.

**Catat kedua URL ini** — kita akan pakai di step 5 dan 7.

> ⚠️ Pastikan kamu sudah ganti `[YOUR-PASSWORD]` dengan password yang kamu buat di step 3.1. Jangan biarkan literal `[YOUR-PASSWORD]`.

### 3.3 Kenapa butuh dua URL?

| URL | Port | Dipakai untuk |
|-----|------|---------------|
| `DATABASE_URL` (Transaction pooler) | 6543 | **Runtime aplikasi** — Vercel handle ribuan koneksi lewat pool |
| `DIRECT_URL` (Session pooler) | 5432 | **Migrasi/schema** — Prisma butuh koneksi langsung untuk `db push` |

Kalau tertukar atau hanya pakai satu, migrasi akan error. Lihat [Troubleshooting](#12-troubleshooting).

---

## 4. Ganti Prisma ke PostgreSQL

Aplikasi default pakai SQLite. Kita ganti ke PostgreSQL agar cocok dengan Supabase.

### 4.1 Backup schema SQLite (opsional tapi disarankan)

```bash
# Simpan schema SQLite asli ke nama lain, kalau-kalau mau balik
cp prisma/schema.prisma prisma/schema.sqlite.prisma.bak
```

### 4.2 Timpa dengan schema PostgreSQL

Repo sudah menyediakan `prisma/schema.postgres.prisma` (versi PostgreSQL). Tinggal timpa:

```bash
# Linux / Mac / Git Bash (Windows)
cp prisma/schema.postgres.prisma prisma/schema.prisma
```

> 🪟 **Windows (Command Prompt/PowerShell — bukan Git Bash):**
> ```cmd
> copy prisma\schema.postgres.prisma prisma\schema.prisma
> ```

### 4.3 Verifikasi

Buka `prisma/schema.prisma`. Bagian atas harusnya seperti ini:

```prisma
datasource db {
  provider  = "postgresql"        ← harus postgresql, BUKAN sqlite
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   ← baris ini harus ada
}
```

> 💡 **Apa bedanya?** Hanya 3 baris di atas. Model data (`Branch`, `Service`, dll) isinya sama persis — Prisma otomatis translate tipe data SQLite → PostgreSQL.

---

## 5. Setup Environment Lokal

### 5.1 Buat file `.env`

```bash
cp .env.example .env
```

### 5.2 Isi `.env` dengan connection string Supabase

Buka file `.env` di editor (VS Code, Notepad, dll). Ganti bagian production (yang dikomentari `#`) menjadi aktif:

```env
# ── HAPUS baris SQLite ini ──
# DATABASE_URL="file:./db/custom.db"

# ── AKTIFKAN baris PostgreSQL ini (isi pakai URL dari Supabase step 3.2) ──
DATABASE_URL="postgresql://postgres.abc123:PASSWORD_KAMU@aws-0-southeast-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.abc123:PASSWORD_KAMU@aws-0-southeast-1.supabase.com:5432/postgres"
```

> ⚠️ **Penting:**
> - Hapus/tanda `#` di depan `DATABASE_URL` dan `DIRECT_URL` PostgreSQL
> - Tambah `#` di depan `DATABASE_URL` SQLite
> - Ganti `PASSWORD_KAMU` dengan password asli kamu
> - Jangan pakai spasi di dalam quote

### 5.3 Test koneksi lokal

```bash
# Generate ulang Prisma Client untuk PostgreSQL
npx prisma generate

# Push schema ke Supabase (ini akan membuat semua tabel di database)
npx prisma db push
```

Kalau sukses, output akhir:

```
🚀  Your database is now in sync with your Prisma schema. Done in X.Xs
```

> ✅ **Cek di Supabase:** Dashboard → **Table Editor** → harus muncul tabel `Branch`, `Service`, `Customer`, `Transaction`, dll (total 9 tabel).

### 5.4 Seed data awal (2 cabang + 22 layanan)

```bash
npx tsx prisma/seed.ts
```

Output sukses:

```
✓ Branches synced: A, B
✓ Services: 22 created, 0 updated (total 22)
```

> 💡 **Script seed ini idempotent** — aman dijalankan berkali-kali. Kalau di-run lagi, akan tampil "0 created, 22 updated" (tidak error duplicate).

---

## 6. Push Perubahan ke GitHub

Commit perubahan `.env` TIDAK akan di-push (sudah di-ignore), tapi perubahan `schema.prisma` perlu di-push agar Vercel baca versi PostgreSQL.

```bash
# Lihat apa yang berubah
git status

# Stage perubahan
git add prisma/schema.prisma prisma/schema.sqlite.prisma.bak

# Commit
git commit -m "Switch Prisma schema to PostgreSQL for Vercel+Supabase deployment"

# Push ke GitHub
git push origin main
```

> ⚠️ **Cek:** Pastikan `.env` **TIDAK** muncul di `git status` (sudah di-gitignore). File `.env` berisi password database kamu — tidak boleh masuk GitHub.

---

## 7. Deploy ke Vercel

### 7.1 Import project ke Vercel

1. Buka [vercel.com](https://vercel.com) → login pakai akun GitHub
2. Klik **Add New...** → **Project**
3. Di bagian "Import Git Repository", cari repo `putry-laundry-pos-v2` kamu
4. Klik **Import**

### 7.2 Konfigurasi Build

Di halaman import, Vercel otomatis deteksi ini proyek Next.js. Sebagian besar biarkan default, tapi cek:

| Field | Nilai |
|-------|-------|
| **Framework Preset** | `Next.js` (otomatis) |
| **Build Command** | Biarkan default (Vercel baca `vercel.json` → `prisma generate && next build`) |
| **Output Directory** | Biarkan default (`.next`) |
| **Install Command** | `npm install` (default) |

> 💡 Kalau Vercel tanya "Override Build Command?" → pilih **No / use default**. File `vercel.json` sudah handle ini.

### 7.3 Set Environment Variables ⚠️ PENTING

Scroll ke section **Environment Variables**. Tambahkan **4 variabel** berikut (klik **Add** untuk setiap baris baru):

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | `postgresql://postgres.abc123:PASSWORD@...pooler.supabase.com:6543/postgres` | Production, Preview, Development |
| `DIRECT_URL` | `postgresql://postgres.abc123:PASSWORD@...supabase.com:5432/postgres` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | *(klik Generate, atau jalankan `openssl rand -base64 32`)* | Production |
| `NEXTAUTH_URL` | *(kosongkan dulu, isi setelah deploy punya URL — lihat step 9)* | Production |

> ⚠️ **Pastikan** value `DATABASE_URL` dan `DIRECT_URL` **persis sama** dengan yang ada di `.env` lokal kamu. Tidak boleh ada typo atau spasi.

### 7.4 Deploy!

1. Klik tombol **Deploy** (biru, besar)
2. Tunggu **±3–5 menit** untuk build pertama
3. Saat build berjalan, akan muncul log real-time. Tunggu sampai muncul:
   ```
   ✅ Ready (Deployment complete)
   ```
4. Klik **Visit** untuk buka aplikasi online — URL format: `https://putry-laundry-pos-v2-[hash]-[username].vercel.app`

> 🎉 **Selamat!** App kamu sudah online. Tapi mungkin masih kosong (no data) — itu normal. Kita isi di step 8.

---

## 8. Inisialisasi Data Production

> **Kenapa perlu?** Vercel hanya menjalankan kode aplikasi, tidak menjalankan migrasi/seed otomatis. Kita jalankan dari komputer lokal, menarget database Supabase yang sama yang dipakai Vercel.

Database Supabase-nya sudah berisi tabel (dari `prisma db push` di step 5.3) dan sudah ter-seed (step 5.4). **Jadi kalau kamu sudah jalankan step 5, data production sudah siap** dan bagian ini bisa di-skip.

> 💡 **Intinya:** Supabase itu **shared database**. Yang dipakai lokal (saat dev) dan yang dipakai Vercel (production) **database yang sama**. Data yang kamu seed lokal otomatis muncul di production.

### Kalau perlu re-seed / tambah data baru

```bash
# Pastikan .env lokal masih menunjuk ke Supabase (DATABASE_URL pooler)
npx prisma db push      # sync schema (kalau ada perubahan)
npx tsx prisma/seed.ts  # seed/refresh data cabang + pricelist
```

---

## 9. Verifikasi & Test

### 9.1 Update NEXTAUTH_URL

Sekarang app sudah punya URL. Update env var di Vercel:

1. Vercel Dashboard → pilih project kamu → tab **Settings**
2. Sidebar → **Environment Variables**
3. Edit `NEXTAUTH_URL` → isi dengan URL Vercel kamu:
   ```
   https://putry-laundry-pos-v2-[hash]-[username].vercel.app
   ```
4. Save → Vercel auto-redeploy

### 9.2 Test aplikasi

1. Buka URL Vercel di browser
2. **Dashboard** harus muncul dengan:
   - Stat cards (pendapatan, pengeluaran, laba)
   - **Cabang A** dan **Cabang B** terdaftar
   - Pricelist 22 layanan
3. Test klik menu **Kasir** → coba buat 1 transaksi
4. Cek di Supabase Dashboard → **Table Editor** → tabel `Transaction` → data tersimpan

> ✅ Kalau semua jalan, **deploy sukses total!** 🎉

---

## 10. Modifikasi & Update

### 10.1 Ganti pricelist / tambah cabang

**Cara mudah (pakai UI aplikasi):**
1. Buka app → menu **Cabang** atau **Pricelist**
2. Tambah/edit langsung di UI → data tersimpan ke Supabase

**Cara via kode (edit `prisma/seed.ts`):**
1. Edit file `prisma/seed.ts` → tambah/ubah layanan di array `services`
2. Jalankan `npx tsx prisma/seed.ts` → data di Supabase ter-update
3. Commit & push: `git add . && git commit -m "Update pricelist" && git push`

### 10.2 Edit kode & auto-deploy

Setiap kamu `git push` ke branch `main`:
1. Vercel **otomatis** trigger deploy baru
2. Build ulang + publish dalam 2–3 menit
3. URL tetap sama (continuous deployment)

```bash
git add .
git commit -m "Fitur baru: bla bla"
git push origin main
```

> 💡 Cek status deploy di Vercel Dashboard → tab **Deployments**.

### 10.3 Edit kode lokal & test sebelum push

```bash
npm run dev      # jalan di http://localhost:3000
# ... edit kode ...
# test di browser ...
# kalau sudah yakin, baru git push
```

---

## 11. Custom Domain (opsional)

Punya domain sendiri (mis. `pos.putrylaundry.com`)? Bisa dipasang:

1. Vercel Dashboard → project → **Settings** → **Domains**
2. Ketik domain kamu → klik **Add**
3. Vercel kasih instruksi DNS:
   - Tambah **A record** atau **CNAME record** di registrar domain kamu (Niagahoster, Namecheap, Cloudflare, dll)
4. Tunggu propagasi DNS (5 menit – 24 jam)
5. Vercel auto-issue **SSL certificate** (https) gratis

Update `NEXTAUTH_URL` di Vercel env vars ke domain baru.

---

## 12. Troubleshooting

### Build error di Vercel

| Error | Solusi |
|-------|--------|
| `Cannot find module '@prisma/client'` | Pastikan `postinstall: "prisma generate"` ada di package.json (sudah ada). Tambah env var `PRISMA_GENERATE_DATAPROXY=true` kalau masih error. |
| `Error: Prisma Client did not initialize yet` | Tambah env var di Vercel: `DATABASE_URL` (pakai pooler URL). Pastikan sudah di-set sebelum build pertama. |
| `cp: cannot create directory` | Build command pakai script lama. Pastikan `vercel.json` ada di root dan berisi `"buildCommand": "prisma generate && next build"`. |
| Build timeout (>45 detik) | Free tier Vercel: build max 45 detik. Kalau sering timeout, kurangi dependencies atau upgrade ke Pro. |

### Runtime error

| Error | Solusi |
|-------|--------|
| `PrismaClientInitializationError` | Cek `DATABASE_URL` benar & Supabase project aktif (tidak paused). |
| `Can't reach database server` | Region Supabase & Vercel beda jauh → pilih `Singapore` di keduanya. Atau Supabase project auto-paused (free tier idle 1 minggu) → unpause di dashboard. |
| `relation "Transaction" does not exist` | Schema belum di-push ke Supabase. Jalankan `npx prisma db push` lokal (pastikan `.env` menunjuk Supabase). |
| `FATAL: password authentication failed` | Password di connection string salah. Re-check step 3.2. |
| `remaining connection slots are reserved` | Pakai Transaction pooler (port 6543) untuk `DATABASE_URL`, BUKAN direct connection. |

### Migration error

| Error | Solusi |
|-------|--------|
| `shadow database error` | Set `DIRECT_URL` env var (Session pooler, port 5432) — Prisma butuh direct connection untuk migrasi. |
| `Migration failed to apply` | Jalankan `npx prisma migrate reset` (⚠️ **HAPUS SEMUA DATA** — hati-hati) lalu `npx prisma db push` ulang. |

### App blank / data kosong

| Gejala | Solusi |
|--------|--------|
| Halaman putih / loading terus | Buka browser DevTools (F12) → Console → cek error. Biasanya env var belum diset atau NEXTAUTH_URL salah. |
| Dashboard muncul tapi kosong | Data belum di-seed. Jalankan `npx tsx prisma/seed.ts` lokal (dengan `.env` menunjuk Supabase). |
| Cold start lambat (5–10 detik) | Normal untuk Vercel free tier. Solusi: upgrade Vercel Pro, atau pakai [UptimeRobot](https://uptimerobot.com) ping tiap 5 menit untuk hindari sleep. |

### Supabase project paused

Free tier Supabase akan **auto-pause** project yang idle > 1 minggu.

**Cara unpause:**
1. Supabase Dashboard → buka project
2. Klik **Restore project** → tunggu ±2 menit
3. Data tetap utuh (tidak hilang)

**Cegah pause:** pakai project minimal 1x seminggu (cukup buka app Vercel).

---

## 📊 Estimasi Biaya

### Free tier (cukup untuk mulai & skala kecil)

| Layanan | Free | Limit |
|---------|------|-------|
| **Vercel** (Hobby) | $0 | 100GB bandwidth/bln, build 45 detik, cold start ~5-10 detik |
| **Supabase** (Free) | $0 | 500MB database, 2GB bandwidth, **pause jika idle 1 minggu** |
| **Domain** | $0 | Pakai subdomain Vercel (`*.vercel.app`) |
| **Total** | **$0/bln** | |

### Production (serius, no sleep, custom domain)

| Layanan | Biaya | Dapat |
|---------|-------|-------|
| **Vercel** Pro | $20/bln | No cold start, 1TB bandwidth, build 45 menit |
| **Supabase** Pro | $25/bln | 8GB database, 250GB bandwidth, no auto-pause, daily backup |
| **Domain** | ~$10-15/tahun | `.com` / `.id` domain sendiri |
| **Total** | **~$47/bln** | |

### Tips hemat
- **Awal:** mulai free, upgrade kalau traffic meningkat.
- **Database:** 500MB Supabase cukup untuk **ribuan transaksi** (data laundry relatif kecil).
- **Bandwidth:** 100GB Vercel = ~50.000 page view/bln. Cukup untuk laundry 2-5 cabang.

---

## 🆘 Masih bingung?

1. Cek **[Troubleshooting](#12-troubleshooting)** di atas
2. Buka browser **DevTools** (F12) → tab **Console** untuk error frontend
3. Cek **Vercel logs:** Dashboard → project → tab **Logs** (real-time) atau **Deployments** → klik deployment → **Build Logs**
4. Cek **Supabase logs:** Dashboard → **Logs** (SQL query logs)

Selamat mencoba! Kalau deploy berhasil, tinggal buka URL Vercel dan mulai pakai aplikasi kasir laundry-nya. 🧺✨

---

> 📖 **Panduan lain:** untuk deploy ke **Render + Supabase** (alternatif Vercel), baca [DEPLOYMENT.md](./DEPLOYMENT.md).
