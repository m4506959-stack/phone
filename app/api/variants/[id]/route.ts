import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { writeAuditLog } from '@/lib/audit'

// PATCH /api/variants/[id] - Update variant price & details (Admin/Owner)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const userRole = (session?.user as { role?: string })?.role
    if (!session?.user || !['OWNER', 'ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { price } = body

    if (price === undefined || typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const prev = await prisma.productVariant.findUnique({
      where: { id },
      include: { product: true },
    })

    if (!prev) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    const updated = await prisma.productVariant.update({
      where: { id },
      data: { price },
    })

    // Log the price change in audit log
    await writeAuditLog({
      userId: session.user.id!,
      action: 'UPDATE_PRICE',
      entity: 'ProductVariant',
      entityId: id,
      prevValue: { price: prev.price, product: prev.product.name, variant: `${prev.storage} / ${prev.color}` },
      newValue: { price },
      ip: req.headers.get('x-forwarded-for') || undefined,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/variants/[id] error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
