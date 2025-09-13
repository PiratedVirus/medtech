/**
 * Client-side authentication cache to reduce middleware overhead
 * This cache stores validated JWT tokens to avoid repeated server-side verification
 */

interface CachedAuth {
  token: string;
  decodedUser: any;
  validUntil: number;
  role: string;
}

const AUTH_CACHE_KEY = 'auth_cache';
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class AuthCache {
  private static cache: Map<string, CachedAuth> = new Map();

  /**
   * Get cached authentication for a token
   */
  static getCachedAuth(token: string): CachedAuth | null {
    if (typeof window === 'undefined') return null;

    try {
      // Check memory cache first
      const memoryCache = this.cache.get(token);
      if (memoryCache && memoryCache.validUntil > Date.now()) {
        return memoryCache;
      }

      // Check localStorage cache
      const stored = localStorage.getItem(`${AUTH_CACHE_KEY}_${token.slice(-10)}`);
      if (stored) {
        const cachedAuth: CachedAuth = JSON.parse(stored);
        if (cachedAuth.validUntil > Date.now()) {
          // Restore to memory cache
          this.cache.set(token, cachedAuth);
          return cachedAuth;
        } else {
          // Expired, remove it
          localStorage.removeItem(`${AUTH_CACHE_KEY}_${token.slice(-10)}`);
        }
      }
    } catch (error) {
      console.error('Error reading auth cache:', error);
    }

    return null;
  }

  /**
   * Cache authentication result
   */
  static setCachedAuth(token: string, decodedUser: any): void {
    if (typeof window === 'undefined') return;

    try {
      const cachedAuth: CachedAuth = {
        token,
        decodedUser,
        validUntil: Date.now() + AUTH_CACHE_DURATION,
        role: decodedUser.role || decodedUser.userRole,
      };

      // Store in memory
      this.cache.set(token, cachedAuth);

      // Store in localStorage (with token suffix for key)
      localStorage.setItem(
        `${AUTH_CACHE_KEY}_${token.slice(-10)}`,
        JSON.stringify(cachedAuth)
      );
    } catch (error) {
      console.error('Error caching auth:', error);
    }
  }

  /**
   * Clear authentication cache
   */
  static clearCache(token?: string): void {
    if (typeof window === 'undefined') return;

    if (token) {
      // Clear specific token
      this.cache.delete(token);
      localStorage.removeItem(`${AUTH_CACHE_KEY}_${token.slice(-10)}`);
    } else {
      // Clear all auth cache
      this.cache.clear();
      Object.keys(localStorage)
        .filter(key => key.startsWith(AUTH_CACHE_KEY))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Check if token is likely valid without full verification
   * This is a fast, client-side check
   */
  static isTokenLikelyValid(token: string): boolean {
    if (!token) return false;

    try {
      // Basic JWT structure check
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Check if token is not obviously expired (basic payload check)
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      
      if (exp && exp * 1000 < Date.now()) {
        return false; // Token is expired
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
