import { Redis } from '@upstash/redis'

// Check if environment variables are set
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisEnabled = process.env.REDIS_ENABLED !== 'false';

// Initialize Redis client only if environment variables are set
let redis: Redis | null = null;

if (redisEnabled && redisUrl && redisToken) {
  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch (error) {
    console.error('❌ Failed to initialize Redis client:', error);
    redis = null;
  }
}

export default redis

// Cache configuration
export const CACHE_KEYS = {
  USER_PROFILE: (phoneNumber: string) => `user:profile:${phoneNumber}`,
  ADMIN_PROFILE: (userId: number) => `admin:profile:${userId}`,
  USER_SUBSCRIPTION: (patientId: number) => `user:subscription:${patientId}`,
  DASHBOARD_SUMMARY: 'dashboard:summary',
  PLANS_DATA: 'plans:data',
  DIET_PLAN: (patientId: number) => `diet:plan:${patientId}`,
  LLM_EXTRACT: (analysisId: number) => `llm:extract:${analysisId}`,
  APPOINTMENTS: (patientId: number, upcomingOnly: boolean) => `appointments:${patientId}:${upcomingOnly}`,
  INSIGHTS: (patientId: number) => `insights:${patientId}`,
  PATHOLOGY_APPOINTMENTS: 'pathology:upcoming:appointments',
  // Doctor-related cache keys
  DOCTOR_PROFILE: (doctorId: number) => `doctor:profile:${doctorId}`,
  DOCTOR_LIST: (clinicId: number) => `doctors:list:${clinicId}`,
  DOCTOR_AVAILABILITY: (doctorId: number) => `doctor:availability:${doctorId}`,
  DOCTOR_APPOINTMENTS: (doctorId: number) => `doctor:appointments:${doctorId}`,
  // Doctor-scoped endpoint caches are keyed by user id, never phone number
  // (the same phone can belong to different users in different clinics)
  DOCTOR_SCOPED: (baseKey: string, userId: number, ...suffix: (string | number)[]) =>
    [`${baseKey}:u${userId}`, ...suffix].join(':'),
  DOCTOR_APPOINTMENTS_PATTERN: (userId: number) => `doctor:appointments:u${userId}:*`,
} as const

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  USER_PROFILE: 15 * 60, // 15 minutes
  ADMIN_PROFILE: 15 * 60, // 15 minutes
  USER_SUBSCRIPTION: 5 * 60, // 5 minutes
  DASHBOARD_SUMMARY: 5 * 60, // 5 minutes
  PLANS_DATA: 30 * 60, // 30 minutes
  DIET_PLAN: 10 * 60, // 10 minutes
  LLM_EXTRACT: 60 * 60, // 1 hour
  APPOINTMENTS: 5 * 60, // 5 minutes
  INSIGHTS: 10 * 60, // 10 minutes
  PATHOLOGY_APPOINTMENTS: 3 * 60, // 3 minutes
  // Doctor-related cache TTL
  DOCTOR_PROFILE: 15 * 60, // 15 minutes
  DOCTOR_LIST: 10 * 60, // 10 minutes
  DOCTOR_AVAILABILITY: 5 * 60, // 5 minutes
  DOCTOR_APPOINTMENTS: 5 * 60, // 5 minutes
} as const

// Utility functions
export const cacheUtils = {
  // Get cached data with fallback
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // If Redis is not available, just execute fallback
    if (!redis) {
      return await fallback()
    }

    try {
      // Try to get from cache first
      const cached = await redis.get<T>(key)
      if (cached !== null) {
        return cached
      }

      // If not in cache, execute fallback and cache result
      const data = await fallback()
      await redis.setex(key, ttl, data)
      return data
    } catch (error) {
      console.error('Redis cache error:', error)
      // Fallback to database if Redis fails
      return await fallback()
    }
  },

  // Invalidate cache
  async invalidate(pattern: string): Promise<void> {
    if (!redis) {
      return
    }

    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis invalidation error:', error)
    }
  },

  // Set cache with TTL
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!redis) {
      return
    }

    try {
      await redis.setex(key, ttl, value)
    } catch (error) {
      console.error('Redis set error:', error)
    }
  },

  // Get from cache
  async get<T>(key: string): Promise<T | null> {
    if (!redis) {
      return null
    }

    try {
      return await redis.get<T>(key)
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }
}

