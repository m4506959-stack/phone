import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { adjustStock } from '@/lib/inventory'
import { auth } from '@/lib/auth'

// GET /api/inventory - admin
export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        variant: { include: { product: true } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    const enriched = inventory.map((inv) => ({
      ...inv,
      availableStock: Math.max(0, inv.totalStock - inv.reservedStock - inv.completedStock),
    }))

    return NextResponse.json(enriched)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/inventory - adjust stock (admin)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { variantId, delta, note } = body

    if (!variantId || delta === undefined || !note) {
      return NextResponse.json({ error: 'variantId, delta, note required' }, { status: 400 })
    }

    const result = await adjustStock(variantId, delta, note, session.user.id!)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
