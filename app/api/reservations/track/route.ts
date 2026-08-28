import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/reservations/track?token=XXX — public customer tracking
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const reservation = await prisma.reservation.findUnique({
      where: { token: token.toUpperCase() },
      include: {
        customer: {
          select: {
            fullName: true,
            city: true,
            area: true,
            // Do NOT expose phone/email publicly
          },
        },
        items: {
          include: {
            variant: {
              include: { product: { select: { name: true, nameAr: true } } },
            },
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Return safe public data only
    return NextResponse.json({
      id: reservation.id,
      reservationCode: reservation.reservationCode,
      status: reservation.status,
      deliveryMethod: reservation.deliveryMethod,
      totalAmount: reservation.totalAmount,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      customer: reservation.customer,
      items: reservation.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        variant: {
          storage: item.variant.storage,
          color: item.variant.color,
          colorAr: item.variant.colorAr,
          product: item.variant.product,
        },
      })),
    })
  } catch (error) {
    console.error('GET /api/reservations/track:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
