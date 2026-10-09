/**
 * Unified Clinic Authentication & Authorization Middleware
 * 
 * This module provides comprehensive multi-tenancy enforcement for the application.
 * It ensures that users can only access data from their assigned clinic.
 * 
 * IMPORTANT: All API routes MUST use these utilities to ensure proper clinic isolation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { extractSubdomain } from '@/lib/subdomain-utils';

// =============================================================================
// TYPES
// =============================================================================

export interface TokenPayload {
  plusAddedPhoneNumber?: string;
  userExists?: boolean;
  userRole?: string;
  clinicId?: number | null;
  userId?: number;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

export interface ClinicAuthResult {
  success: boolean;
  userId?: number;
  clinicId?: number | null;
  userRole?: string;
  phoneNumber?: string;
  error?: string;
  errorCode?: 'UNAUTHORIZED' | 'CLINIC_MISMATCH' | 'NO_CLINIC' | 'INVALID_TOKEN';
}

export interface SubdomainClinic {
  clinicId: number | null;
  subdomain: string | null;
}

// Staff roles that require strict clinic assignment
const STAFF_ROLES = ['DOCTOR', 'DIETICIAN', 'LAB_TECH', 'PATHOLOGY', 'PHLEBOTOMIST'];

// Cache for clinic lookups (in-memory)
const clinicCache = new Map<string, { clinicId: number | null; validUntil: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// SUBDOMAIN & CLINIC LOOKUP
// =============================================================================

/**
 * Get clinic ID from subdomain with caching
 */
export async function getClinicIdFromSubdomain(subdomain: string): Promise<number | null> {
  const normalizedSubdomain = subdomain.toLowerCase().trim();
  
  // Check cache first
  const cached = clinicCache.get(normalizedSubdomain);
  if (cached && cached.validUntil > Date.now()) {
    return cached.clinicId;
  }

  try {
    const clinic = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM "Clinic" 
      WHERE LOWER(subdomain) = LOWER(${normalizedSubdomain})
      AND "deletedAt" IS NULL
      LIMIT 1
    `;

    const clinicId = clinic && clinic.length > 0 ? clinic[0].id : null;

    // Cache the result
    clinicCache.set(normalizedSubdomain, {
      clinicId,
      validUntil: Date.now() + CACHE_DURATION
    });

    return clinicId;
  } catch (error) {
    console.error('[Clinic Auth] Error fetching clinic from subdomain:', error);
    return null;
  }
}

/**
 * Get subdomain clinic context from request headers
 */
export async function getSubdomainClinic(): Promise<SubdomainClinic> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const subdomain = extractSubdomain(hostname);
  
  if (!subdomain) {
    return { clinicId: null, subdomain: null };
  }
  
  const clinicId = await getClinicIdFromSubdomain(subdomain);
  return { clinicId, subdomain };
}

/**
 * Get subdomain clinic from NextRequest
 */
export async function getSubdomainClinicFromRequest(request: NextRequest): Promise<SubdomainClinic> {
  const hostname = request.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname);
  
  if (!subdomain) {
    return { clinicId: null, subdomain: null };
  }
  
  const clinicId = await getClinicIdFromSubdomain(subdomain);
  return { clinicId, subdomain };
}

// =============================================================================
// USER TOKEN AUTHENTICATION
// =============================================================================

/**
 * Build the Prisma `where` clause that identifies the user behind a token.
 *
 * MULTI-TENANCY: The same phone number can belong to different users in different
 * clinics (e.g. DOCTOR in one clinic, PATIENT in another), so never look a user up
 * by phone alone. New tokens carry userId; old tokens fall back to phone + clinic.
 */
export async function tokenUserWhere(decoded: TokenPayload): Promise<Prisma.UserWhereInput> {
  if (decoded.userId) {
    return { id: decoded.userId, deletedAt: null };
  }

  const { clinicId: subdomainClinicId } = await getSubdomainClinic();
  const clinicIdForLookup = subdomainClinicId || decoded.clinicId;

  return {
    phoneNumber: decoded.plusAddedPhoneNumber,
    ...(clinicIdForLookup ? { clinicId: clinicIdForLookup } : {}),
    deletedAt: null,
  };
}

/**
 * Verify user token from cookies and validate clinic access
 * This is the PRIMARY function for authenticating user API requests
 * 
 * MULTI-TENANCY: Users can have accounts in multiple clinics with the same phone number.
 * The token contains userId which uniquely identifies the user in a specific clinic.
 */
export async function requireUserAuth(): Promise<ClinicAuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return {
        success: false,
        error: 'Authentication required',
        errorCode: 'UNAUTHORIZED'
      };
    }

    // Verify JWT
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (err) {
      return {
        success: false,
        error: 'Invalid or expired token',
        errorCode: 'INVALID_TOKEN'
      };
    }

    const phoneNumber = decoded.plusAddedPhoneNumber;
    if (!phoneNumber) {
      return {
        success: false,
        error: 'Invalid token payload',
        errorCode: 'INVALID_TOKEN'
      };
    }

    // MULTI-TENANCY: Get user from database (userId from token, phone + clinic for old tokens)
    const user = await prisma.user.findFirst({
      where: await tokenUserWhere(decoded),
      select: {
        id: true,
        clinicId: true,
        role: true,
        status: true,
        phoneNumber: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        errorCode: 'UNAUTHORIZED'
      };
    }

    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'User account is not active',
        errorCode: 'UNAUTHORIZED'
      };
    }

    // Validate clinic access - user's clinic must match subdomain clinic
    const { clinicId: subdomainClinicId } = await getSubdomainClinic();
    const clinicValidation = validateClinicAccess(user.clinicId, user.role, subdomainClinicId);
    
    if (!clinicValidation.allowed) {
      console.log(`[Clinic Auth] Access denied for user ${user.id}: ${clinicValidation.error}`);
      return {
        success: false,
        error: clinicValidation.error,
        errorCode: clinicValidation.errorCode
      };
    }

    return {
      success: true,
      userId: user.id,
      clinicId: user.clinicId,
      userRole: user.role,
      phoneNumber: user.phoneNumber
    };
  } catch (error) {
    console.error('[Clinic Auth] Error in requireUserAuth:', error);
    return {
      success: false,
      error: 'Authentication error',
      errorCode: 'UNAUTHORIZED'
    };
  }
}

/**
 * Require user auth for doctor role specifically
 */
export async function requireDoctorAuth(): Promise<ClinicAuthResult> {
  const result = await requireUserAuth();
  
  if (!result.success) {
    return result;
  }

  if (result.userRole !== 'DOCTOR') {
    return {
      success: false,
      error: 'This endpoint requires doctor access',
      errorCode: 'UNAUTHORIZED'
    };
  }

  return result;
}

/**
 * Require user auth for patient role specifically
 */
export async function requirePatientAuth(): Promise<ClinicAuthResult> {
  const result = await requireUserAuth();
  
  if (!result.success) {
    return result;
  }

  if (result.userRole !== 'PATIENT') {
    return {
      success: false,
      error: 'This endpoint requires patient access',
      errorCode: 'UNAUTHORIZED'
    };
  }

  return result;
}

/**
 * Require user auth for dietician role specifically
 */
export async function requireDieticianAuth(): Promise<ClinicAuthResult> {
  const result = await requireUserAuth();
  
  if (!result.success) {
    return result;
  }

  if (result.userRole !== 'DIETICIAN') {
    return {
      success: false,
      error: 'This endpoint requires dietician access',
      errorCode: 'UNAUTHORIZED'
    };
  }

  return result;
}

// =============================================================================
// ADMIN TOKEN AUTHENTICATION
// =============================================================================

/**
 * Verify admin token and validate clinic access
 * Admins are bound to specific clinics and can only manage their clinic's data
 */
export async function requireAdminAuth(): Promise<ClinicAuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    if (!token) {
      return {
        success: false,
        error: 'Admin authentication required',
        errorCode: 'UNAUTHORIZED'
      };
    }

    // Verify JWT
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (err) {
      return {
        success: false,
        error: 'Invalid or expired admin token',
        errorCode: 'INVALID_TOKEN'
      };
    }

    if (decoded.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
        errorCode: 'UNAUTHORIZED'
      };
    }

    if (!decoded.clinicId) {
      return {
        success: false,
        error: 'Admin must be assigned to a clinic',
        errorCode: 'NO_CLINIC'
      };
    }

    // Get subdomain clinic and validate it matches admin's clinic
    const { clinicId: subdomainClinicId, subdomain } = await getSubdomainClinic();
    
    // If there's a subdomain, admin's clinic must match
    if (subdomainClinicId && subdomainClinicId !== decoded.clinicId) {
      console.log(`[Clinic Auth] Admin clinic mismatch: admin clinic ${decoded.clinicId}, subdomain clinic ${subdomainClinicId}`);
      return {
        success: false,
        error: 'You cannot access this clinic portal. Please use your assigned clinic URL.',
        errorCode: 'CLINIC_MISMATCH'
      };
    }

    return {
      success: true,
      userId: decoded.userId,
      clinicId: decoded.clinicId,
      userRole: 'ADMIN'
    };
  } catch (error) {
    console.error('[Clinic Auth] Error in requireAdminAuth:', error);
    return {
      success: false,
      error: 'Admin authentication error',
      errorCode: 'UNAUTHORIZED'
    };
  }
}

// =============================================================================
// CLINIC ACCESS VALIDATION
// =============================================================================

interface ClinicValidation {
  allowed: boolean;
  error?: string;
  errorCode?: 'CLINIC_MISMATCH' | 'NO_CLINIC';
}

/**
 * Validate that user can access the current clinic (from subdomain)
 */
function validateClinicAccess(
  userClinicId: number | null,
  userRole: string,
  subdomainClinicId: number | null
): ClinicValidation {
  // If no subdomain (main domain or localhost), allow
  if (!subdomainClinicId) {
    return { allowed: true };
  }

  // Staff roles MUST be assigned to a clinic and it MUST match the subdomain
  if (STAFF_ROLES.includes(userRole)) {
    if (!userClinicId) {
      return {
        allowed: false,
        error: 'Your account is not assigned to any clinic. Please contact your administrator.',
        errorCode: 'NO_CLINIC'
      };
    }
    
    if (userClinicId !== subdomainClinicId) {
      return {
        allowed: false,
        error: 'You cannot access this clinic portal. Please use your assigned clinic URL.',
        errorCode: 'CLINIC_MISMATCH'
      };
    }
    
    return { allowed: true };
  }

  // For PATIENT role
  if (userRole === 'PATIENT') {
    if (!userClinicId) {
      // Patients without clinic shouldn't be able to access a specific clinic's portal
      return {
        allowed: false,
        error: 'Your account is not registered with this clinic.',
        errorCode: 'NO_CLINIC'
      };
    }
    
    if (userClinicId !== subdomainClinicId) {
      return {
        allowed: false,
        error: 'You are not registered with this clinic. Please use the correct clinic URL.',
        errorCode: 'CLINIC_MISMATCH'
      };
    }
    
    return { allowed: true };
  }

  // ADMIN and SUPER_ADMIN should use their own login flows
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
    return {
      allowed: false,
      error: 'Please use the admin login portal.',
      errorCode: 'CLINIC_MISMATCH'
    };
  }

  // Default: allow for any other roles (shouldn't happen normally)
  return { allowed: true };
}

// =============================================================================
// PRISMA QUERY HELPERS
// =============================================================================

/**
 * Create a clinic filter for Prisma queries
 * Use this to ensure all data queries are scoped to the authenticated user's clinic
 */
export function createClinicFilter(clinicId: number | null | undefined): { clinicId?: number } {
  if (!clinicId) {
    return {};
  }
  return { clinicId };
}

/**
 * Create a nested clinic filter for relations (e.g., filtering through user.clinicId)
 */
export function createUserClinicFilter(clinicId: number | null | undefined): { user?: { clinicId: number } } {
  if (!clinicId) {
    return {};
  }
  return { user: { clinicId } };
}

/**
 * Create a patient filter ensuring patient belongs to the authenticated clinic
 */
export function createPatientClinicFilter(clinicId: number | null | undefined): { clinicId?: number, role?: string } {
  if (!clinicId) {
    return { role: 'PATIENT' };
  }
  return { clinicId, role: 'PATIENT' };
}

// =============================================================================
// ERROR RESPONSE HELPERS
// =============================================================================

/**
 * Create a standardized unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

/**
 * Create a standardized forbidden (clinic mismatch) response
 */
export function clinicMismatchResponse(message: string = 'You cannot access this clinic portal'): NextResponse {
  return NextResponse.json(
    { success: false, error: message, clinicMismatch: true },
    { status: 403 }
  );
}

/**
 * Handle clinic auth errors and return appropriate response
 */
export function handleAuthError(result: ClinicAuthResult): NextResponse {
  switch (result.errorCode) {
    case 'CLINIC_MISMATCH':
    case 'NO_CLINIC':
      return clinicMismatchResponse(result.error);
    case 'INVALID_TOKEN':
    case 'UNAUTHORIZED':
    default:
      return unauthorizedResponse(result.error);
  }
}

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * Get doctor's clinic ID from token (legacy function - prefer requireDoctorAuth)
 */
export async function getDoctorClinicId(): Promise<number | null> {
  const result = await requireDoctorAuth();
  return result.success ? result.clinicId ?? null : null;
}

/**
 * Get admin's clinic ID from token (legacy function - prefer requireAdminAuth)
 */
export async function getAdminClinicId(): Promise<number | null> {
  const result = await requireAdminAuth();
  return result.success ? result.clinicId ?? null : null;
}
