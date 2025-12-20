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
 * 
 * MULTI-TENANCY: Use userId for direct lookup (preferred) or phoneNumber+clinicId
 * 
 * @param identifier - Either { userId } or { phoneNumber, clinicId }
 */
export async function getCachedUserProfile(
  phoneNumber: string,
  clinicId?: number | null
): Promise<CachedUserProfile | null> {
  // For multi-tenancy, include clinicId in cache key if provided
  const cacheKey = clinicId 
    ? `${CACHE_KEYS.USER_PROFILE(phoneNumber)}:clinic:${clinicId}`
    : CACHE_KEYS.USER_PROFILE(phoneNumber);
  
  return await cacheUtils.getOrSet(
    cacheKey,
    async () => {
      // Build where clause for multi-tenancy
      const whereClause: any = { phoneNumber, deletedAt: null };
      if (clinicId !== undefined && clinicId !== null) {
        whereClause.clinicId = clinicId;
      }
      
      // Fetch from database
      const user = await prisma.user.findFirst({
        where: whereClause,
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
 * Get user profile by userId (preferred for multi-tenancy)
 * This avoids ambiguity when same phone exists in multiple clinics
 */
export async function getCachedUserProfileById(userId: number): Promise<CachedUserProfile | null> {
  const cacheKey = `user:profile:id:${userId}`;
  
  return await cacheUtils.getOrSet(
    cacheKey,
    async () => {
      const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
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
 * For multi-tenancy, invalidates both phone-only and phone+clinic keys
 */
export async function invalidateUserCache(phoneNumber: string, clinicId?: number | null): Promise<void> {
  // Invalidate the base phone number cache
  await cacheUtils.invalidate(CACHE_KEYS.USER_PROFILE(phoneNumber));
  
  // If clinicId provided, also invalidate the clinic-specific cache
  if (clinicId) {
    await cacheUtils.invalidate(`${CACHE_KEYS.USER_PROFILE(phoneNumber)}:clinic:${clinicId}`);
  }
}

/**
 * Invalidate user cache by userId
 */
export async function invalidateUserCacheById(userId: number): Promise<void> {
  await cacheUtils.invalidate(`user:profile:id:${userId}`);
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