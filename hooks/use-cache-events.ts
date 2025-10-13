/**
 * React Query Integration for Event-Driven Cache System
 * Connects the event-driven cache system with React Query
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CacheEventSystem } from '@/lib/cache-events';

/**
 * Hook to initialize the cache event system with React Query
 * Should be called once in your app root component
 */
export function useCacheEventSystem() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize the cache event system with React Query client
    CacheEventSystem.initialize(queryClient);
    console.log('[CACHE-EVENTS] Event system initialized with React Query');
  }, [queryClient]);
}

/**
 * Hook for manual cache invalidation using events
 * Useful for manual cache clearing in components
 */
export function useCacheEvents() {
  const queryClient = useQueryClient();

  return {
    /**
     * Manually emit doctor update event
     */
    emitDoctorUpdate: async (doctorId: number, changes: Record<string, any>, clinicId?: number) => {
      await CacheEventSystem.emit({
        eventType: 'doctor.updated' as any,
        entityId: doctorId,
        entityType: 'doctor',
        changes,
        clinicId
      });
    },

    /**
     * Manually emit user update event
     */
    emitUserUpdate: async (userId: number, changes: Record<string, any>) => {
      await CacheEventSystem.emit({
        eventType: 'user.updated' as any,
        entityId: userId,
        entityType: 'user',
        changes
      });
    },

    /**
     * Manually emit appointment event
     */
    emitAppointmentEvent: async (eventType: 'created' | 'updated' | 'cancelled' | 'completed', patientId: number, doctorId?: number) => {
      await CacheEventSystem.emit({
        eventType: `appointment.${eventType}` as any,
        entityId: patientId,
        entityType: 'appointment',
        patientId,
        doctorId
      });
    },

    /**
     * Manually emit lab result update event
     */
    emitLabResultUpdate: async (patientId: number) => {
      await CacheEventSystem.emit({
        eventType: 'lab.result_updated' as any,
        entityId: patientId,
        entityType: 'lab',
        patientId
      });
    },

    /**
     * Manually emit insights update event
     */
    emitInsightsUpdate: async (patientId: number) => {
      await CacheEventSystem.emit({
        eventType: 'insights.updated' as any,
        entityId: patientId,
        entityType: 'insights',
        patientId
      });
    },

    /**
     * Clear all caches (nuclear option)
     */
    clearAllCaches: async () => {
      await queryClient.invalidateQueries();
      console.log('[CACHE-EVENTS] All React Query caches cleared');
    }
  };
}

/**
 * Hook for automatic cache invalidation on component unmount
 * Useful for cleaning up when user navigates away
 */
export function useCacheCleanup() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      // Clean up stale queries when component unmounts
      queryClient.removeQueries();
    };
  }, [queryClient]);
}
