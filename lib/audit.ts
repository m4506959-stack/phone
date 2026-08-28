import { prisma } from './db'

interface AuditParams {
  userId: string
  action: string
  entity: string
  entityId: string
  prevValue?: unknown
  newValue?: unknown
  ip?: string
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        prevValue: params.prevValue ? JSON.stringify(params.prevValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        ip: params.ip,
      },
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}
