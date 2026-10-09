/**
 * Unified Clinic Authentication Middleware
 * 
 * This middleware enforces multi-tenancy by:
 * 1. Extracting clinicId from JWT tokens
 * 2. Verifying user belongs to the subdomain's clinic
 * 3. Providing clinic filtering utilities for database queries
 * 
 * Use this for all API routes that need clinic-based data segregation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { extractSubdomain } from '@/lib/subdomain-utils';
import { getClinicIdFromSubdomain } from '@/lib/clinic-context-middleware';
import { tokenUserWhere } from '@/lib/clinic-auth';

// Token payload interfaces
export interface UserTokenPayload {
  plusAddedPhoneNumber: string;
  userExists: boolean;
  userRole?: string;
  clinicId?: number;  // Added for multi-tenancy
  userId?: number;
  iat?: number;
  exp?: number;
}

export interface AdminTokenPayload {
  userId: number;
  email: string;
  role: string;
  clinicId: number;
  iat?: number;
  exp?: number;
}

// Clinic auth result
export interface ClinicAuthResult {
  success: boolean;
  userId?: number;
  phoneNumber?: string;
  role?: string;
  clinicId?: number;
  subdomainClinicId?: number;
  error?: string;
  errorCode?: 'UNAUTHORIZED' | 'CLINIC_MISMATCH' | 'INVALID_TOKEN' | 'USER_NOT_FOUND';
}

/**
 * Verify user token and extract clinic information
 * For regular users (patients, doctors, dieticians, etc.)
 */
export async function verifyUserClinicAuth(request: NextRequest): Promise<ClinicAuthResult> {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return {
        success: false,
        error: 'Authentication required',
        errorCode: 'UNAUTHORIZED'
      };
    }

    // Verify JWT token
    let decoded: UserTokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserTokenPayload;
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

    // Get subdomain clinic ID
    const headersList = await headers();
    const hostname = headersList.get('host') || '';
    const subdomain = extractSubdomain(hostname);
    let subdomainClinicId: number | null = null;

    if (subdomain) {
      subdomainClinicId = await getClinicIdFromSubdomain(subdomain);
    }

    // Get user from database to verify current clinic assignment
    const user = await prisma.user.findFirst({
      where: await tokenUserWhere(decoded),
      select: {
        id: true,
        clinicId: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND'
      };
    }

    if (user.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'User account is not active',
        errorCode: 'UNAUTHORIZED'
      };
    }

    // For staff roles (DOCTOR, DIETICIAN, LAB_TECH, etc.), enforce strict clinic match
    const staffRoles = ['DOCTOR', 'DIETICIAN', 'LAB_TECH', 'PATHOLOGY', 'PHLEBOTOMIST'];
    
    if (staffRoles.includes(user.role)) {
      // Staff must have a clinic assigned
      if (!user.clinicId) {
        return {
          success: false,
          error: 'Staff member not assigned to any clinic',
          errorCode: 'UNAUTHORIZED'
        };
      }

      // If subdomain is detected, verify clinic match
      if (subdomainClinicId && user.clinicId !== subdomainClinicId) {
        return {
          success: false,
          error: `You cannot access this clinic portal. Please use your assigned clinic's URL.`,
          errorCode: 'CLINIC_MISMATCH'
        };
      }
    }

    // For PATIENT role, also verify clinic match
    if (user.role === 'PATIENT' && subdomainClinicId) {
      if (user.clinicId && user.clinicId !== subdomainClinicId) {
        return {
          success: false,
          error: 'You cannot access this clinic portal. Please use the correct clinic URL.',
          errorCode: 'CLINIC_MISMATCH'
        };
      }
    }

    return {
      success: true,
      userId: user.id,
      phoneNumber,
      role: user.role,
      clinicId: user.clinicId || undefined,
      subdomainClinicId: subdomainClinicId || undefined
    };

  } catch (error) {
    console.error('[ClinicAuth] Error verifying user:', error);
    return {
      success: false,
      error: 'Authentication failed',
      errorCode: 'UNAUTHORIZED'
    };
  }
}

/**
 * Verify admin token and extract clinic information
 */
export async function verifyAdminClinicAuth(request: NextRequest): Promise<ClinicAuthResult> {
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

    let decoded: AdminTokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as AdminTokenPayload;
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
        error: 'Admin token missing clinic information. Please log out and log back in.',
        errorCode: 'INVALID_TOKEN'
      };
    }

    return {
      success: true,
      userId: decoded.userId,
      role: decoded.role,
      clinicId: decoded.clinicId
    };

  } catch (error) {
    console.error('[ClinicAuth] Error verifying admin:', error);
    return {
      success: false,
      error: 'Admin authentication failed',
      errorCode: 'UNAUTHORIZED'
    };
  }
}

/**
 * Get clinic ID for the current request
 * Tries user token first, then admin token
 * Returns the clinic ID that should be used for data filtering
 */
export async function getRequestClinicId(request: NextRequest): Promise<number | null> {
  // Try user token first
  const userAuth = await verifyUserClinicAuth(request);
  if (userAuth.success && userAuth.clinicId) {
    return userAuth.clinicId;
  }

  // Try admin token
  const adminAuth = await verifyAdminClinicAuth(request);
  if (adminAuth.success && adminAuth.clinicId) {
    return adminAuth.clinicId;
  }

  return null;
}

/**
 * Create a Prisma filter for clinic-based data access
 */
export function createClinicFilter(clinicId: number) {
  return { clinicId };
}

/**
 * Create a Prisma filter for user relations (e.g., patient.user.clinicId)
 */
export function createUserClinicFilter(clinicId: number) {
  return {
    user: {
      clinicId
    }
  };
}

/**
 * HOF: Wrap an API handler with clinic authentication
 * Automatically verifies clinic access and passes clinicId to the handler
 */
export function withClinicAuth(
  handler: (request: NextRequest, clinicId: number, auth: ClinicAuthResult) => Promise<NextResponse>,
  options: {
    requireAdmin?: boolean;
    allowedRoles?: string[];
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { requireAdmin = false, allowedRoles } = options;

    let auth: ClinicAuthResult;

    if (requireAdmin) {
      auth = await verifyAdminClinicAuth(request);
    } else {
      auth = await verifyUserClinicAuth(request);
    }

    if (!auth.success) {
      const status = auth.errorCode === 'CLINIC_MISMATCH' ? 403 : 401;
      return NextResponse.json(
        { 
          success: false, 
          error: auth.error,
          clinicMismatch: auth.errorCode === 'CLINIC_MISMATCH'
        },
        { status }
      );
    }

    if (!auth.clinicId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Clinic context required. Please log out and log back in.' 
        },
        { status: 401 }
      );
    }

    // Check allowed roles if specified
    if (allowedRoles && auth.role && !allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied for your role' },
        { status: 403 }
      );
    }

    return handler(request, auth.clinicId, auth);
  };
}

/**
 * Helper: Return appropriate error response for clinic auth failures
 */
export function createClinicAuthErrorResponse(auth: ClinicAuthResult): NextResponse {
  const status = auth.errorCode === 'CLINIC_MISMATCH' ? 403 : 401;
  return NextResponse.json(
    {
      success: false,
      error: auth.error,
      clinicMismatch: auth.errorCode === 'CLINIC_MISMATCH'
    },
    { status }
  );
}
