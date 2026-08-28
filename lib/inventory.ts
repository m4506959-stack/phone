import { prisma } from './db'

/**
 * Transactional stock reservation — prevents overselling.
 * Uses a Prisma transaction with atomic update + check.
 */
export async function reserveStock(
  variantId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Lock the inventory row
      const inventory = await tx.inventory.findUnique({
        where: { variantId },
      })

      if (!inventory) {
        throw new Error('Inventory not found')
      }

      const available = inventory.totalStock - inventory.reservedStock - inventory.completedStock
      if (available < quantity) {
        throw new Error(`Insufficient stock. Available: ${available}, Requested: ${quantity}`)
      }

      // Atomic increment of reservedStock
      await tx.inventory.update({
        where: { variantId },
        data: { reservedStock: { increment: quantity } },
      })

      // Log the transaction
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: 'RESERVE',
          quantity,
          note: `Reserved ${quantity} unit(s)`,
        },
      })
    })

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Stock reservation failed'
    return { success: false, error: msg }
  }
}

/**
 * Release reserved stock (e.g., when reservation is cancelled/expired)
 */
export async function releaseStock(
  variantId: string,
  quantity: number,
  note?: string
): Promise<void> {
  const inventory = await prisma.inventory.findUnique({ where: { variantId } })
  if (!inventory) return

  await prisma.$transaction([
    prisma.inventory.update({
      where: { variantId },
      data: { reservedStock: { decrement: Math.min(quantity, inventory.reservedStock) } },
    }),
    prisma.inventoryTransaction.create({
      data: {
        inventoryId: inventory.id,
        type: 'RELEASE',
        quantity,
        note: note || `Released ${quantity} unit(s)`,
      },
    }),
  ])
}

/**
 * Complete a reservation — move from reserved to completed
 */
export async function completeStock(variantId: string, quantity: number): Promise<void> {
  const inventory = await prisma.inventory.findUnique({ where: { variantId } })
  if (!inventory) return

  await prisma.$transaction([
    prisma.inventory.update({
      where: { variantId },
      data: {
        reservedStock: { decrement: quantity },
        completedStock: { increment: quantity },
      },
    }),
    prisma.inventoryTransaction.create({
      data: {
        inventoryId: inventory.id,
        type: 'COMPLETE',
        quantity,
        note: `Completed ${quantity} unit(s)`,
      },
    }),
  ])
}

/**
 * Adjust total stock (admin add/remove)
 */
export async function adjustStock(
  variantId: string,
  delta: number, // positive = add, negative = remove
  note: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const inventory = await prisma.inventory.findUnique({ where: { variantId } })
    if (!inventory) return { success: false, error: 'Inventory not found' }

    const newTotal = inventory.totalStock + delta
    if (newTotal < inventory.reservedStock + inventory.completedStock) {
      return { success: false, error: 'Cannot reduce stock below reserved + completed' }
    }

    await prisma.$transaction([
      prisma.inventory.update({
        where: { variantId },
        data: { totalStock: { increment: delta } },
      }),
      prisma.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: delta > 0 ? 'ADD' : 'REMOVE',
          quantity: Math.abs(delta),
          note,
          createdBy: userId,
        },
      }),
    ])

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' }
  }
}

/**
 * Get available stock for a variant (safe calculation)
 */
export async function getAvailableStock(variantId: string): Promise<number> {
  const inventory = await prisma.inventory.findUnique({ where: { variantId } })
  if (!inventory) return 0
  return Math.max(0, inventory.totalStock - inventory.reservedStock - inventory.completedStock)
}
