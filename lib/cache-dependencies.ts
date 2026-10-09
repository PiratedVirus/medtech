/**
 * Cache dependency management
 * Defines relationships between different cache keys for automatic invalidation
 */

import { invalidateAllUserCaches, invalidateAllDoctorCaches } from './cache-invalidation';
import { cacheUtils, CACHE_KEYS } from './redis';

/**
 * Cache dependency mappings
 * When a primary cache is invalidated, related caches should also be invalidated
 */
export const CACHE_DEPENDENCIES = {
  // Doctor-related dependencies
  'doctor_profile': [
    'appointments:*',           // Patient appointment lists (show doctor info)
    'doctor_availability:*',    // Doctor availability slots
    'admin_dashboard:*',        // Admin dashboard (doctor stats)
    'patient_booking:*',        // Patient booking forms (show current fee)
    'doctor_list:*'             // Doctor lists in admin panels
  ],
  
  // User-related dependencies
  'user_profile': [
    'subscriptions:*',         // User subscription data
    'appointments:*',          // User appointments
    'lab_results:*',           // User lab data
    'insights:*',              // User health insights
    'notifications:*'          // User notifications
  ],
  
  // Appointment-related dependencies
  'appointments': [
    'doctor_appointments:*',   // Doctor's appointment lists
    'admin_dashboard:*',       // Admin dashboard stats
    'patient_profile:*',       // Patient profile (appointment count)
    'doctor_availability:*'    // Doctor availability (affects booking)
  ],
  
  // Lab-related dependencies
  'lab_results': [
    'patient_profile:*',       // Patient profile (lab count)
    'insights:*',              // Health insights
    'admin_dashboard:*'        // Admin dashboard (lab stats)
  ],
  
  // Subscription-related dependencies
  'subscriptions': [
    'user_profile:*',          // User profile (plan info)
    'appointments:*',          // Appointment eligibility
    'admin_dashboard:*'        // Admin dashboard (subscription stats)
  ]
} as const;

/**
 * Invalidate cache with dependencies
 * When a primary cache is invalidated, automatically invalidate related caches
 */
export async function invalidateWithDependencies(
  primaryKey: string, 
  userId?: number, 
  doctorId?: number, 
  clinicId?: number
): Promise<void> {
  try {
    console.log(`[CACHE-DEPENDENCIES] Invalidating ${primaryKey} with dependencies`);
    
    // Get dependencies for the primary key
    const dependencies = CACHE_DEPENDENCIES[primaryKey as keyof typeof CACHE_DEPENDENCIES] || [];
    
    // Invalidate primary cache
    if (primaryKey === 'doctor_profile' && doctorId) {
      await invalidateAllDoctorCaches(doctorId, clinicId);
    } else if (primaryKey === 'user_profile' && userId) {
      const { getUserPhoneNumber } = await import('./cache-invalidation');
      const phoneNumber = await getUserPhoneNumber(userId);
      await invalidateAllUserCaches(userId, phoneNumber || undefined);
    }
    
    // Invalidate dependent caches using patterns
    for (const dependency of dependencies) {
      if (dependency.includes('*')) {
        // Pattern-based invalidation
        await cacheUtils.invalidate(dependency);
        console.log(`[CACHE-DEPENDENCIES] Invalidated pattern: ${dependency}`);
      } else {
        // Specific key invalidation
        await cacheUtils.invalidate(dependency);
        console.log(`[CACHE-DEPENDENCIES] Invalidated key: ${dependency}`);
      }
    }
    
    console.log(`[CACHE-DEPENDENCIES] Successfully invalidated ${primaryKey} with ${dependencies.length} dependencies`);
  } catch (error) {
    console.error(`[CACHE-DEPENDENCIES] Error invalidating ${primaryKey} with dependencies:`, error);
  }
}

/**
 * Smart cache invalidation based on operation type
 */
export class SmartCacheInvalidation {
  /**
   * Invalidate caches when doctor profile changes
   */
  static async onDoctorUpdate(doctorId: number, changes: any, clinicId?: number) {
    console.log(`[SMART-CACHE] Doctor ${doctorId} updated, invalidating related caches`);
    
    // Always invalidate doctor profile
    await invalidateWithDependencies('doctor_profile', undefined, doctorId, clinicId);
    
    // If consultation fee changed, invalidate appointment-related caches
    if (changes.consultationFee) {
      await invalidateWithDependencies('appointments', undefined, doctorId, clinicId);
      console.log(`[SMART-CACHE] Consultation fee changed, invalidated appointment caches`);
    }
    
    // If doctor status changed, invalidate availability caches
    if (changes.status) {
      await cacheUtils.invalidate(`doctor:availability:${doctorId}`);
      console.log(`[SMART-CACHE] Doctor status changed, invalidated availability cache`);
    }
  }
  
  /**
   * Invalidate caches when user profile changes
   */
  static async onUserUpdate(userId: number, changes: any) {
    console.log(`[SMART-CACHE] User ${userId} updated, invalidating related caches`);
    
    // Always invalidate user profile
    await invalidateWithDependencies('user_profile', userId);
    
    // If subscription changed, invalidate subscription-related caches
    if (changes.subscriptionId || changes.planId) {
      await invalidateWithDependencies('subscriptions', userId);
      console.log(`[SMART-CACHE] Subscription changed, invalidated subscription caches`);
    }
  }
  
  /**
   * Invalidate caches when appointment changes
   */
  static async onAppointmentUpdate(patientId: number, doctorId?: number) {
    console.log(`[SMART-CACHE] Appointment updated for patient ${patientId}, invalidating related caches`);
    
    // Invalidate patient appointment caches
    await invalidateWithDependencies('appointments', patientId);
    
    // If doctor is involved, invalidate doctor appointment caches
    if (doctorId) {
      await cacheUtils.invalidate(CACHE_KEYS.DOCTOR_APPOINTMENTS_PATTERN(doctorId));
      console.log(`[SMART-CACHE] Invalidated doctor appointment cache for doctor ${doctorId}`);
    }
  }
  
  /**
   * Invalidate caches when lab results change
   */
  static async onLabResultUpdate(patientId: number) {
    console.log(`[SMART-CACHE] Lab results updated for patient ${patientId}, invalidating related caches`);
    
    // Invalidate lab result caches
    await invalidateWithDependencies('lab_results', patientId);
    
    // Also invalidate insights as lab results affect health insights
    await cacheUtils.invalidate(`insights:${patientId}`);
    console.log(`[SMART-CACHE] Invalidated insights cache for patient ${patientId}`);
  }
}
