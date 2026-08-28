import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding complete iPhone 18 lineup and admin...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('43353300', 12)
  await prisma.user.upsert({
    where: { email: 'm4506959@gmail.com' },
    update: { password: hashedPassword, role: 'OWNER' },
    create: {
      email: 'm4506959@gmail.com',
      password: hashedPassword,
      name: 'مدير المتجر',
      role: 'OWNER',
      active: true,
    },
  })

  // Create store settings
  await prisma.storeSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: {
      id: 'settings',
      storeName: 'iPhone 18 Official Pre-Order',
      storeNameAr: 'حجز سلسلة آيفون 18 الرسمية',
      phone: '+218 91 000 0000',
      whatsapp: '+218 91 000 0000',
      address: 'Tripoli, Libya',
      addressAr: 'طرابلس، ليبيا - شارع النوفليين / بنغازي - شارع دبي',
      workingHours: '10:00 AM - 10:00 PM',
      workingHoursAr: 'السبت إلى الخميس: 10:00 ص - 10:00 م',
      reservationsOpen: true,
      maxQtyPerCustomer: 2,
      reservationExpiry: 60,
      countdownEnabled: true,
      countdownEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      primaryColor: '#0071e3',
      defaultLanguage: 'ar',
      smtpUser: 'm4506959@gmail.com',
      smtpPass: '43353300',
      smtpFrom: 'm4506959@gmail.com',
      emailEnabled: true,
    },
  })

  // The 4 exact colors from the official leak image:
  const leakedColors = [
    { name: 'Space Black', nameAr: 'أسود فضائي', hex: '#26272B' },
    { name: 'Sky Blue', nameAr: 'أزرق سماوي', hex: '#7FAADC' },
    { name: 'Deep Plum', nameAr: 'بنفسجي بري داكن', hex: '#622749' },
    { name: 'Titanium Gray', nameAr: 'رمادي تيتانيوم', hex: '#B2B7BD' },
  ]

  // Clean old variants & inventory
  await prisma.inventory.deleteMany({})
  await prisma.productVariant.deleteMany({})

  const lineup = [
    {
      id: 'iphone-18-pro-max',
      name: 'iPhone 18 Pro Max',
      nameAr: 'آيفون 18 برو ماكس',
      description: 'The pinnacle of iPhone. 6.9-inch Super Retina XDR ProMotion, A19 Pro 2nm Bionic, Quad 48MP Camera with 5x Optical Zoom & Grade 5 Titanium.',
      descriptionAr: 'قمة هندسة آبل. شاشة 6.9 إنش Super Retina XDR مع ProMotion 120Hz، معالج A19 Pro فائق الذكاء، كاميرا رباعية 48MP مع تقريب 5x وهيكل تيتانيوم من الدرجة الخامسة.',
      images: '/iphone18-pro-max.svg',
      colors: leakedColors,
      storages: [
        { storage: '256GB', price: 6450, stock: 25 },
        { storage: '512GB', price: 7300, stock: 20 },
        { storage: '1TB', price: 8400, stock: 15 },
      ],
    },
    {
      id: 'iphone-18-pro',
      name: 'iPhone 18 Pro',
      nameAr: 'آيفون 18 برو',
      description: 'Pro performance in a compact 6.3-inch design. Grade 5 Titanium chassis, A19 Pro chip, and next-generation Pro camera system.',
      descriptionAr: 'قوة الأداء الاحترافي بحجم 6.3 إنش مدمج ومثالي. هيكل تيتانيوم خفيف وصلب، معالج A19 Pro، ومنظومة تصوير سينمائي متطورة.',
      images: '/iphone18-pro.svg',
      colors: leakedColors,
      storages: [
        { storage: '256GB', price: 5650, stock: 30 },
        { storage: '512GB', price: 6500, stock: 20 },
        { storage: '1TB', price: 7600, stock: 10 },
      ],
    },
    {
      id: 'iphone-18-air',
      name: 'iPhone 18 Air',
      nameAr: 'آيفون 18 إير (النسخة النحيفة)',
      description: 'The thinnest and lightest iPhone ever created. 6.6-inch ultra-bright display with titanium aero-frame and groundbreaking battery tech.',
      descriptionAr: 'الآيفون الأنحف والأخف وزناً على الإطلاق. شاشة 6.6 إنش فائقة السطوع مع هيكل ألومنيوم طيران خفيف وبطارية جيل جديد تدوم طويلاً.',
      images: '/iphone18-air.svg',
      colors: leakedColors,
      storages: [
        { storage: '128GB', price: 4400, stock: 25 },
        { storage: '256GB', price: 4950, stock: 25 },
        { storage: '512GB', price: 5800, stock: 15 },
      ],
    },
    {
      id: 'iphone-18',
      name: 'iPhone 18',
      nameAr: 'آيفون 18',
      description: 'Total powerhouse. 6.1-inch dynamic screen, Camera Control button, A19 Bionic, vivid color infusion glass back.',
      descriptionAr: 'قوة متكاملة بتصميم جذاب. شاشة 6.1 إنش، زر التحكم بالكاميرا، معالج A19، وزجاج خلفي ملون بتقنية الدمج اللوني المبتكرة.',
      images: '/iphone18.svg',
      colors: leakedColors,
      storages: [
        { storage: '128GB', price: 3750, stock: 35 },
        { storage: '256GB', price: 4300, stock: 30 },
        { storage: '512GB', price: 5100, stock: 15 },
      ],
    },
  ]

  for (const item of lineup) {
    const product = await prisma.product.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        nameAr: item.nameAr,
        description: item.description,
        descriptionAr: item.descriptionAr,
        images: item.images,
        active: true,
      },
      create: {
        id: item.id,
        name: item.name,
        nameAr: item.nameAr,
        description: item.description,
        descriptionAr: item.descriptionAr,
        images: item.images,
        active: true,
      },
    })

    for (const storage of item.storages) {
      for (const color of item.colors) {
        const variantId = `${item.id}-${storage.storage}-${color.name}`.toLowerCase().replace(/[^a-z0-9]/g, '-')
        const variant = await prisma.productVariant.upsert({
          where: { id: variantId },
          update: {
            price: storage.price,
            colorAr: color.nameAr,
          },
          create: {
            id: variantId,
            productId: product.id,
            storage: storage.storage,
            color: color.name,
            colorAr: color.nameAr,
            price: storage.price,
          },
        })

        await prisma.inventory.upsert({
          where: { variantId: variant.id },
          update: {
            totalStock: storage.stock,
          },
          create: {
            variantId: variant.id,
            totalStock: storage.stock,
            reservedStock: 0,
            completedStock: 0,
          },
        })
      }
    }
    console.log(`✅ Loaded ${item.nameAr} with ${item.colors.length} colors and ${item.storages.length} storage options`)
  }

  console.log('\n🎉 All iPhone 18 models seeded successfully with official color palette and Libyan Dinar pricing!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
