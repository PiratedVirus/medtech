import { Redis } from '@upstash/redis'

// Check if environment variables are set
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.error('❌ Redis environment variables not set!');
  console.error('Please add to your .env.local:');
  console.error('UPSTASH_REDIS_REST_URL=https://your-database.upstash.io');
  console.error('UPSTASH_REDIS_REST_TOKEN=your_token_here');
}

// Initialize Redis client for Upstash
const redis = new Redis({
  url: redisUrl!,
  token: redisToken!,
})

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
} as const

// Utility functions
export const cacheUtils = {
  // Get cached data with fallback
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number
  ): Promise<T> {
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
    try {
      await redis.setex(key, ttl, value)
    } catch (error) {
      console.error('Redis set error:', error)
    }
  },

  // Get from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      return await redis.get<T>(key)
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }
}

