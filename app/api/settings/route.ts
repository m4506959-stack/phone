import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/settings
export async function GET() {
  try {
    const settings = await prisma.storeSettings.findFirst()
    if (!settings) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Mask password
    return NextResponse.json({ ...settings, smtpPass: '••••••••' })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    const userRole = (session?.user as { role?: string })?.role
    if (!session?.user || !['OWNER', 'ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const settings = await prisma.storeSettings.findFirst()

    const updateData = { ...body }
    // Don't overwrite pass if masked
    if (updateData.smtpPass === '••••••••') delete updateData.smtpPass

    if (settings) {
      const updated = await prisma.storeSettings.update({ where: { id: settings.id }, data: updateData })
      return NextResponse.json({ ...updated, smtpPass: '••••••••' })
    } else {
      const created = await prisma.storeSettings.create({ data: { id: 'settings', ...updateData } })
      return NextResponse.json({ ...created, smtpPass: '••••••••' })
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
