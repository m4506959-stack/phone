import { customAlphabet } from 'nanoid'

// 12-character token, uppercase letters + digits — hard to guess
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 12)

// Short 6-char token for customer display
const shortNanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

export function generateToken(): string {
  return nanoid()
}

export function generateShortToken(): string {
  return shortNanoid()
}

// Generate reservation code like IPH18-00421
export function generateReservationCode(prefix: string, count: number): string {
  return `${prefix}-${String(count).padStart(5, '0')}`
}
