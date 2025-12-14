import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Cache for clinic lookups (in-memory cache)
const clinicCache = new Map<string, { clinicId: number | null; validUntil: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

/**
 * Extract subdomain from hostname
 * Examples:
 * - clinic1.yourdomain.com -> "clinic1"
 * - clinic1.yourdomain.com:3000 -> "clinic1"
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
  
  // If we have at least 3 parts (subdomain.domain.tld), extract subdomain
  // Example: clinic1.yourdomain.com -> ["clinic1", "yourdomain", "com"]
  if (parts.length >= 3) {
    return parts[0]; // Return the first part as subdomain
  }

  // If only 2 parts, check if it's a subdomain (e.g., in development)
  // For development: clinic1.localhost -> ["clinic1", "localhost"]
  if (parts.length === 2 && parts[1] !== 'localhost') {
    // In production, 2 parts means no subdomain (yourdomain.com)
    return null;
  }

  // For localhost development with subdomain
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }

  return null;
}

/**
 * Get clinic ID from subdomain
 * Uses caching to reduce database queries
 */
export async function getClinicIdFromSubdomain(subdomain: string): Promise<number | null> {
  // Check cache first
  const cached = clinicCache.get(subdomain);
  if (cached && cached.validUntil > Date.now()) {
    return cached.clinicId;
  }

  try {
    const clinic = await prisma.clinic.findFirst({
      where: {
        subdomain: subdomain,
        deletedAt: null
      },
      select: {
        id: true
      }
    });

    const clinicId = clinic?.id || null;

    // Cache the result
    clinicCache.set(subdomain, {
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

  const clinicId = await getClinicIdFromSubdomain(subdomain);

  return { clinicId, subdomain };
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
