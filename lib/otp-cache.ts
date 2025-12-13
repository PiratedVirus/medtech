import redis, { cacheUtils } from '@/lib/redis'

// OTP Cache Configuration
export const OTP_CACHE_KEYS = {
  OTP_REQUEST: (phoneNumber: string) => `otp:request:${phoneNumber}`,
  OTP_ATTEMPTS: (phoneNumber: string) => `otp:attempts:${phoneNumber}`,
  OTP_BLOCKED: (phoneNumber: string) => `otp:blocked:${phoneNumber}`,
  OTP_RATE_LIMIT: (phoneNumber: string) => `otp:rate_limit:${phoneNumber}`,
} as const

export const OTP_CACHE_TTL = {
  OTP_REQUEST: 5 * 60, // 5 minutes
  OTP_ATTEMPTS: 15 * 60, // 15 minutes
  OTP_BLOCKED: 30 * 60, // 30 minutes
  OTP_RATE_LIMIT: 60, // 1 minute
} as const

/**
 * Check if phone number is rate limited
 */
export async function checkRateLimit(phoneNumber: string): Promise<boolean> {
  if (!redis) {
    return true // If Redis is not available, allow the request
  }
  
  const key = OTP_CACHE_KEYS.OTP_RATE_LIMIT(phoneNumber)
  const attempts = await redis.get<number>(key) || 0
  
  // Allow max 3 OTP requests per minute
  if (attempts >= 3) {
    return false // Rate limited
  }
  
  // Increment counter
  await redis.setex(key, OTP_CACHE_TTL.OTP_RATE_LIMIT, attempts + 1)
  return true // Not rate limited
}

/**
 * Check if phone number is blocked due to too many attempts
 */
export async function isPhoneBlocked(phoneNumber: string): Promise<boolean> {
  if (!redis) {
    return false // If Redis is not available, don't block
  }
  
  const key = OTP_CACHE_KEYS.OTP_BLOCKED(phoneNumber)
  const blocked = await redis.get<boolean>(key)
  return blocked === true
}

/**
 * Block phone number due to too many attempts
 */
export async function blockPhoneNumber(phoneNumber: string): Promise<void> {
  if (!redis) {
    return // If Redis is not available, skip blocking
  }
  
  const key = OTP_CACHE_KEYS.OTP_BLOCKED(phoneNumber)
  await redis.setex(key, OTP_CACHE_TTL.OTP_BLOCKED, true)
}

/**
 * Track OTP attempts
 */
export async function trackOtpAttempt(phoneNumber: string): Promise<number> {
  if (!redis) {
    return 0 // If Redis is not available, return 0 attempts
  }
  
  const key = OTP_CACHE_KEYS.OTP_ATTEMPTS(phoneNumber)
  const attempts = await redis.get<number>(key) || 0
  const newAttempts = attempts + 1
  
  await redis.setex(key, OTP_CACHE_TTL.OTP_ATTEMPTS, newAttempts)
  
  // Block if too many attempts
  if (newAttempts >= 5) {
    await blockPhoneNumber(phoneNumber)
  }
  
  return newAttempts
}

/**
 * Cache OTP request to prevent duplicate requests
 */
export async function cacheOtpRequest(phoneNumber: string, requestId: string): Promise<void> {
  if (!redis) {
    return // If Redis is not available, skip caching
  }
  
  const key = OTP_CACHE_KEYS.OTP_REQUEST(phoneNumber)
  await redis.setex(key, OTP_CACHE_TTL.OTP_REQUEST, requestId)
}

/**
 * Check if OTP request already exists
 */
export async function getCachedOtpRequest(phoneNumber: string): Promise<string | null> {
  if (!redis) {
    return null // If Redis is not available, return null
  }
  
  const key = OTP_CACHE_KEYS.OTP_REQUEST(phoneNumber)
  return await redis.get<string>(key)
}

/**
 * Clear OTP request cache (after successful verification)
 */
export async function clearOtpRequest(phoneNumber: string): Promise<void> {
  if (!redis) {
    return // If Redis is not available, skip clearing
  }
  
  const key = OTP_CACHE_KEYS.OTP_REQUEST(phoneNumber)
  await redis.del(key)
}
