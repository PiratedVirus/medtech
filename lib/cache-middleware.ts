/**
 * Cache invalidation middleware
 * Automatically invalidates cache after database operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { invalidateAllUserCaches, getUserPhoneNumber } from './cache-invalidation';

/**
 * Middleware to automatically invalidate user cache after operations
 * Usage: Apply this to any endpoint that modifies user data
 */
export function withCacheInvalidation(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const response = await handler(request, ...args);
    
    // Only invalidate cache if the operation was successful
    if (response.status >= 200 && response.status < 300) {
      try {
        // Extract user ID from request body or params
        const body = await request.clone().json().catch(() => ({}));
        const userId = body.userId || body.patientId || body.id;
        
        if (userId) {
          const phoneNumber = await getUserPhoneNumber(Number(userId));
          await invalidateAllUserCaches(Number(userId), phoneNumber || undefined);
          console.log(`[CACHE-MIDDLEWARE] Cache invalidated for user ${userId}`);
        }
      } catch (error) {
        console.error('[CACHE-MIDDLEWARE] Error invalidating cache:', error);
        // Don't fail the request if cache invalidation fails
      }
    }
    
    return response;
  };
}

/**
 * Specific cache invalidation for subscription operations
 */
export function withSubscriptionCacheInvalidation(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const response = await handler(request, ...args);
    
    if (response.status >= 200 && response.status < 300) {
      try {
        const body = await request.clone().json().catch(() => ({}));
        const userId = body.patientId || body.userId;
        
        if (userId) {
          const phoneNumber = await getUserPhoneNumber(Number(userId));
          await invalidateAllUserCaches(Number(userId), phoneNumber || undefined);
          console.log(`[SUBSCRIPTION-CACHE] Cache invalidated for user ${userId} after subscription change`);
        }
      } catch (error) {
        console.error('[SUBSCRIPTION-CACHE] Error invalidating cache:', error);
      }
    }
    
    return response;
  };
}

/**
 * Specific cache invalidation for profile operations
 */
export function withProfileCacheInvalidation(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const response = await handler(request, ...args);
    
    if (response.status >= 200 && response.status < 300) {
      try {
        const body = await request.clone().json().catch(() => ({}));
        const userId = body.userId || body.id;
        
        if (userId) {
          const phoneNumber = await getUserPhoneNumber(Number(userId));
          await invalidateAllUserCaches(Number(userId), phoneNumber || undefined);
          console.log(`[PROFILE-CACHE] Cache invalidated for user ${userId} after profile change`);
        }
      } catch (error) {
        console.error('[PROFILE-CACHE] Error invalidating cache:', error);
      }
    }
    
    return response;
  };
}
