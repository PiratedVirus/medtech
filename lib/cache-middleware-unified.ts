/**
 * Unified Cache Middleware System
 * Eliminates repetitive code and provides uniform cache management
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheUtils, CACHE_KEYS, CACHE_TTL } from './redis';
import { CacheEvents } from './cache-events';
import { SmartCacheInvalidation } from './cache-dependencies';

/**
 * Cache Configuration Interface
 */
interface CacheConfig {
  key: string;
  ttl: number;
  entityType: 'user' | 'doctor' | 'appointment' | 'lab' | 'insights' | 'dashboard' | 'pathology' | 'plans';
  invalidateOn?: string[]; // Events that should invalidate this cache
  dependencies?: string[]; // Related cache keys that should be invalidated
}

/**
 * Unified Cache Middleware
 * Automatically handles caching for GET endpoints and invalidation for modification endpoints
 */
export function withUnifiedCache(config: CacheConfig) {
  return function(
    handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
      const method = request.method;
      
      // Handle GET requests with caching
      if (method === 'GET') {
        return await handleGetWithCache(request, handler, config);
      }
      
      // Handle modification requests with cache invalidation
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return await handleModificationWithInvalidation(request, handler, config);
      }
      
      // For other methods, just call the handler
      return await handler(request, ...args);
    };
  };
}

/**
 * Handle GET requests with caching
 */
async function handleGetWithCache(
  request: NextRequest,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: CacheConfig
): Promise<NextResponse> {
  try {
    // Try to get from cache first
    const cachedData = await cacheUtils.get(config.key);
    if (cachedData) {
      console.log(`[CACHE-MIDDLEWARE] Cache hit for ${config.key}`);
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }
    
    console.log(`[CACHE-MIDDLEWARE] Cache miss for ${config.key}, fetching from database`);
    
    // Cache miss - call the handler
    const response = await handler(request, ...args);
    
    // If successful, cache the response
    if (response.status >= 200 && response.status < 300) {
      try {
        const responseData = await response.clone().json();
        if (responseData.success && responseData.data) {
          await cacheUtils.set(config.key, responseData.data, config.ttl);
          console.log(`[CACHE-MIDDLEWARE] Cached data for ${config.key}`);
        }
      } catch (error) {
        console.error(`[CACHE-MIDDLEWARE] Error caching response for ${config.key}:`, error);
      }
    }
    
    return response;
  } catch (error) {
    console.error(`[CACHE-MIDDLEWARE] Error in cache handling for ${config.key}:`, error);
    // Fallback to handler without caching
    return await handler(request, ...args);
  }
}

/**
 * Handle modification requests with cache invalidation
 */
async function handleModificationWithInvalidation(
  request: NextRequest,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: CacheConfig
): Promise<NextResponse> {
  try {
    // Call the handler first
    const response = await handler(request, ...args);
    
    // If successful, invalidate caches
    if (response.status >= 200 && response.status < 300) {
      await invalidateCaches(request, config);
    }
    
    return response;
  } catch (error) {
    console.error(`[CACHE-MIDDLEWARE] Error in modification handling for ${config.key}:`, error);
    return await handler(request, ...args);
  }
}

/**
 * Invalidate caches based on configuration
 */
async function invalidateCaches(request: NextRequest, config: CacheConfig): Promise<void> {
  try {
    // Extract entity information from request
    const body = await request.clone().json().catch(() => ({}));
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    
    // Extract IDs from URL or body
    const entityId = extractEntityId(pathSegments, body);
    const patientId = body.patientId || body.userId;
    const doctorId = body.doctorId;
    const clinicId = body.clinicId;
    
    console.log(`[CACHE-MIDDLEWARE] Invalidating caches for ${config.entityType}`, {
      entityId,
      patientId,
      doctorId,
      clinicId
    });
    
    // Invalidate primary cache
    await cacheUtils.invalidate(config.key);
    
    // Invalidate dependencies
    if (config.dependencies) {
      for (const dependency of config.dependencies) {
        await cacheUtils.invalidate(dependency);
      }
    }
    
    // Emit appropriate events for event-driven invalidation
    await emitInvalidationEvents(config.entityType, entityId, patientId, doctorId, clinicId, body);
    
    console.log(`[CACHE-MIDDLEWARE] Successfully invalidated caches for ${config.entityType}`);
  } catch (error) {
    console.error(`[CACHE-MIDDLEWARE] Error invalidating caches:`, error);
  }
}

/**
 * Extract entity ID from URL segments or request body
 */
function extractEntityId(pathSegments: string[], body: any): number | undefined {
  // Try to extract from URL segments (e.g., /api/users/123)
  for (let i = pathSegments.length - 1; i >= 0; i--) {
    const segment = pathSegments[i];
    if (segment && !isNaN(Number(segment))) {
      return Number(segment);
    }
  }
  
  // Try to extract from body
  return body.id || body.userId || body.patientId || body.doctorId;
}

/**
 * Emit appropriate invalidation events
 */
async function emitInvalidationEvents(
  entityType: string,
  entityId: number | undefined,
  patientId: number | undefined,
  doctorId: number | undefined,
  clinicId: number | undefined,
  changes: any
): Promise<void> {
  try {
    switch (entityType) {
      case 'user':
        if (entityId) {
          await CacheEvents.userUpdated(entityId, changes);
        }
        break;
        
      case 'doctor':
        if (entityId) {
          await CacheEvents.doctorUpdated(entityId, changes, clinicId);
        }
        break;
        
      case 'appointment':
        if (patientId) {
          await CacheEvents.appointmentCreated(patientId, doctorId);
        }
        break;
        
      case 'lab':
        if (patientId) {
          await CacheEvents.labResultUpdated(patientId);
        }
        break;
        
      case 'insights':
        if (patientId) {
          await CacheEvents.insightsUpdated(patientId);
        }
        break;
        
      case 'dashboard':
        // Dashboard caches are invalidated by other events
        break;
        
      case 'pathology':
        // Pathology caches are invalidated by lab events
        break;
        
      case 'plans':
        // Plans caches are invalidated by subscription events
        break;
    }
  } catch (error) {
    console.error(`[CACHE-MIDDLEWARE] Error emitting invalidation events:`, error);
  }
}

/**
 * Predefined cache configurations for common endpoints
 */
export const CACHE_CONFIGS = {
  // User-related endpoints
  USER_PROFILE: {
    key: 'user:profile',
    ttl: CACHE_TTL.USER_PROFILE,
    entityType: 'user' as const,
    dependencies: ['user:subscription:*', 'user:appointments:*']
  },
  
  USER_INSIGHTS: {
    key: 'user:insights',
    ttl: CACHE_TTL.INSIGHTS,
    entityType: 'insights' as const,
    dependencies: ['user:profile:*']
  },
  
  USER_APPOINTMENTS: {
    key: 'user:appointments',
    ttl: CACHE_TTL.APPOINTMENTS,
    entityType: 'appointment' as const,
    dependencies: ['user:profile:*', 'doctor:availability:*']
  },
  
  USER_LABS: {
    key: 'user:labs',
    ttl: CACHE_TTL.APPOINTMENTS, // Same TTL as appointments
    entityType: 'lab' as const,
    dependencies: ['user:profile:*', 'pathology:*']
  },
  
  // Doctor-related endpoints
  DOCTOR_PROFILE: {
    key: 'doctor:profile',
    ttl: CACHE_TTL.ADMIN_PROFILE,
    entityType: 'doctor' as const,
    dependencies: ['doctor:availability:*', 'appointments:*']
  },
  
  DOCTOR_APPOINTMENTS: {
    key: 'doctor:appointments',
    ttl: CACHE_TTL.APPOINTMENTS,
    entityType: 'appointment' as const,
    dependencies: ['doctor:profile:*', 'user:appointments:*']
  },
  
  DOCTOR_EARNINGS: {
    key: 'doctor:earnings',
    ttl: CACHE_TTL.ADMIN_PROFILE,
    entityType: 'doctor' as const,
    dependencies: ['doctor:profile:*', 'appointments:*']
  },
  
  // Admin-related endpoints
  ADMIN_DASHBOARD: {
    key: 'admin:dashboard',
    ttl: CACHE_TTL.DASHBOARD_SUMMARY,
    entityType: 'dashboard' as const,
    dependencies: ['user:profile:*', 'appointments:*', 'lab:*']
  },
  
  ADMIN_USERS: {
    key: 'admin:users',
    ttl: CACHE_TTL.ADMIN_PROFILE,
    entityType: 'user' as const,
    dependencies: ['admin:dashboard:*']
  },
  
  ADMIN_PATIENTS: {
    key: 'admin:patients',
    ttl: CACHE_TTL.ADMIN_PROFILE,
    entityType: 'user' as const,
    dependencies: ['admin:dashboard:*', 'user:profile:*']
  },
  
  // Pathology-related endpoints
  PATHOLOGY_APPOINTMENTS: {
    key: 'pathology:appointments',
    ttl: CACHE_TTL.PATHOLOGY_APPOINTMENTS,
    entityType: 'pathology' as const,
    dependencies: ['lab:*', 'user:labs:*']
  },
  
  // Plans-related endpoints
  PLANS_DATA: {
    key: 'plans:data',
    ttl: CACHE_TTL.PLANS_DATA,
    entityType: 'plans' as const,
    dependencies: ['user:subscription:*']
  }
};

/**
 * Helper function to create cache key with parameters
 */
export function createCacheKey(baseKey: string, ...params: (string | number)[]): string {
  const paramString = params.filter(p => p !== undefined && p !== null).join(':');
  return paramString ? `${baseKey}:${paramString}` : baseKey;
}

/**
 * Helper function to get cache configuration for an endpoint
 */
export function getCacheConfig(endpoint: string, params: Record<string, any> = {}): CacheConfig {
  const endpointMap: Record<string, CacheConfig> = {
    '/api/(end-user)/profile': CACHE_CONFIGS.USER_PROFILE,
    '/api/(end-user)/insights': CACHE_CONFIGS.USER_INSIGHTS,
    '/api/(end-user)/appointments': CACHE_CONFIGS.USER_APPOINTMENTS,
    '/api/(end-user)/labs': CACHE_CONFIGS.USER_LABS,
    '/api/admin/doctors': CACHE_CONFIGS.DOCTOR_PROFILE,
    '/api/doctor/appointments': CACHE_CONFIGS.DOCTOR_APPOINTMENTS,
    '/api/doctor/earnings': CACHE_CONFIGS.DOCTOR_EARNINGS,
    '/api/admin/dashboard/summary': CACHE_CONFIGS.ADMIN_DASHBOARD,
    '/api/admin/users': CACHE_CONFIGS.ADMIN_USERS,
    '/api/admin/patients': CACHE_CONFIGS.ADMIN_PATIENTS,
    '/api/pathology/upcoming-appointments': CACHE_CONFIGS.PATHOLOGY_APPOINTMENTS,
    '/api/(end-user)/plans': CACHE_CONFIGS.PLANS_DATA
  };
  
  const config = endpointMap[endpoint];
  if (!config) {
    throw new Error(`No cache configuration found for endpoint: ${endpoint}`);
  }
  
  // Create dynamic cache key with parameters
  const dynamicKey = createCacheKey(config.key, ...Object.values(params));
  
  return {
    ...config,
    key: dynamicKey
  };
}
