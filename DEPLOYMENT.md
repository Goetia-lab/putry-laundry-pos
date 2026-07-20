# 🚀 Panduan Deployment: Putry Laundry POS

Panduan lengkap untuk host aplikasi sendiri menggunakan **Supabase** (database PostgreSQL) + **Render** (hosting Next.js).

---

## 📋 Prasyarat

1. **GitHub account** — code akan di-push ke repo GitHub
2. **Supabase account** (gratis) — untuk database PostgreSQL
3. **Render account** (gratis) — untuk hosting aplikasi

---

## 1️⃣ Setup Database di Supabase

### Step 1: Buat Project Supabase
1. Buka [supabase.com](https://supabase.com) → Sign up / Login
2. Klik **New Project**
3. Isi:
   - **Name**: `putry-laundry`
   - **Database Password**: buat password kuat, **simpan baik-baik** (tidak bisa dilihat lagi)
   - **Region**: `Southeast Asia (Singapore)` — terdekat dengan Indonesia
   - **Plan**: Free
4. Tunggu ~2 menit sampai project ready

### Step 2: Dapat Connection String
1. Masuk project → **Settings** (⚙️) → **Database**
2. Scroll ke **Connection string** → pilih **URI** tab
3. Copy **Transaction pooler** URL (untuk DATABASE_URL):
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-southeast-1.pooler.supabase.com:6543/postgres
   ```
4. Copy **Session pooler / Direct connection** URL (untuk DIRECT_URL):
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-southeast-1.supabase.com:5432/postgres
   ```
   > Ganti `[password]` dengan password yang kamu buat di Step 1

### Step 3: Ganti Prisma Schema ke PostgreSQL
Di project kamu, replace `prisma/schema.prisma` dengan isi dari `prisma/schema.postgres.prisma`:

```bash
# Di local project
cp prisma/schema.postgres.prisma prisma/schema.prisma
```

Atau manual edit `prisma/schema.prisma`, ganti bagian `datasource db`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Step 4: Test Koneksi Lokal
```bash
# Set environment variables
export DATABASE_URL="postgresql://postgres.xxx:password@aws-0-southeast-1.pooler.supabase.com:6543/postgres"
export DIRECT_URL="postgresql://postgres.xxx:password@aws-0-southeast-1.supabase.com:5432/postgres"

# Generate Prisma Client
npx prisma generate

# Push schema ke Supabase (buat tabel)
npx prisma db push

# Seed data cabang & pricelist
bun prisma/seed.ts
```

✅ Cek di Supabase Dashboard → **Table Editor** → tabel `Branch`, `Service`, dll sudah terisi.

---

## 2️⃣ Push Code ke GitHub

```bash
# Init git (kalau belum)
git init
git add .
git commit -m "Putry Laundry POS - ready to deploy"

# Buat repo di GitHub, lalu:
git remote add origin https://github.com/USERNAME/putry-laundry-pos.git
git branch -M main
git push -u origin main
```

---

## 3️⃣ Deploy ke Render

### Step 1: Buat Web Service di Render
1. Buka [render.com](https://render.com) → Sign up dengan GitHub
2. Klik **New +** → **Web Service**
3. Connect repository GitHub kamu (`putry-laundry-pos`)
4. Isi konfigurasi:
   - **Name**: `putry-laundry-pos`
   - **Runtime**: `Node`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Root Directory**: (kosongkan)
   - **Build Command**:
     ```
     npm install && npx prisma generate && npm run build:prod
     ```
   - **Start Command**:
     ```
     npm run start:prod
     ```
   - **Instance Type**: `Free` (cukup untuk mulai) atau `Starter` ($7/bulan, no sleep)

### Step 2: Set Environment Variables
Scroll ke **Environment** tab, tambah:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://postgres.xxx:password@...pooler.supabase.com:6543/postgres` |
| `DIRECT_URL` | `postgresql://postgres.xxx:password@...supabase.com:5432/postgres` |
| `NODE_ENV` | `production` |
| `NEXTAUTH_SECRET` | (klik Generate, atau jalankan `openssl rand -base64 32` di terminal) |
| `NEXTAUTH_URL` | `https://putry-laundry-pos.onrender.com` (isi setelah dapat URL Render) |

### Step 3: Deploy!
1. Klik **Create Web Service**
2. Tunggu build selesai (~3-5 menit pertama kali)
3. Setelah deploy, Render kasih URL: `https://putry-laundry-pos.onrender.com`
4. Update `NEXTAUTH_URL` di Environment Variables dengan URL tersebut

### Step 4: Run Migration di Production
Buka **Shell** tab di Render (atau pakai Render CLI):
```bash
npx prisma migrate deploy
# atau kalau belum ada migration files:
npx prisma db push
```

Untuk seed data, jalankan:
```bash
bun prisma/seed.ts
# atau kalau tidak ada bun:
npx tsx prisma/seed.ts
```

---

## 4️⃣ Verifikasi

1. Buka URL Render (`https://putry-laundry-pos.onrender.com`)
2. Cek Dashboard muncul dengan data cabang & pricelist
3. Test buat transaksi di Kasir
4. Cek data tersimpan di Supabase Dashboard → **Table Editor**

---

## 🔧 Alternatif: Render Blueprint (Auto-Setup)

Kalau mau setup cepat, pakai `render.yaml` yang sudah disediakan:

1. Push code + file `render.yaml` ke GitHub
2. Buka [render.com/blueprints](https://render.com/blueprints)
3. Klik **New Blueprint Instance**
4. Pilih repo kamu → Render akan auto-read `render.yaml`
5. Isi env vars yang `sync: false` (DATABASE_URL, DIRECT_URL, NEXTAUTH_URL)
6. Klik **Apply** → Render auto-setup semua

---

## 💡 Tips Penting

### Database Connection
- **DATABASE_URL** = Transaction pooler (port 6543) — untuk app runtime (connection pooling)
- **DIRECT_URL** = Direct connection (port 5432) — untuk migration (Prisma butuh direct)
- Jangan tertukar! Kalau migration error, cek DIRECT_URL benar.

### Free Tier Limitations
- **Render Free**: app "sleep" setelah 15 menit idle, cold start ~30 detik. Untuk production serius, pakai **Starter** ($7/bulan).
- **Supabase Free**: 500MB database, 2GB bandwidth. Cukup untuk awal.

### Backup Data
```bash
# Export database dari Supabase
pg_dump "postgresql://..." -F c -f backup.dump

# Restore
pg_restore -d "postgresql://..." backup.dump
```

### Custom Domain
1. Render Dashboard → Settings → Custom Domains
2. Tambah domain kamu (misal `pos.putrylaundry.com`)
3. Setup DNS CNAME record ke URL Render
4. Update `NEXTAUTH_URL` ke domain baru

---

## 🆘 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Build error: `Cannot find module '@prisma/client'` | Tambah `postinstall: "prisma generate"` di package.json (sudah ada) |
| Runtime error: `PrismaClientInitializationError` | Cek DATABASE_URL benar & Supabase project aktif |
| Migration error: `shadow database` | Tambah DIRECT_URL env var |
| App sleep (Render free) | Upgrade ke Starter, atau pakai [UptimeRobot](https://uptimerobot.com) untuk ping tiap 5 menit |
| Port error | Render auto-set PORT env, app sudah baca via `process.env.PORT` |

---

## 📊 Estimasi Biaya

| Layanan | Free Tier | Production |
|---------|-----------|------------|
| **Supabase** | 500MB DB, 2GB bandwidth | $25/bulan (8GB, 250GB BW) |
| **Render** | Free (sleep) | $7/bulan (Starter, no sleep) |
| **Domain** | - | ~$10-15/tahun |
| **Total awal** | **$0** | **~$32/bulan** |

---

Selamat mencoba! Kalau ada error, cek log di Render Dashboard → **Logs** tab. 🎉
