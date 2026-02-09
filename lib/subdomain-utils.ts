/**
 * Utility functions for subdomain extraction
 * These functions are safe to use in Edge Runtime (no Prisma dependency)
 */

/**
 * Extract subdomain from hostname
 * Examples:
 * - clinic1.yourdomain.com -> "clinic1"
 * - clinic1.test.yourdomain.com -> "clinic1" (handles nested subdomains for dev/staging)
 * - clinic1.yourdomain.com:3000 -> "clinic1"
 * - test.yourdomain.com -> null (environment subdomain, not clinic)
 * - localhost:3000 -> null (no subdomain)
 * - yourdomain.com -> null (no subdomain)
 */
export function extractSubdomain(hostname: string): string | null {
  const hostWithoutPort = hostname.split(':')[0];
  
  // Custom Domain Mapping (Add your custom domains here)
  // This allows mapping a specific domain (like app.brahmarex.com) to a specific clinic slug
  const customMappings: Record<string, string> = {
    'app.brahmarex.com': 'brahmarex',
    'portal.brahmarex.com': 'brahmarex',
    // Add more mappings as needed
  };
  
  if (customMappings[hostWithoutPort]) {
    return customMappings[hostWithoutPort];
  }

  // Skip localhost and IP addresses
  if (hostWithoutPort === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)) {
    return null;
  }

  // Split by dots
  const parts = hostWithoutPort.split('.');
  
  // Handle nested subdomains for dev/staging environments
  // Examples:
  // - clinic1.test.abc.com -> ["clinic1", "test", "abc", "com"] -> return "clinic1"
  // - clinic1.abc.com -> ["clinic1", "abc", "com"] -> return "clinic1"
  // - test.abc.com -> ["test", "abc", "com"] -> return null (environment subdomain)
  
  if (parts.length >= 4) {
    // 4+ parts: 
    // - manipal.dev.carediabetics.com -> ["manipal", "dev", "carediabetics", "com"] -> return "manipal"
    // - www.manipal.dev.carediabetics.com -> ["www", "manipal", "dev", "carediabetics", "com"] -> return "manipal" (skip www)
    // - clinic1.test.abc.com -> ["clinic1", "test", "abc", "com"] -> return "clinic1"
    
    // Skip "www" prefix if present
    const firstPart = parts[0].toLowerCase();
    if (firstPart === 'www' && parts.length >= 5) {
      // www.clinic.env.domain.com -> return clinic (second part) normalized
      return parts[1].toLowerCase();
    }
    
    // Otherwise, first part is clinic subdomain (normalize to lowercase)
    return parts[0].toLowerCase();
  }
  
  if (parts.length === 3) {
    // 3 parts: clinic1.abc.com, test.abc.com, or clinic1-test.abc.com
    const firstPart = parts[0].toLowerCase();
    const knownEnvironments = ['test', 'dev', 'staging', 'preview', 'demo'];
    
    // If it's a known environment subdomain, return null (not a clinic)
    if (knownEnvironments.includes(firstPart)) {
      return null;
    }
    
    // Handle pattern: clinic1-test.abc.com or clinic1-dev.abc.com
    // Extract clinic name before the hyphen
    if (firstPart.includes('-')) {
      const clinicPart = firstPart.split('-')[0];
      // Only return if there's a valid clinic name before the hyphen
      if (clinicPart && clinicPart.length > 0) {
        return clinicPart;
      }
    }
    
    // Otherwise, it's a clinic subdomain (clinic1.abc.com) - normalize to lowercase
    return parts[0].toLowerCase();
  }

  // If only 2 parts, check if it's a subdomain (e.g., in development)
  // For development: clinic1.localhost -> ["clinic1", "localhost"]
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0].toLowerCase();
  }

  // 2 parts in production means no subdomain (yourdomain.com)
  return null;
}
