import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Cache for clinic lookups (in-memory cache)
const clinicCache = new Map<string, { clinicId: number | null; validUntil: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

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
  // Remove port if present
  const hostWithoutPort = hostname.split(':')[0];
  
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

/**
 * Get clinic ID from subdomain
 * Uses caching to reduce database queries
 */
export async function getClinicIdFromSubdomain(subdomain: string): Promise<number | null> {
  // Normalize subdomain to lowercase for consistent lookup
  const normalizedSubdomain = subdomain.toLowerCase().trim();
  
  // Check cache first
  const cached = clinicCache.get(normalizedSubdomain);
  if (cached && cached.validUntil > Date.now()) {
    return cached.clinicId;
  }

  try {
    // Use case-insensitive lookup by normalizing in query
    // PostgreSQL is case-sensitive by default, so we need to use LOWER() or ILIKE
    const clinic = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM "Clinic" 
      WHERE LOWER(subdomain) = LOWER(${normalizedSubdomain})
      AND "deletedAt" IS NULL
      LIMIT 1
    `;

    const clinicId = clinic && clinic.length > 0 ? clinic[0].id : null;

    // Log for debugging (remove in production if too verbose)
    if (!clinicId) {
      console.log(`[Clinic Lookup] Subdomain "${normalizedSubdomain}" not found in database`);
    } else {
      console.log(`[Clinic Lookup] Found clinic ID ${clinicId} for subdomain "${normalizedSubdomain}"`);
    }

    // Cache the result
    clinicCache.set(normalizedSubdomain, {
      clinicId,
      validUntil: Date.now() + CACHE_DURATION
    });

    // Clean up expired cache entries periodically
    if (clinicCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of clinicCache.entries()) {
        if (value.validUntil <= now) {
          clinicCache.delete(key);
        }
      }
    }

    return clinicId;
  } catch (error) {
    console.error('Error fetching clinic from subdomain:', error);
    return null;
  }
}

/**
 * Get clinic context from request
 * Extracts subdomain and finds corresponding clinic
 */
export async function getClinicContext(request: NextRequest): Promise<{
  clinicId: number | null;
  subdomain: string | null;
}> {
  const hostname = request.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname);

  if (!subdomain) {
    return { clinicId: null, subdomain: null };
  }

  // Normalize subdomain before lookup
  const normalizedSubdomain = subdomain.toLowerCase().trim();
  const clinicId = await getClinicIdFromSubdomain(normalizedSubdomain);

  return { clinicId, subdomain: normalizedSubdomain };
}

/**
 * Set clinic context in request headers
 * This allows downstream API routes to access the clinic ID
 */
export function setClinicContextHeaders(
  response: NextResponse,
  clinicId: number | null,
  subdomain: string | null
): NextResponse {
  if (clinicId) {
    response.headers.set('x-clinic-id', clinicId.toString());
  }
  if (subdomain) {
    response.headers.set('x-clinic-subdomain', subdomain);
  }
  return response;
}
