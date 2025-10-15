/**
 * Centralized cache invalidation system
 * Automatically invalidates user profile cache when data changes
 */

import redis from './redis';

// Use the Upstash Redis client from redis.ts
// This file now uses the same Redis client as the rest of the application

/**
 * Invalidate user profile cache for a specific user
 * This should be called whenever user profile data changes
 */
export async function invalidateUserProfileCache(userId: number, phoneNumber?: string) {
  try {
    // Skip Redis operations if not available
    if (!redis) {
      return true;
    }
    
    // 1. Clear Redis cache (server-side)
    if (phoneNumber) {
      await redis.del(`user:${phoneNumber}`);
    }
    
    // 2. Clear any other user-related caches
    await redis.del(`user:${userId}`);
    await redis.del(`profile:${userId}`);
    await redis.del(`subscription:${userId}`);
    
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
    // Skip Redis operations if not available
    if (!redis) {
      return true;
    }
    
    // Clear subscription-related caches
    await redis.del(`subscription:${userId}`);
    await redis.del(`plan:${userId}`);
    await redis.del(`user:${userId}`);
    
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
    // Skip Redis operations if not available
    if (!redis) {
      return true;
    }
    
    // Clear appointment-related caches
    await redis.del(`appointments:${userId}`);
    await redis.del(`user:${userId}`);
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
    // Skip Redis operations if not available
    if (!redis) {
      return true;
    }
    
    // Clear lab-related caches
    await redis.del(`lab-results:${userId}`);
    await redis.del(`lab-bookings:${userId}`);
    await redis.del(`user:${userId}`);
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
    // Clear all user-related caches
    await invalidateUserProfileCache(userId, phoneNumber);
    await invalidateSubscriptionCache(userId);
    await invalidateAppointmentCache(userId);
    await invalidateLabResultsCache(userId);
    return true;
  } catch (error) {
    console.error(`[CACHE-INVALIDATION] Error invalidating all caches for user ${userId}:`, error);
    return false;
  }
}

/**
 * Invalidate doctor profile cache for a specific doctor
 * This should be called when doctor profile data changes
 */
export async function invalidateDoctorProfileCache(doctorId: number) {
  try {
    // Skip Redis operations if not available
    if (!redis) {
      return true;
    }
    
    // Clear doctor-specific caches
    await redis.del(`doctor:profile:${doctorId}`);
    await redis.del(`doctor:availability:${doctorId}`);
    await redis.del(`doctor:appointments:${doctorId}`);
    return true;
  } catch (error) {
    console.error(`[CACHE-INVALIDATION] Error invalidating doctor profile cache for doctor ${doctorId}:`, error);
    return false;
  }
}

/**
 * Invalidate doctor list cache for a specific clinic
 * This should be called when doctors are added/removed from a clinic
 */
export async function invalidateDoctorListCache(clinicId: number) {
  try {
    // Skip Redis operations if not available
    if (!redis) {
      return true;
    }
    
    // Clear doctor list cache for the clinic
    await redis.del(`doctors:list:${clinicId}`);
    return true;
  } catch (error) {
    console.error(`[CACHE-INVALIDATION] Error invalidating doctor list cache for clinic ${clinicId}:`, error);
    return false;
  }
}

/**
 * Invalidate all doctor-related caches
 * This should be called when major doctor changes occur
 */
export async function invalidateAllDoctorCaches(doctorId: number, clinicId?: number) {
  try {
    // Clear doctor-specific caches
    await invalidateDoctorProfileCache(doctorId);
    
    // Clear clinic doctor list if clinicId provided
    if (clinicId) {
      await invalidateDoctorListCache(clinicId);
    }
    return true;
  } catch (error) {
    console.error(`[CACHE-INVALIDATION] Error invalidating all doctor caches for doctor ${doctorId}:`, error);
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
