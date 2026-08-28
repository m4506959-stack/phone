import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/products - public
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        variants: {
          include: {
            inventory: true,
          },
          orderBy: [{ storage: 'asc' }, { color: 'asc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Compute available stock for each variant
    const enriched = products.map((p) => ({
      ...p,
      variants: p.variants.map((v) => ({
        ...v,
        availableStock: v.inventory
          ? Math.max(0, v.inventory.totalStock - v.inventory.reservedStock - v.inventory.completedStock)
          : 0,
      })),
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/products - admin only
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, nameAr, description, descriptionAr } = body

    if (!name || !nameAr) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: { name, nameAr, description, descriptionAr, active: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
