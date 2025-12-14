import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from 'jose';
import { getClinicContext, setClinicContextHeaders } from '@/lib/clinic-context-middleware';

// Cache for validated tokens (in-memory cache for the server)
const tokenCache = new Map<string, { decoded: any; validUntil: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes server-side cache

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes that don't need auth
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  // Extract clinic context from subdomain (before route protection)
  // Skip for admin/superadmin routes as they don't use subdomain routing
  let clinicContext = { clinicId: null, subdomain: null };
  if (!pathname.startsWith("/superadmin") && !pathname.startsWith("/admin")) {
    clinicContext = await getClinicContext(request);
    
    // If subdomain exists but clinic not found, redirect to clinic-not-found page
    // Only for patient-facing routes (not API routes)
    if (clinicContext.subdomain && !clinicContext.clinicId && !pathname.startsWith("/api")) {
      // Allow access to clinic-not-found page itself
      if (pathname !== "/clinic-not-found") {
        const redirectUrl = new URL("/clinic-not-found", request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

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
    // Allow access to admin login page
    if (pathname === "/admin/login") {
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

  // Dashboard routes protection
  if (pathname.startsWith("/dashboard")) {
    // Allow access to login page
    if (pathname === "/login") {
      const response = NextResponse.next();
      return setClinicContextHeaders(response, clinicContext.clinicId, clinicContext.subdomain);
    }

    // For patient routes, require valid clinic context
    if (clinicContext.subdomain && !clinicContext.clinicId) {
      const redirectUrl = new URL("/clinic-not-found", request.url);
      return NextResponse.redirect(redirectUrl);
    }

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

    // For PATIENT role, ensure clinic context is available
    // Detailed clinic validation happens in API routes for performance
    // Middleware ensures subdomain clinic exists (already checked above)
    
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
    return setClinicContextHeaders(response, clinicContext.clinicId, clinicContext.subdomain);
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

    return NextResponse.next();
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

    return NextResponse.next();
  }

  // For all other routes, set clinic context headers if available
  const response = NextResponse.next();
  return setClinicContextHeaders(response, clinicContext.clinicId, clinicContext.subdomain);
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
    "/"
  ],
};
