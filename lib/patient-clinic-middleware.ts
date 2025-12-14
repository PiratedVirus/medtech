import { NextRequest, headers } from 'next/server';

/**
 * Get clinic ID from request headers (set by middleware)
 * This is the clinic ID determined from the subdomain
 */
export function getPatientClinicId(request: NextRequest): number | null {
  try {
    // In Next.js App Router, we need to use headers() from 'next/headers'
    // But in middleware context, we can access headers directly from request
    const clinicIdHeader = request.headers.get('x-clinic-id');
    
    if (!clinicIdHeader) {
      return null;
    }

    const clinicId = parseInt(clinicIdHeader, 10);
    
    if (isNaN(clinicId)) {
      return null;
    }

    return clinicId;
  } catch (error) {
    console.error('Error extracting patient clinic ID from headers:', error);
    return null;
  }
}

/**
 * Get clinic subdomain from request headers
 */
export function getPatientClinicSubdomain(request: NextRequest): string | null {
  try {
    const subdomainHeader = request.headers.get('x-clinic-subdomain');
    return subdomainHeader || null;
  } catch (error) {
    console.error('Error extracting clinic subdomain from headers:', error);
    return null;
  }
}

/**
 * Create clinic filter for Prisma queries
 * Use this to filter data by clinic ID
 */
export function createPatientClinicFilter(clinicId: number) {
  return {
    clinicId: clinicId
  };
}

/**
 * Create nested clinic filter for relations
 * Use this when filtering through relations (e.g., user.clinicId)
 */
export function createPatientUserClinicFilter(clinicId: number) {
  return {
    user: {
      clinicId: clinicId
    }
  };
}

/**
 * Verify that patient's clinicId matches the subdomain clinic
 * Returns true if match, false otherwise
 */
export function verifyPatientClinicMatch(
  patientClinicId: number | null | undefined,
  subdomainClinicId: number | null
): boolean {
  // If no subdomain clinic, allow (for non-subdomain routes)
  if (!subdomainClinicId) {
    return true;
  }

  // If patient has no clinic, deny
  if (!patientClinicId) {
    return false;
  }

  // Must match exactly
  return patientClinicId === subdomainClinicId;
}
