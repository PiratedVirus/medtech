import axios from 'axios';

// Global cache-busting configuration for admin APIs
const CACHE_BUSTING_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

// Create cache-busting axios instance for admin APIs
export const adminApiClient = axios.create({
  headers: CACHE_BUSTING_HEADERS,
  withCredentials: true // Include cookies for authentication
});

// Utility function to add cache-busting to any URL
export const addCacheBusting = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
};

// Utility function to make cache-busting API calls
export const fetchWithCacheBusting = async (url: string, options: any = {}) => {
  const cacheBustedUrl = addCacheBusting(url);
  return axios.get(cacheBustedUrl, {
    ...options,
    withCredentials: true, // Include cookies for authentication
    headers: {
      ...CACHE_BUSTING_HEADERS,
      ...options.headers
    }
  });
};

// Utility function to clear all admin-related caches
export const clearAdminCache = () => {
  // Clear any localStorage/sessionStorage admin data
  if (typeof window !== 'undefined') {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('admin') || key.includes('clinic'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage as well
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('admin') || key.includes('clinic'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
  }
};

// Force refresh all admin data
export const refreshAdminData = () => {
  clearAdminCache();
  // Trigger a page reload to clear all React state
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};
