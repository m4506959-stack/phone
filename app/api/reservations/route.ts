import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { reserveStock } from '@/lib/inventory'
import { generateToken, generateReservationCode } from '@/lib/tokens'
import { sendStatusEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const reservationSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  city: z.string().optional(),
  area: z.string().optional(),
  deliveryMethod: z.enum(['PICKUP', 'DELIVERY']).default('PICKUP'),
  notes: z.string().optional(),
})

// GET /api/reservations - admin only
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status && status !== 'ALL') where.status = status
    if (search) {
      where.OR = [
        { customer: { fullName: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
        { reservationCode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              variant: { include: { product: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ])

    return NextResponse.json({ reservations, total, page, limit })
  } catch (error) {
    console.error('GET /api/reservations error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/reservations - public (create new reservation)
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const rateCheck = checkRateLimit({
      key: `reservation:${ip}`,
      limit: 5,
      windowMs: 15 * 60 * 1000, // 5 per 15 min
    })

    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Validate input
    const body = await req.json()
    const parsed = reservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Check store settings
    const settings = await prisma.storeSettings.findFirst()
    if (settings && !settings.reservationsOpen) {
      return NextResponse.json({ error: 'Reservations are closed' }, { status: 403 })
    }

    // Check max qty
    const maxQty = settings?.maxQtyPerCustomer ?? 2
    if (data.quantity > maxQty) {
      return NextResponse.json({ error: `Max quantity is ${maxQty}` }, { status: 400 })
    }

    // Get variant + verify it exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: data.variantId },
      include: { product: true, inventory: true },
    })

    if (!variant || !variant.product.active) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Reserve stock (transactional)
    const stockResult = await reserveStock(data.variantId, data.quantity)
    if (!stockResult.success) {
      return NextResponse.json({ error: stockResult.error }, { status: 409 })
    }

    // Create or find customer
    let customer = await prisma.customer.findFirst({
      where: { phone: data.phone },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          city: data.city,
          area: data.area,
        },
      })
    } else {
      // Update customer info
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          fullName: data.fullName,
          email: data.email || customer.email,
          city: data.city || customer.city,
          area: data.area || customer.area,
        },
      })
    }

    // Generate unique token + reservation code
    const token = generateToken()
    const count = await prisma.reservation.count()
    const reservationCode = generateReservationCode('IPH18', count + 1)

    // Set expiry
    const expiry = settings?.reservationExpiry ?? 30
    const expiresAt = new Date(Date.now() + expiry * 60 * 1000)

    const totalAmount = variant.price * data.quantity

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        reservationCode,
        token,
        customerId: customer.id,
        status: 'PENDING',
        deliveryMethod: data.deliveryMethod,
        notes: data.notes,
        totalAmount,
        expiresAt,
        items: {
          create: {
            variantId: data.variantId,
            quantity: data.quantity,
            unitPrice: variant.price,
          },
        },
      },
      include: {
        items: {
          include: { variant: { include: { product: true } } },
        },
        customer: true,
      },
    })

    // Send confirmation email (don't await to avoid blocking)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const trackingLink = `${baseUrl}/track?token=${token}`
    const item = reservation.items[0]
    const variantLabel = `${item.variant.storage} / ${item.variant.color}`

    sendStatusEmail(reservation.id, 'RESERVATION_CREATED', {
      customerName: customer.fullName,
      reservationId: reservation.id,
      reservationCode,
      productName: item.variant.product.name,
      variant: variantLabel,
      quantity: data.quantity,
      trackingLink,
      email: customer.email || '',
    }).catch(console.error)

    return NextResponse.json({
      id: reservation.id,
      reservationCode,
      token,
      status: reservation.status,
      totalAmount,
      expiresAt,
    }, { status: 201 })

  } catch (error) {
    console.error('POST /api/reservations error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
