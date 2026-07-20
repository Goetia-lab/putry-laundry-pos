#!/bin/bash
# Setup script untuk Putry Laundry POS
# Jalankan setelah clone repo: ./setup.sh

set -e

echo "🧺 Putry Laundry POS - Setup"
echo "============================"
echo ""

# Cek apakah bun tersedia
if command -v bun &> /dev/null; then
  PKG_MANAGER="bun"
  echo "✓ Bun terdeteksi"
elif command -v npm &> /dev/null; then
  PKG_MANAGER="npm"
  echo "✓ npm terdeteksi (Bun tidak ada, pakai npm)"
else
  echo "✗ Bun/npm tidak ditemukan. Install salah satu:"
  echo "  Bun:  curl -fsSL https://bun.sh/install | bash"
  echo "  Node: https://nodejs.org/"
  exit 1
fi

echo ""

# 1. Install dependencies
echo "📦 [1/5] Installing dependencies..."
if [ "$PKG_MANAGER" = "bun" ]; then
  bun install
else
  npm install
fi
echo "✓ Dependencies installed"
echo ""

# 2. Setup environment
echo "⚙️  [2/5] Setup environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ .env dibuat dari .env.example"
else
  echo "✓ .env sudah ada, skip"
fi
echo ""

# 3. Generate Prisma Client
echo "🔧 [3/5] Generating Prisma Client..."
npx prisma generate
echo "✓ Prisma Client generated"
echo ""

# 4. Push schema ke database
echo "🗄️  [4/5] Push schema ke database (SQLite)..."
npx prisma db push
echo "✓ Database schema created"
echo ""

# 5. Seed data
echo "🌱 [5/5] Seeding data (2 cabang + 22 layanan)..."
if [ "$PKG_MANAGER" = "bun" ]; then
  bun prisma/seed.ts
else
  npx tsx prisma/seed.ts 2>/dev/null || npx ts-node prisma/seed.ts 2>/dev/null || {
    echo "  Install tsx untuk run seed..."
    npm install -g tsx
    npx tsx prisma/seed.ts
  }
fi
echo "✓ Seed data complete"
echo ""

# Done
echo "============================"
echo "🎉 Setup selesai!"
echo ""
echo "Sekarang jalankan dev server:"
if [ "$PKG_MANAGER" = "bun" ]; then
  echo "  bun run dev"
else
  echo "  npm run dev"
fi
echo ""
echo "Buka http://localhost:3000 di browser"
echo ""
echo "Default data:"
echo "  - Cabang A - Cabang"
echo "  - Cabang B - Pusat"
echo "  - 22 layanan pricelist (Cuci Kering, Setrika, Sepatu, dll)"
echo ""
