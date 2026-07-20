import { db } from '../src/lib/db'

async function main() {
  // Create 2 branches
  const cabangA = await db.branch.create({
    data: {
      name: 'Cabang A - Pusat',
      code: 'A',
      address: 'Jl. Merdeka No. 123',
      phone: '081234567890',
      operationalFundAmount: 50000,
      isActive: true,
    },
  })

  const cabangB = await db.branch.create({
    data: {
      name: 'Cabang B - Cabang',
      code: 'B',
      address: 'Jl. Sudirman No. 456',
      phone: '081234567891',
      operationalFundAmount: 50000,
      isActive: true,
    },
  })

  console.log('Branches created:', cabangA.name, cabangB.name)

  // Pricelist services from the photo
  const services = [
    // Jasa - Reguler & Express
    { category: 'Jasa', name: 'Cuci Kering', variant: 'Reguler', price: 5000, unit: 'KG', duration: '2-3 Hari', sortOrder: 1 },
    { category: 'Jasa', name: 'Cuci Kering', variant: 'Express', price: 10000, unit: 'KG', duration: '24 Jam', sortOrder: 2 },
    { category: 'Jasa', name: 'Cuci Setrika', variant: 'Reguler', price: 7000, unit: 'KG', duration: '2-3 Hari', sortOrder: 3 },
    { category: 'Jasa', name: 'Cuci Setrika', variant: 'Express', price: 15000, unit: 'KG', duration: '24 Jam', sortOrder: 4 },
    { category: 'Jasa', name: 'Setrika Saja', variant: 'Reguler', price: 5000, unit: 'KG', duration: '2-3 Hari', sortOrder: 5 },
    { category: 'Jasa', name: 'Setrika Saja', variant: 'Express', price: 10000, unit: 'KG', duration: '24 Jam', sortOrder: 6 },
    // Sepatu
    { category: 'Sepatu', name: 'Selop', variant: null, price: 10000, unit: 'PSG', duration: null, sortOrder: 7 },
    { category: 'Sepatu', name: 'Sneakers', variant: null, price: 16000, unit: 'PSG', duration: null, sortOrder: 8 },
    { category: 'Sepatu', name: 'Kulit', variant: null, price: 22000, unit: 'PSG', duration: null, sortOrder: 9 },
    // Gorden
    { category: 'Gorden', name: 'Standart', variant: null, price: 10000, unit: 'KG', duration: null, sortOrder: 10 },
    { category: 'Gorden', name: 'Standart + Variasi', variant: null, price: 13000, unit: 'KG', duration: null, sortOrder: 11 },
    // Selimut
    { category: 'Selimut', name: 'Kecil', variant: null, price: 6000, unit: 'PCS', duration: null, sortOrder: 12 },
    { category: 'Selimut', name: 'Sedang', variant: null, price: 8000, unit: 'PCS', duration: null, sortOrder: 13 },
    { category: 'Selimut', name: 'Besar', variant: null, price: 15000, unit: 'PCS', duration: null, sortOrder: 14 },
    // Bed Cover
    { category: 'Bed Cover', name: 'Single', variant: null, price: 10000, unit: 'PCS', duration: null, sortOrder: 15 },
    { category: 'Bed Cover', name: 'Queen', variant: null, price: 15000, unit: 'PCS', duration: null, sortOrder: 16 },
    { category: 'Bed Cover', name: 'King', variant: null, price: 20000, unit: 'PCS', duration: null, sortOrder: 17 },
    // Lain-lain
    { category: 'Lain-lain', name: 'Sprei', variant: null, price: 6000, unit: 'PCS', duration: null, sortOrder: 18 },
    { category: 'Lain-lain', name: 'Karpet', variant: null, price: 17000, unit: 'M2', duration: null, sortOrder: 19 },
    { category: 'Lain-lain', name: 'Tas', variant: null, price: 10000, unit: 'PCS', duration: null, sortOrder: 20 },
    { category: 'Lain-lain', name: 'Tikar', variant: null, price: 12000, unit: 'PCS', duration: null, sortOrder: 21 },
    { category: 'Lain-lain', name: 'Boneka', variant: null, price: 0, unit: 'PCS', duration: null, sortOrder: 22 },
  ]

  for (const svc of services) {
    await db.service.create({ data: svc })
  }
  console.log(`Created ${services.length} services`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
