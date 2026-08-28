import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/dashboard - stats for admin dashboard
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      totalReservations,
      todayReservations,
      pendingCount,
      confirmedCount,
      arrivedCount,
      completedCount,
      cancelledCount,
      inventoryData,
      recentReservations,
    ] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({ where: { createdAt: { gte: today } } }),
      prisma.reservation.count({ where: { status: 'PENDING' } }),
      prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
      prisma.reservation.count({ where: { status: 'ARRIVED' } }),
      prisma.reservation.count({ where: { status: 'COMPLETED' } }),
      prisma.reservation.count({ where: { status: 'CANCELLED' } }),
      prisma.inventory.findMany({
        include: { variant: { include: { product: true } } },
      }),
      prisma.reservation.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ])

    // Group last 7 days
    const dateCounts: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateKey = d.toISOString().split('T')[0]
      dateCounts[dateKey] = 0
    }
    recentReservations.forEach((r) => {
      const key = r.createdAt.toISOString().split('T')[0]
      if (dateCounts[key] !== undefined) dateCounts[key]++
    })
    const last7Days = Object.entries(dateCounts).map(([date, count]) => ({ date, count }))

    const totalStock = inventoryData.reduce((sum, i) => sum + i.totalStock, 0)
    const reservedStock = inventoryData.reduce((sum, i) => sum + i.reservedStock, 0)
    const completedStock = inventoryData.reduce((sum, i) => sum + i.completedStock, 0)
    const availableStock = Math.max(0, totalStock - reservedStock - completedStock)

    return NextResponse.json({
      totalReservations,
      todayReservations,
      pendingCount,
      confirmedCount,
      arrivedCount,
      completedCount,
      cancelledCount,
      inventory: { totalStock, reservedStock, completedStock, availableStock },
      last7Days,
    })
  } catch (error) {
    console.error('GET /api/dashboard:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
