/**
 * Utility script to clear all appointment-related caches
 * Run with: npx tsx scripts/clear-appointment-cache.ts
 */

import { cacheUtils } from '../lib/redis';

async function clearAppointmentCaches() {
  try {
    console.log('🔄 Clearing appointment caches...');
    
    // Clear all doctor appointment caches
    await cacheUtils.invalidate('doctor:appointments:*');
    console.log('✅ Cleared doctor:appointments:* caches');
    
    // Clear all user appointment caches
    await cacheUtils.invalidate('appointments:*');
    console.log('✅ Cleared appointments:* caches');
    
    console.log('✨ All appointment caches cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
    process.exit(1);
  }
}

clearAppointmentCaches();
