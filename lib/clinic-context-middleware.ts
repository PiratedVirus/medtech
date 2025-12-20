import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// Re-export extractSubdomain from the Edge-safe utility file
export { extractSubdomain } from '@/lib/subdomain-utils';
import { extractSubdomain } from '@/lib/subdomain-utils';

// Cache for clinic lookups (in-memory cache)
const clinicCache = new Map<string, { clinicId: number | null; validUntil: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

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

    // Enhanced logging for debugging
    if (!clinicId) {
      // Try to get all clinics with subdomains for debugging
      const allClinicsWithSubdomain = await prisma.$queryRaw<Array<{ id: number; subdomain: string }>>`
        SELECT id, subdomain FROM "Clinic" 
        WHERE subdomain IS NOT NULL
        AND "deletedAt" IS NULL
        ORDER BY id
      `;
      console.log(`[Clinic Lookup] Subdomain "${normalizedSubdomain}" not found in database`);
      console.log(`[Clinic Lookup] Available subdomains:`, allClinicsWithSubdomain.map(c => c.subdomain));
      console.log(`[Clinic Lookup] Database URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
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
    console.error('[Clinic Lookup] Error fetching clinic from subdomain:', error);
    console.error('[Clinic Lookup] Error details:', {
      subdomain: normalizedSubdomain,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    });
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
