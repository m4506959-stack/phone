// Rate limiter - in memory (per process)
// For production: use Redis-based rate limiter

interface RateLimitRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitRecord>()

interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

export function checkRateLimit(options: RateLimitOptions): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = store.get(options.key)

  if (!record || record.resetAt < now) {
    store.set(options.key, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, remaining: options.limit - 1 }
  }

  if (record.count >= options.limit) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: options.limit - record.count }
}

// Clean old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of store.entries()) {
      if (record.resetAt < now) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}
