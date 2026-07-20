# 🚀 Cara Push ke GitHub

## Step 1: Buat Repo di GitHub

1. Buka [github.com/new](https://github.com/new)
2. Isi:
   - **Repository name**: `putry-laundry-pos`
   - **Description**: `POS Laundry Multi-Cabang dengan Loyalitas, Tutup Buku, & Rekap Utama`
   - **Visibility**: Private (rekomendasi) atau Public
   - **Jangan centang** "Add a README" (sudah ada)
   - **Jangan centang** "Add .gitignore" (sudah ada)
3. Klik **Create repository**

## Step 2: Connect & Push

Copy URL repo GitHub kamu (misal `https://github.com/username/putry-laundry-pos.git`), lalu jalankan:

```bash
cd /home/z/my-project

# Tambah remote (ganti USERNAME dengan username GitHub kamu)
git remote add origin https://github.com/USERNAME/putry-laundry-pos.git

# Rename branch ke main (kalau belum)
git branch -M main

# Push!
git push -u origin main
```

## Step 3: Clone di Komputer Lain

```bash
git clone https://github.com/USERNAME/putry-laundry-pos.git
cd putry-laundry-pos

# Auto-setup
chmod +x setup.sh
./setup.sh

# Jalankan dev server
bun run dev  # atau npm run dev
```

Buka http://localhost:3000 — selesai! 🎉

---

## Kalau Mau Pakai GitHub CLI

Kalau `gh` CLI sudah terinstall:

```bash
# Install gh (kalau belum)
# macOS: brew install gh
# Linux: https://github.com/cli/cli#installation

# Login
gh auth login

# Buat repo & push sekalian
cd /home/z/my-project
gh repo create putry-laundry-pos --public --source=. --remote=origin --push

# Atau private:
gh repo create putry-laundry-pos --private --source=. --remote=origin --push
```

---

## Yang Sudah Disiapkan di Repo

✅ **README.md** — dokumentasi lengkap fitur, setup, deployment
✅ **setup.sh** — auto-setup script (install + generate + seed)
✅ **DEPLOYMENT.md** — panduan deploy ke Supabase + Render
✅ **Dockerfile** — untuk Docker deployment
✅ **render.yaml** — Render Blueprint untuk auto-deploy
✅ **.env.example** — template environment variables
✅ **prisma/schema.postgres.prisma** — schema PostgreSQL untuk production
✅ **prisma/schema.prisma** — schema SQLite untuk development
✅ **prisma/seed.ts** — seed 2 cabang + 22 layanan pricelist
✅ **.gitignore** — exclude .env, db, node_modules, build output

## Yang Tidak Dimasukkan (Aman)

❌ `.env` — file environment lokal (rahasia)
❌ `db/custom.db` — database SQLite lokal
❌ `node_modules/` — dependencies (di-install via setup.sh)
❌ `.next/` — build output
❌ `upload/` — file upload user
