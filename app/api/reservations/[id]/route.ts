import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { releaseStock, completeStock } from '@/lib/inventory'
import { sendStatusEmail, getNotificationTypeForStatus, ReservationStatus } from '@/lib/email'
import { writeAuditLog } from '@/lib/audit'
import { auth } from '@/lib/auth'

// GET /api/reservations/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
        notifications: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(reservation)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/reservations/[id] - update status (admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { status } = body as { status: ReservationStatus }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    })

    if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const prevStatus = reservation.status

    // Prevent duplicate notifications for same status
    if (prevStatus === status) {
      return NextResponse.json({ error: 'Status already set' }, { status: 400 })
    }

    // Update status
    await prisma.reservation.update({ where: { id }, data: { status } })

    // Handle inventory changes
    if (status === 'CANCELLED' || status === 'EXPIRED') {
      for (const item of reservation.items) {
        await releaseStock(item.variantId, item.quantity, `Reservation ${reservation.reservationCode} ${status.toLowerCase()}`)
      }
    }
    if (status === 'COMPLETED') {
      for (const item of reservation.items) {
        await completeStock(item.variantId, item.quantity)
      }
    }

    // Audit log
    await writeAuditLog({
      userId: session.user.id!,
      action: 'STATUS_CHANGE',
      entity: 'Reservation',
      entityId: id,
      prevValue: { status: prevStatus },
      newValue: { status },
      ip: req.headers.get('x-forwarded-for') || undefined,
    })

    // Send email notification for meaningful status changes only
    const notifType = getNotificationTypeForStatus(status)
    if (notifType && reservation.customer.email) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const item = reservation.items[0]
      sendStatusEmail(reservation.id, notifType, {
        customerName: reservation.customer.fullName,
        reservationId: reservation.id,
        reservationCode: reservation.reservationCode,
        productName: item.variant.product.name,
        variant: `${item.variant.storage} / ${item.variant.color}`,
        quantity: item.quantity,
        trackingLink: `${baseUrl}/track?token=${reservation.token}`,
        email: reservation.customer.email,
      }).catch(console.error)
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('PATCH /api/reservations/[id]:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
