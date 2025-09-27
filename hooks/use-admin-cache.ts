import { useCallback } from 'react';
import { clearAdminCache, refreshAdminData } from '@/lib/admin-api-client';

export const useAdminCache = () => {
  const clearCache = useCallback(() => {
    console.log('Clearing admin cache...');
    clearAdminCache();
  }, []);

  const refreshData = useCallback(() => {
    console.log('Refreshing admin data...');
    refreshAdminData();
  }, []);

  const forceRefresh = useCallback(() => {
    console.log('Force refreshing admin data...');
    clearCache();
    // Trigger a page reload to clear all React state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, [clearCache]);

  return {
    clearCache,
    refreshData,
    forceRefresh
  };
};
