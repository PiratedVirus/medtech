import prisma from '@/lib/prisma'
import redis, { CACHE_KEYS, CACHE_TTL, cacheUtils } from '@/lib/redis'

export interface CachedUserProfile {
  id: number
  clinicId: number | null
  phoneNumber: string
  email: string | null
  name: string
  role: string
  status: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  userProfilePicture: string | null
  patientProfile: any
  doctorProfile: any
  subscriptionDetails: any
}

export interface CachedAdminProfile {
  id: number
  name: string
  email: string | null
  role: string
  clinicId: number | null
  clinic?: {
    id: number
    name: string
  } | null
}

/**
 * Get user profile with Redis caching
 * This will dramatically speed up authentication
 */
export async function getCachedUserProfile(phoneNumber: string): Promise<CachedUserProfile | null> {
  const cacheKey = CACHE_KEYS.USER_PROFILE(phoneNumber)
  
  return await cacheUtils.getOrSet(
    cacheKey,
    async () => {
      // Fetch from database
      const user = await prisma.user.findFirst({
        where: { phoneNumber, deletedAt: null },
        select: {
          id: true,
          clinicId: true,
          phoneNumber: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          userProfilePicture: true,
          patientProfile: true,
          doctorProfile: true,
        },
      })

      if (!user) return null

      // Fetch subscription details
      const subscriptionDetails = await prisma.subscriptionTracker.findFirst({
        where: {
          patientId: user.patientProfile?.id,
          isActive: true,
          endDate: {
            gt: new Date(),
          },
        },
      })

      return {
        ...user,
        subscriptionDetails,
      } as CachedUserProfile
    },
    CACHE_TTL.USER_PROFILE
  )
}

/**
 * Get admin profile with Redis caching
 */
export async function getCachedAdminProfile(userId: number): Promise<CachedAdminProfile | null> {
  const cacheKey = CACHE_KEYS.ADMIN_PROFILE(userId)
  
  return await cacheUtils.getOrSet(
    cacheKey,
    async () => {
      const admin = await prisma.user.findUnique({
        where: {
          id: userId,
          role: "ADMIN",
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          clinicId: true,
          clinic: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      })

      return admin as CachedAdminProfile | null
    },
    CACHE_TTL.ADMIN_PROFILE
  )
}

/**
 * Invalidate user cache when profile is updated
 */
export async function invalidateUserCache(phoneNumber: string): Promise<void> {
  await cacheUtils.invalidate(CACHE_KEYS.USER_PROFILE(phoneNumber))
}

/**
 * Invalidate admin cache when profile is updated
 */
export async function invalidateAdminCache(userId: number): Promise<void> {
  await cacheUtils.invalidate(CACHE_KEYS.ADMIN_PROFILE(userId))
}

/**
 * Invalidate subscription cache when subscription changes
 */
export async function invalidateSubscriptionCache(patientId: number): Promise<void> {
  await cacheUtils.invalidate(CACHE_KEYS.USER_SUBSCRIPTION(patientId))
}