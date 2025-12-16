import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { extractSubdomain } from '@/lib/subdomain-utils';
import { getClinicIdFromSubdomain } from '@/lib/clinic-context-middleware';

export interface AdminTokenData {
  userId: number;
  email: string;
  role: string;
  clinicId: number;
}

/**
 * Get admin's clinic ID from token and validate it matches the subdomain
 * This ensures admin can only access their assigned clinic's portal
 */
export async function getAdminClinicIdAsync(request: NextRequest): Promise<number | null> {
  try {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AdminTokenData;
    
    if (decoded.role !== 'ADMIN') {
      return null;
    }

    if (!decoded.clinicId) {
      console.log('Admin token missing clinicId - admin needs to re-login:', decoded.userId);
      return null;
    }

    // Validate subdomain matches admin's clinic
    const hostname = request.headers.get('host') || '';
    const subdomain = extractSubdomain(hostname);
    
    if (subdomain) {
      const subdomainClinicId = await getClinicIdFromSubdomain(subdomain);
      
      if (subdomainClinicId && subdomainClinicId !== decoded.clinicId) {
        console.log(`[Admin Auth] Clinic mismatch: admin clinic ${decoded.clinicId}, subdomain clinic ${subdomainClinicId}`);
        return null;
      }
    }

    return decoded.clinicId;
  } catch (error) {
    console.error('Error extracting admin clinic ID:', error);
    return null;
  }
}

/**
 * LEGACY: Synchronous version for backward compatibility
 * Note: This does NOT validate subdomain matching - use getAdminClinicIdAsync for full validation
 */
export function getAdminClinicId(request: NextRequest): number | null {
  try {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AdminTokenData;
    
    if (decoded.role !== 'ADMIN') {
      return null;
    }

    if (!decoded.clinicId) {
      console.log('Admin token missing clinicId - admin needs to re-login:', decoded.userId);
      return null;
    }

    return decoded.clinicId;
  } catch (error) {
    console.error('Error extracting admin clinic ID:', error);
    return null;
  }
}

export function createClinicFilter(clinicId: number) {
  return {
    clinicId: clinicId
  };
}

export function createUserClinicFilter(clinicId: number) {
  return {
    user: {
      clinicId: clinicId
    }
  };
}
