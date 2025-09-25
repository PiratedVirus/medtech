/**
 * Centralized cache invalidation system
 * Automatically invalidates user profile cache when data changes
 */

import { Redis } from 'ioredis';

// Initialize Redis client for cache invalidation
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Invalidate user profile cache for a specific user
 * This should be called whenever user profile data changes
 */
export async function invalidateUserProfileCache(userId: number, phoneNumber?: string) {
  try {
    console.log(`[CACHE-INVALIDATION] Invalidating cache for user ${userId}`);
    
    // 1. Clear Redis cache (server-side)
    if (phoneNumber) {
      await redis.del(`user:${phoneNumber}`);
      console.log(`[CACHE-INVALIDATION] Cleared Redis cache for phone: ${phoneNumber}`);
    }
    
    // 2. Clear any other user-related caches
    await redis.del(`user:${userId}`);
    await redis.del(`profile:${userId}`);
    await redis.del(`subscription:${userId}`);
    
    console.log(`[CACHE-INVALIDATION] Successfully invalidated cache for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[CACHE-INVALIDATION] Error invalidating cache for user ${userId}:`, error);
    return false;
  }
}

/**
 * Invalidate subscription cache for a specific user
 * This should be called when subscription status changes
 */
export async function invalidateSubscriptionCache(userId: number) {
  try {
    console.log(`[CACHE-INVALIDATION] Invalidating subscription cache for user ${userId}`);
    
    // Clear subscription-related caches
    await redis.del(`subscription:${userId}`);
    await redis.del(`plan:${userId}`);
    await redis.del(`user:${userId}`);
    
    console.log(`[CACHE-INVALIDATION] Successfully invalidated subscription cache for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[CACHE-INVALIDATION] Error invalidating subscription cache for user ${userId}:`, error);
    return false;
  }
}

/**
 * Invalidate appointment cache for a specific user
 * This should be called when appointments are created/updated
 */
export async function invalidateAppointmentCache(userId: number) {
  try {
    console.log(`[CACHE-INVALIDATION] Invalidating appointment cache for user ${userId}`);
    
    // Clear appointment-related caches
    await redis.del(`appointments:${userId}`);
    await redis.del(`user:${userId}`);
    
    console.log(`[CACHE-INVALIDATION] Successfully invalidated appointment cache for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[CACHE-INVALIDATION] Error invalidating appointment cache for user ${userId}:`, error);
    return false;
  }
}

/**
 * Invalidate lab results cache for a specific user
 * This should be called when lab results are updated
 */
export async function invalidateLabResultsCache(userId: number) {
  try {
    console.log(`[CACHE-INVALIDATION] Invalidating lab results cache for user ${userId}`);
    
    // Clear lab-related caches
    await redis.del(`lab-results:${userId}`);
    await redis.del(`lab-bookings:${userId}`);
    await redis.del(`user:${userId}`);
    
    console.log(`[CACHE-INVALIDATION] Successfully invalidated lab results cache for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[CACHE-INVALIDATION] Error invalidating lab results cache for user ${userId}:`, error);
    return false;
  }
}

/**
 * Invalidate all caches for a specific user
 * This should be called when major profile changes occur
 */
export async function invalidateAllUserCaches(userId: number, phoneNumber?: string) {
  try {
    console.log(`[CACHE-INVALIDATION] Invalidating all caches for user ${userId}`);
    
    // Clear all user-related caches
    await invalidateUserProfileCache(userId, phoneNumber);
    await invalidateSubscriptionCache(userId);
    await invalidateAppointmentCache(userId);
    await invalidateLabResultsCache(userId);
    
    console.log(`[CACHE-INVALIDATION] Successfully invalidated all caches for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[CACHE-INVALIDATION] Error invalidating all caches for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get user phone number from database
 * Helper function to get phone number for cache invalidation
 */
export async function getUserPhoneNumber(userId: number): Promise<string | null> {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true }
    });
    
    await prisma.$disconnect();
    return user?.phoneNumber || null;
  } catch (error) {
    console.error(`[CACHE-INVALIDATION] Error getting phone number for user ${userId}:`, error);
    return null;
  }
}

/**
 * Middleware function to automatically invalidate cache after database operations
 * This can be used as a wrapper around database operations
 */
export function withCacheInvalidation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  invalidateFn: (result: R) => Promise<void>
) {
  return async (...args: T): Promise<R> => {
    const result = await operation(...args);
    await invalidateFn(result);
    return result;
  };
}
