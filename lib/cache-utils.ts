import { QueryClient } from '@tanstack/react-query';

/**
 * Cache utility functions for managing React Query cache
 * This provides a centralized way to clear different types of cached data
 */

// Helper function to clear all health insights related cache
export const clearHealthInsightsCache = (queryClient: QueryClient) => {
  console.log('[clearHealthInsightsCache] Clearing all health insights cache');
  
  // Clear all health insights related queries
  queryClient.removeQueries({ queryKey: ['insightsPanel'] });
  queryClient.removeQueries({ queryKey: ['insights'] });
  queryClient.removeQueries({ queryKey: ['health-insights'] });
  queryClient.removeQueries({ queryKey: ['insights', ''] });
  
  // Clear any queries that might contain patient-specific data
  queryClient.removeQueries({ 
    predicate: (query) => {
      const queryKey = query.queryKey;
      return Array.isArray(queryKey) && (
        queryKey.includes('insights') || 
        queryKey.includes('health-insights') ||
        queryKey.includes('insightsPanel')
      );
    }
  });
  
  // Also clear any queries that might have patientId in the key
  queryClient.removeQueries({ 
    predicate: (query) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey)) {
        // Check if any part of the query key contains 'insights' or looks like a patient-specific query
        return queryKey.some(key => 
          typeof key === 'string' && (
            key.includes('insights') || 
            key.includes('health-insights') ||
            key.includes('insightsPanel')
          )
        ) || queryKey.some(key => 
          typeof key === 'number' && key > 0 // Patient IDs are typically positive numbers
        );
      }
      return false;
    }
  });
};

// Helper function to clear all user-specific cache
export const clearUserSpecificCache = (queryClient: QueryClient) => {
  console.log('[clearUserSpecificCache] Clearing all user-specific cache');
  
  // Clear health insights cache
  clearHealthInsightsCache(queryClient);
  
  // Clear other user-specific queries
  queryClient.removeQueries({ 
    predicate: (query) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey)) {
        return queryKey.some(key => 
          typeof key === 'string' && (
            key.includes('appointments') ||
            key.includes('labResults') ||
            key.includes('notifications') ||
            key.includes('profile')
          )
        );
      }
      return false;
    }
  });
};

// Helper function to clear all cache (for logout)
export const clearAllCache = (queryClient: QueryClient) => {
  console.log('[clearAllCache] Clearing all cache');
  
  // Clear all queries
  queryClient.clear();
};

// Helper function to clear cache when user changes
export const clearCacheOnUserChange = (queryClient: QueryClient, previousUserId: string | null, currentUserId: string | null) => {
  if (previousUserId && previousUserId !== currentUserId) {
    console.log('[clearCacheOnUserChange] User changed, clearing cache', {
      previousUserId,
      currentUserId
    });
    clearUserSpecificCache(queryClient);
  }
};
