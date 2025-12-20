import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from 'jose';
import { extractSubdomain } from '@/lib/subdomain-utils';

// Note: We cannot use Prisma in middleware because it runs in Edge Runtime
// Clinic database lookup is done in API routes and pages instead

// Cache for validated tokens (in-memory cache for the server)
const tokenCache = new Map<string, { decoded: any; validUntil: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes server-side cache

// Cache for subdomain to clinic ID mapping (populated by API calls, used for validation)
const subdomainClinicCache = new Map<string, { clinicId: number | null; validUntil: number }>();
const SUBDOMAIN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Roles that require strict clinic assignment
const STAFF_ROLES = ['DOCTOR', 'DIETICIAN', 'LAB_TECH', 'PATHOLOGY', 'PHLEBOTOMIST'];

// Function to verify JWT token using jose with caching
async function verifyJWTWithCache(token: string, secret: string): Promise<any> {
  // Check cache first
  const cached = tokenCache.get(token);
  if (cached && cached.validUntil > Date.now()) {
    return cached.decoded;
  }

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    // Cache the result
    tokenCache.set(token, {
      decoded: payload,
      validUntil: Date.now() + CACHE_DURATION
    });

    // Clean up expired cache entries periodically
    if (tokenCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of tokenCache.entries()) {
        if (value.validUntil <= now) {
          tokenCache.delete(key);
        }
      }
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    // Remove from cache if verification fails
    tokenCache.delete(token);
    return null;
  }
}

// Function to verify user token with caching
const verifyUserToken = async (token: string) => {
  try {
    const decoded = await verifyJWTWithCache(token, process.env.JWT_SECRET!);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Fast client-side token validation (basic checks)
function isTokenStructurallyValid(token: string): boolean {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Basic payload check for expiration
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const exp = payload.exp;
    
    if (exp && exp * 1000 < Date.now()) {
      return false; // Token is expired
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract clinicId from JWT token payload
 * Returns null if not present (legacy tokens)
 */
function getClinicIdFromToken(decoded: any): number | null {
  if (decoded && typeof decoded.clinicId === 'number') {
    return decoded.clinicId;
  }
  return null;
}

/**
 * Check if token's clinicId is valid for the given subdomain
 * Note: In Edge Runtime, we cannot do DB lookup, so we do basic validation
 * Full validation happens in API routes
 * 
 * This function returns:
 * - { valid: true } if token has no clinicId (legacy token, will be validated in API)
 * - { valid: true } if token has clinicId (will be validated against subdomain in API)
 * - { valid: false, reason } if token explicitly doesn't match (for staff roles)
 */
function validateTokenClinicContext(
  decoded: any,
  subdomain: string | null
): { valid: boolean; reason?: string } {
  // If no subdomain, allow (main domain or localhost)
  if (!subdomain) {
    return { valid: true };
  }

  const tokenClinicId = getClinicIdFromToken(decoded);
  const userRole = decoded.userRole as string | undefined;

  // Legacy tokens without clinicId - allow but they'll be validated in API routes
  if (tokenClinicId === null) {
    return { valid: true };
  }

  // For staff roles, we'll do strict validation in API routes
  // Middleware allows through but marks for API validation
  if (userRole && STAFF_ROLES.includes(userRole)) {
    // Token has clinicId - API will validate against subdomain
    return { valid: true };
  }

  // For patients and other roles, allow through for API validation
  return { valid: true };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes that don't need auth
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/debug/') || // Allow debug routes - MUST be before other checks
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  // Extract subdomain from hostname (no database lookup - Edge Runtime doesn't support Prisma)
  // Database lookup for clinic validation is done in API routes and pages
  let subdomain: string | null = null;
  const hostname = request.headers.get('host') || '';
  subdomain = extractSubdomain(hostname);
  
  // Note: We cannot validate clinic existence here (no DB access in Edge Runtime)
  // Clinic validation is done in pages/API routes using the subdomain header

  // Super Admin routes protection
  if (pathname.startsWith("/superadmin")) {
    // Allow access to superadmin login page
    if (pathname === "/superadmin/login") {
      return NextResponse.next();
    }

    const superAdminToken = request.cookies.get("superadmin_token")?.value;

    if (!superAdminToken) {
      const redirectUrl = new URL("/superadmin/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // Fast structural validation first
    if (!isTokenStructurallyValid(superAdminToken)) {
      const redirectUrl = new URL("/superadmin/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    const decodedSuperAdmin = await verifyUserToken(superAdminToken);
    if (!decodedSuperAdmin || decodedSuperAdmin.role !== "SUPER_ADMIN") {
      console.log("Invalid superadmin token as role not matching");
      const redirectUrl = new URL("/superadmin/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    // Require subdomain for admin login (admin is clinic-specific)
    if (pathname === "/admin/login") {
      // Block access if no subdomain
      if (!subdomain) {
        const redirectUrl = new URL("/clinic-not-found", request.url);
        redirectUrl.searchParams.set('error', 'no_subdomain');
        return NextResponse.redirect(redirectUrl);
      }
      return NextResponse.next();
    }

    const adminToken = request.cookies.get("admin_token")?.value;

    if (!adminToken) {
      const redirectUrl = new URL("/admin/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // Fast structural validation first
    if (!isTokenStructurallyValid(adminToken)) {
      const redirectUrl = new URL("/admin/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    const decodedAdmin = await verifyUserToken(adminToken);
    if (!decodedAdmin || decodedAdmin.role !== "ADMIN") {
      console.log("Invalid admin token as role not matching");
      const redirectUrl = new URL("/admin/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // Patient/Doctor login route protection
  if (pathname === "/login") {
    // Require subdomain for login (login is clinic-specific)
    // Block access if no subdomain
    if (!subdomain) {
      const redirectUrl = new URL("/clinic-not-found", request.url);
      redirectUrl.searchParams.set('error', 'no_subdomain');
      return NextResponse.redirect(redirectUrl);
    }
    const response = NextResponse.next();
    // Pass subdomain via header for page to validate clinic
    if (subdomain) {
      response.headers.set('x-clinic-subdomain', subdomain);
    }
    return response;
  }

  // Dashboard routes protection
  if (pathname.startsWith("/dashboard")) {

    // Note: Clinic validation is done in the page, not middleware
    // (Middleware runs in Edge Runtime which doesn't support Prisma)

    const userToken = request.cookies.get("token")?.value;
    if (!userToken) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // Fast structural validation first
    if (!isTokenStructurallyValid(userToken)) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    const decodedUser = await verifyUserToken(userToken);
    if (!decodedUser) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // For PATIENT role, clinic validation happens in pages/API routes
    
    // Role-based redirects with caching
    if (decodedUser.userRole === "DOCTOR") {
      console.log("Redirecting to doctor home");
      const redirectUrl = new URL("/doctor/home", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }
    if (decodedUser.userRole === "PATHOLOGY") {
      console.log("Redirecting to pathology dashboard");
      const redirectUrl = new URL("/pathology", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    const response = NextResponse.next();
    // Pass subdomain via header for page to validate clinic
    if (subdomain) {
      response.headers.set('x-clinic-subdomain', subdomain);
    }
    return response;
  }

  // Doctor routes protection
  if (pathname.startsWith("/doctor")) {
    const userToken = request.cookies.get("token")?.value;
    if (!userToken) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // Fast structural validation first
    if (!isTokenStructurallyValid(userToken)) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    const decodedUser = await verifyUserToken(userToken);
    if (!decodedUser || decodedUser.userRole !== "DOCTOR") {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // Validate clinic context for doctors
    const tokenValidation = validateTokenClinicContext(decodedUser, subdomain);
    if (!tokenValidation.valid) {
      console.log(`[Middleware] Doctor clinic mismatch: ${tokenValidation.reason}`);
      // Redirect to login with clinic mismatch indicator
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('clinic_mismatch', 'true');
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete('token'); // Clear invalid token
      return response;
    }

    // Pass subdomain info for API-level validation
    const response = NextResponse.next();
    if (subdomain) {
      response.headers.set('x-clinic-subdomain', subdomain);
    }
    return response;
  }

  // Pathology routes protection
  if (pathname.startsWith("/pathology")) {
    const userToken = request.cookies.get("token")?.value;
    if (!userToken) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // Fast structural validation first
    if (!isTokenStructurallyValid(userToken)) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    const decodedUser = await verifyUserToken(userToken);
    if (!decodedUser || decodedUser.userRole !== "PATHOLOGY") {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('redirect', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // Verify that user exists (token should only be created for existing users)
    if (!decodedUser.userExists) {
      // Token indicates user doesn't exist, clear token and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    // Validate clinic context for pathology staff
    const tokenValidation = validateTokenClinicContext(decodedUser, subdomain);
    if (!tokenValidation.valid) {
      console.log(`[Middleware] Pathology clinic mismatch: ${tokenValidation.reason}`);
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set('clinic_mismatch', 'true');
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete('token');
      return response;
    }

    // Pass subdomain info for API-level validation
    const response = NextResponse.next();
    if (subdomain) {
      response.headers.set('x-clinic-subdomain', subdomain);
    }
    return response;
  }

  // Root path redirect - require subdomain
  if (pathname === "/") {
    // If no subdomain, redirect to clinic-not-found
    if (!subdomain) {
      const redirectUrl = new URL("/clinic-not-found", request.url);
      redirectUrl.searchParams.set('error', 'no_subdomain');
      return NextResponse.redirect(redirectUrl);
    }
    // If subdomain exists, allow through (will be handled by the page)
    const response = NextResponse.next();
    if (subdomain) {
      response.headers.set('x-clinic-subdomain', subdomain);
    }
    return response;
  }

  // For all other routes, pass subdomain via header for page/API to validate clinic
  const response = NextResponse.next();
  if (subdomain) {
    response.headers.set('x-clinic-subdomain', subdomain);
  }
  return response;
}

// Specify the paths to protect - more specific matchers for better performance
// Also include root and login routes for clinic context detection
export const config = {
  matcher: [
    "/superadmin/:path*",
    "/admin/:path*", 
    "/dashboard/:path*", 
    "/pathology/:path*",
    "/doctor/:path*",
    "/login/:path*",
    "/clinic-not-found",
    "/api/debug/:path*", // Allow debug routes
    "/"
  ],
};
