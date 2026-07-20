# 🧺 Putry Laundry POS

Sistem Point of Sale (POS) untuk bisnis laundry multi-cabang dengan fitur lengkap: kasir, manajemen transaksi, tutup buku harian, rekap utama, laporan analitik, program loyalitas pelanggan, dan estimasi tanggal selesai.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-6-indigo) ![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

---

## ✨ Fitur Utama

### 💰 Kasir (POS)
- Katalog layanan dengan kategori (Jasa, Sepatu, Gorden, Selimut, Bed Cover, Lain-lain)
- Varian Reguler (2-3 hari) & Express (24 jam)
- Keranjang interaktif dengan kontrol qty
- Checkout dengan kalkulasi kembalian
- Auto-generate nomor invoice (INV-A-20260720-001)

### 🏢 Multi-Cabang
- 2 cabang (Cabang A & Cabang B sebagai Pusat)
- Biaya operasional per cabang
- Dana operasional harian disisihkan otomatis

### 🔒 Tutup Buku Harian
- Closing kas per cabang setiap hari (jam 20.00 WIB)
- Laba bersih masuk ke rekap utama
- Dana operasional otomatis disisihkan untuk besok
- Contoh: Cabang A laba Rp250.000 → masuk rekap utama Rp250.000 + sisihkan Rp50.000 untuk operasional besok

### 📊 Rekap Utama
- Gabungan kas dari semua cabang
- Riwayat rekap harian dengan rincian per cabang
- Net masuk kas utama = total laba - dana operasional

### 👥 Pelanggan & Loyalitas
- Database pelanggan dengan auto-save dari checkout
- **4 Tier Loyalitas**: Bronze 🥉 (0%), Silver 🥈 (5%), Gold 🥇 (10%), Platinum 💎 (15%)
- Diskon otomatis di checkout berdasarkan tier
- Progress bar ke tier berikutnya
- Customer picker dengan search di Kasir

### 📋 Transaksi
- Riwayat transaksi dengan filter (cabang, status, search)
- Quick status: PROSES → SELESAI → DIAMBIL
- **Estimasi tanggal selesai** (Reguler +3 hari, Express +1 hari)
- Badge diskon loyalty
- Struk cetak (print-ready)
- WhatsApp & tel: link untuk kontak pelanggan

### 📈 Laporan & Analitik
- Tren pendapatan 7/30/90 hari
- Penjualan per cabang, kategori, layanan
- **Analitik Diskon Loyalty** (total diskon, transaksi diskon, rata-rata)
- Export CSV untuk Excel/Google Sheets

### 📱 Dashboard Operasional
- Stat cards real-time (pendapatan, pengeluaran, laba)
- **Alert "Siap Diambil"** (order selesai, tinggal diambil)
- **Alert "Sedang Diproses"** (order dalam pencucian)
- Transaksi terbaru hari ini
- Tombol WhatsApp/Telepon untuk notifikasi pelanggan
- Chart tren 7 hari + perbandingan cabang

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (New York) |
| **Database** | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| **State** | Zustand (client) + TanStack Query (server) |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Auth** | NextAuth.js v4 (siap pakai) |
| **Notifications** | Sonner (toast) |

---

## 🚀 Quick Start (Lokal)

### Prasyarat
- [Node.js](https://nodejs.org/) 18+ atau [Bun](https://bun.sh/)
- Git

### Cara 1: Pakai Setup Script (Rekomendasi)

```bash
# Clone repo
git clone https://github.com/USERNAME/putry-laundry-pos.git
cd putry-laundry-pos

# Jalankan setup script
chmod +x setup.sh
./setup.sh
```

Script akan otomatis:
1. Install dependencies (`bun install` atau `npm install`)
2. Generate Prisma Client
3. Push schema ke database SQLite
4. Seed data (2 cabang + 22 layanan pricelist)
5. Start dev server di port 3000

### Cara 2: Manual

```bash
# Clone
git clone https://github.com/USERNAME/putry-laundry-pos.git
cd putry-laundry-pos

# Install dependencies
bun install  # atau npm install

# Setup database
cp .env.example .env
npx prisma generate
npx prisma db push
bun prisma/seed.ts  # seed 2 cabang + 22 layanan

# Jalankan dev server
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📦 Deployment

Ada **2 opsi** hosting, keduanya gratis untuk mulai (pakai Supabase untuk database):

### 🟢 Opsi 1: Vercel + Supabase (Recommended — paling mudah)
Panduan super komprehensif step-by-step untuk pemula:
📄 **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)**

Cepat: Vercel import dari GitHub → auto-deploy → URL online dalam 5 menit.

### 🟡 Opsi 2: Render + Supabase
Panduan lengkap alternatif (pakai Docker/standalone server):
📄 **[DEPLOYMENT.md](./DEPLOYMENT.md)**

Ringkasannya (berlaku kedua opsi):
1. Buat project Supabase → dapat connection string PostgreSQL
2. Ganti `prisma/schema.prisma` dengan versi postgres: `cp prisma/schema.postgres.prisma prisma/schema.prisma`
3. Push code ke GitHub
4. Connect repo di Vercel/Render → set env vars (`DATABASE_URL`, `DIRECT_URL`) → deploy

---

## 📁 Struktur Project

```
putry-laundry-pos/
├── prisma/
│   ├── schema.prisma              # Schema SQLite (dev)
│   ├── schema.postgres.prisma     # Schema PostgreSQL (prod)
│   └── seed.ts                    # Seed 2 cabang + 22 layanan
├── src/
│   ├── app/
│   │   ├── api/                   # API Routes
│   │   │   ├── branches/          # CRUD cabang
│   │   │   ├── services/          # CRUD layanan
│   │   │   ├── transactions/      # CRUD transaksi
│   │   │   ├── customers/         # CRUD pelanggan
│   │   │   ├── expenses/          # CRUD pengeluaran
│   │   │   ├── daily-closing/     # Tutup buku harian
│   │   │   ├── recap/             # Rekap utama
│   │   │   ├── dashboard/         # Dashboard stats
│   │   │   └── reports/           # Laporan + export CSV
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main page (single-page app)
│   ├── components/
│   │   ├── layout/                # Sidebar, app shell
│   │   ├── views/                 # 9 views (dashboard, kasir, dll)
│   │   ├── shared/                # Reusable UI (StatCard, EmptyState)
│   │   └── ui/                    # shadcn/ui components
│   └── lib/
│       ├── api.ts                 # API hooks (TanStack Query)
│       ├── db.ts                  # Prisma client
│       ├── format.ts              # Helpers (currency, date, loyalty tiers)
│       ├── stores.ts              # Zustand stores (cart, nav)
│       └── utils.ts               # cn() utility
├── DEPLOYMENT.md                  # Panduan deploy Supabase + Render
├── setup.sh                       # Auto-setup script
├── render.yaml                    # Render Blueprint
├── Dockerfile                     # Docker deployment
└── .env.example                   # Template env vars
```

---

## 🗃️ Database Schema

| Model | Deskripsi |
|-------|-----------|
| `Branch` | Cabang (A, B) dengan dana operasional |
| `Service` | Layanan laundry (22 item dari pricelist) |
| `Customer` | Pelanggan dengan stats totalSpent |
| `Transaction` | Transaksi dengan subtotal, discount, total |
| `TransactionItem` | Item per transaksi |
| `OperationalExpense` | Pengeluaran operasional per cabang |
| `DailyClosing` | Tutup buku harian per cabang |
| `MainRecap` | Rekap utama gabungan |
| `MainRecapEntry` | Entry rekap per cabang |

---

## 🎨 Pricelist (Seed Data)

| Kategori | Layanan | Reguler | Express |
|----------|---------|---------|---------|
| Jasa | Cuci Kering | Rp5.000/kg | Rp10.000/kg |
| Jasa | Cuci Setrika | Rp7.000/kg | Rp15.000/kg |
| Jasa | Setrika Saja | Rp5.000/kg | Rp10.000/kg |
| Sepatu | Selop | Rp10.000/psg | - |
| Sepatu | Sneakers | Rp16.000/psg | - |
| Sepatu | Kulit | Rp22.000/psg | - |
| Gorden | Standart | Rp10.000/kg | - |
| Gorden | Standart + Variasi | Rp13.000/kg | - |
| Selimut | Kecil/Sedang/Besar | Rp6-15rb/pcs | - |
| Bed Cover | Single/Queen/King | Rp10-20rb/pcs | - |
| Lain-lain | Sprei, Karpet, Tas, Tikar, Boneka | Rp6-17rb | - |

---

## 🔐 Environment Variables

```env
# Lokal (SQLite)
DATABASE_URL="file:./db/custom.db"

# Production (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.xxx:password@...pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.xxx:password@...supabase.com:5432/postgres"

# Optional
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📝 Scripts

| Command | Deskripsi |
|---------|-----------|
| `bun run dev` | Start dev server (port 3000) |
| `bun run build` | Build untuk production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push schema ke database |
| `bun run db:generate` | Generate Prisma Client |
| `bun run db:migrate` | Create migration (dev) |
| `bun run db:deploy` | Deploy migrations (prod) |
| `bun prisma/seed.ts` | Seed data cabang + layanan |

---

## 🤝 Kontribusi

1. Fork repo
2. Buat branch: `git checkout -b feature/nama-fitur`
3. Commit: `git commit -m 'Add feature'`
4. Push: `git push origin feature/nama-fitur`
5. Buat Pull Request

---

## 📄 Lisensi

MIT License — bebas dipakai untuk bisnis.

---

## 💬 Support

Kalau ada pertanyaan atau error, cek:
1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** — troubleshooting deploy
2. Console browser untuk error frontend
3. Log server (`dev.log` / `server.log`) untuk error backend

---

Dibuat dengan ❤️ untuk **Putry Laundry**
