/**
 * Unified Cache Middleware System
 * Eliminates repetitive code and provides uniform cache management
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
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
        return await handleGetWithCache(request, handler, config, args);
      }
      
      // Handle modification requests with cache invalidation
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return await handleModificationWithInvalidation(request, handler, config, args);
      }
      
      // For other methods, just call the handler
      return await handler(request, ...args);
    };
  };
}

/**
 * Extract path parameters from URL for dynamic routes
 */
function extractPathParams(url: string, endpoint: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlPath = new URL(url).pathname;
  const urlSegments = urlPath.split('/').filter(Boolean);
  const endpointSegments = endpoint.split('/').filter(Boolean);
  
  // Match dynamic segments like [patientId]
  for (let i = 0; i < endpointSegments.length && i < urlSegments.length; i++) {
    const endpointSegment = endpointSegments[i];
    if (endpointSegment.startsWith('[') && endpointSegment.endsWith(']')) {
      const paramName = endpointSegment.slice(1, -1);
      params[paramName] = urlSegments[i];
    }
  }
  
  return params;
}

/**
 * Handle GET requests with caching
 */
/**
 * Extract doctor identifier from JWT token for doctor-specific endpoints
 * Uses phoneNumber as unique identifier since each doctor has unique phone
 */
async function extractDoctorIdentifier(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded?.plusAddedPhoneNumber || null;
  } catch {
    return null;
  }
}

async function handleGetWithCache(
  request: NextRequest,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: CacheConfig,
  args: any[]
): Promise<NextResponse> {
  try {
    // Extract path parameters from URL if this is a dynamic route
    const url = request.url;
    let cacheKey = config.key;
    
    // Check if this is a dynamic route and extract parameters
    if (config.key.includes('patient:all-values')) {
      const pathParams = extractPathParams(url, '/api/patient/[patientId]/all-values');
      if (pathParams.patientId) {
        cacheKey = `${config.key}:${pathParams.patientId}`;
      }
    }
    
    // Extract appointmentId from URL for doctor appointment detail endpoint
    if (config.key.includes('doctor:appointments') && url.includes('/appointments/')) {
      const pathParams = extractPathParams(url, '/api/doctor/appointments/[appointmentId]');
      if (pathParams.appointmentId) {
        cacheKey = `${config.key}:${pathParams.appointmentId}`;
      }
    }
    
    // For doctor-specific endpoints, extract doctor identifier from token
    if (config.entityType === 'doctor' || config.key.startsWith('doctor:')) {
      const doctorIdentifier = await extractDoctorIdentifier();
      if (doctorIdentifier) {
        // Use phoneNumber as unique identifier for cache key
        cacheKey = `${config.key}:${doctorIdentifier}`;
      }
    }
    
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      // Validate cached appointment data has required fields
      if (config.key.includes('doctor:appointments') && cacheKey.includes(':')) {
        // For appointment detail endpoint, ensure patientId exists
        if (!(cachedData as any).patientId) {
          console.warn(`[CACHE-MIDDLEWARE] Invalid cached appointment data (missing patientId) for ${cacheKey}, refetching...`);
          await cacheUtils.invalidate(cacheKey);
          // Fall through to fetch fresh data
        } else {
          const response = NextResponse.json({
            success: true,
            data: cachedData,
            cached: true
          });
          // Prevent browser caching - ensure fresh data on every request
          response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          response.headers.set('Pragma', 'no-cache');
          response.headers.set('Expires', '0');
          return response;
        }
      } else {
        const response = NextResponse.json({
          success: true,
          data: cachedData,
          cached: true
        });
        // Prevent browser caching - ensure fresh data on every request
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
      }
    }
    
    // Cache miss - call the handler
    const response = await handler(request, ...args);
    
    // If successful, cache the response
    if (response.status >= 200 && response.status < 300) {
      try {
        const responseData = await response.clone().json();
        if (responseData.success && responseData.data) {
          await cacheUtils.set(cacheKey, responseData.data, config.ttl);
          
          // Warm related caches after successful cache miss
          if (config.entityType === 'doctor' || config.key.startsWith('doctor:')) {
            const doctorIdentifier = await extractDoctorIdentifier();
            if (doctorIdentifier) {
              // Import and call warmRelatedCaches (non-blocking)
              import('@/lib/cache-warming').then(({ warmRelatedCaches }) => {
                warmRelatedCaches(request.url, doctorIdentifier, responseData.data).catch(() => {
                  // Silently fail - cache warming is best effort
                });
              }).catch(() => {
                // Silently fail if import fails
              });
            }
          }
        }
      } catch (error) {
        console.error(`[CACHE-MIDDLEWARE] Error caching response for ${cacheKey}:`, error);
      }
    }
    
    // Prevent browser caching - ensure fresh data on every request
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error(`[CACHE-MIDDLEWARE] Error in cache handling for ${config.key}:`, error);
    // Fallback to handler without caching
    const response = await handler(request, ...args);
    // Still prevent browser caching even on fallback
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }
}

/**
 * Handle modification requests with cache invalidation
 */
async function handleModificationWithInvalidation(
  request: NextRequest,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: CacheConfig,
  args: any[]
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
  
  PATIENT_ALL_VALUES: {
    key: 'patient:all-values',
    ttl: CACHE_TTL.APPOINTMENTS, // Same TTL as appointments
    entityType: 'lab' as const,
    dependencies: ['user:labs:*', 'pathology:*', 'lab:*']
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
  
  DOCTOR_CLINIC_INFO: {
    key: 'doctor:clinic-info',
    ttl: CACHE_TTL.ADMIN_PROFILE,
    entityType: 'doctor' as const,
    dependencies: ['doctor:profile:*']
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
  
  ADMIN_STANDALONE_REPORTS: {
    key: 'admin:standalone-reports',
    ttl: CACHE_TTL.ADMIN_PROFILE,
    entityType: 'lab' as const,
    dependencies: ['admin:dashboard:*', 'lab:*', 'pathology:*']
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
  },
  
  PLANS_USAGE: {
    key: 'plans:usage',
    ttl: CACHE_TTL.PLANS_DATA,
    entityType: 'plans' as const,
    dependencies: ['user:subscription:*', 'plans:data']
  },
  
  ADMIN_PLANS: {
    key: 'admin:plans',
    ttl: CACHE_TTL.PLANS_DATA,
    entityType: 'plans' as const,
    dependencies: ['plans:data', 'user:subscription:*']
  },
  
  DIET_PLAN: {
    key: 'diet:plan',
    ttl: CACHE_TTL.DIET_PLAN,
    entityType: 'user' as const,
    dependencies: ['user:profile:*']
  },
  
  DOCTOR_DIET_PLANS: {
    key: 'doctor:diet-plans',
    ttl: CACHE_TTL.DIET_PLAN,
    entityType: 'user' as const,
    dependencies: ['diet:plan:*', 'user:profile:*', 'doctor:profile:*']
  },
  
  // Superadmin-related endpoints
  SUPERADMIN_ADMINS: {
    key: 'superadmin:admins',
    ttl: CACHE_TTL.ADMIN_PROFILE,
    entityType: 'user' as const,
    dependencies: ['admin:dashboard:*', 'user:profile:*']
  },
  
  SUPERADMIN_DASHBOARD_STATS: {
    key: 'superadmin:dashboard:stats',
    ttl: CACHE_TTL.DASHBOARD_SUMMARY,
    entityType: 'dashboard' as const,
    dependencies: ['admin:dashboard:*', 'user:profile:*', 'clinic:*']
  },
  
  SUPERADMIN_ANALYTICS: {
    key: 'superadmin:analytics',
    ttl: CACHE_TTL.DASHBOARD_SUMMARY,
    entityType: 'dashboard' as const,
    dependencies: ['superadmin:dashboard:stats', 'admin:dashboard:*', 'user:profile:*', 'clinic:*']
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
    '/api/patient/[patientId]/all-values': CACHE_CONFIGS.PATIENT_ALL_VALUES,
    '/api/admin/doctors': CACHE_CONFIGS.DOCTOR_PROFILE,
    '/api/doctor/appointments': CACHE_CONFIGS.DOCTOR_APPOINTMENTS,
    '/api/doctor/appointments/all': CACHE_CONFIGS.DOCTOR_APPOINTMENTS,
    '/api/doctor/appointments/upcoming': CACHE_CONFIGS.DOCTOR_APPOINTMENTS,
    '/api/doctor/appointments/[appointmentId]': CACHE_CONFIGS.DOCTOR_APPOINTMENTS,
    '/api/doctor/earnings': CACHE_CONFIGS.DOCTOR_EARNINGS,
    '/api/doctor/clinic-info': CACHE_CONFIGS.DOCTOR_CLINIC_INFO,
    '/api/admin/dashboard/summary': CACHE_CONFIGS.ADMIN_DASHBOARD,
    '/api/admin/users': CACHE_CONFIGS.ADMIN_USERS,
    '/api/admin/patients': CACHE_CONFIGS.ADMIN_PATIENTS,
    '/api/admin/standalone-reports': CACHE_CONFIGS.ADMIN_STANDALONE_REPORTS,
    '/api/pathology/upcoming-appointments': CACHE_CONFIGS.PATHOLOGY_APPOINTMENTS,
    '/api/(end-user)/plans': CACHE_CONFIGS.PLANS_DATA,
    '/api/(end-user)/plans/planUsage': CACHE_CONFIGS.PLANS_USAGE,
    '/api/admin/plans': CACHE_CONFIGS.ADMIN_PLANS,
    '/api/(end-user)/dieticians/diet': CACHE_CONFIGS.DIET_PLAN,
    '/api/doctor/diet-plans': CACHE_CONFIGS.DOCTOR_DIET_PLANS,
    '/api/superadmin/admins': CACHE_CONFIGS.SUPERADMIN_ADMINS,
    '/api/superadmin/dashboard/stats': CACHE_CONFIGS.SUPERADMIN_DASHBOARD_STATS,
    '/api/superadmin/analytics': CACHE_CONFIGS.SUPERADMIN_ANALYTICS
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
