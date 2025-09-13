import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from 'jose';

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

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    // Allow access to admin login page
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const adminToken = request.cookies.get("admin_token")?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Fast structural validation first
    if (!isTokenStructurallyValid(adminToken)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const decodedAdmin = await verifyUserToken(adminToken);
    if (!decodedAdmin || decodedAdmin.role !== "ADMIN") {
      console.log("Invalid admin token as role not matching");
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // Dashboard routes protection
  if (pathname.startsWith("/dashboard")) {
    // Allow access to login page
    if (pathname === "/login") {
      return NextResponse.next();
    }

    const userToken = request.cookies.get("token")?.value;
    if (!userToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Fast structural validation first
    if (!isTokenStructurallyValid(userToken)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const decodedUser = await verifyUserToken(userToken);
    if (!decodedUser) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Role-based redirects with caching
    if (decodedUser.userRole === "DOCTOR") {
      console.log("Redirecting to doctor home");
      return NextResponse.redirect(new URL("/doctor/home", request.url));
    }
    if (decodedUser.userRole === "PATHOLOGY") {
      console.log("Redirecting to pathology dashboard");
      return NextResponse.redirect(new URL("/pathology", request.url));
    }

    return NextResponse.next();
  }

  // Doctor routes protection
  if (pathname.startsWith("/doctor")) {
    const userToken = request.cookies.get("token")?.value;
    if (!userToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Fast structural validation first
    if (!isTokenStructurallyValid(userToken)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const decodedUser = await verifyUserToken(userToken);
    if (!decodedUser || decodedUser.userRole !== "DOCTOR") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  // Pathology routes protection
  if (pathname.startsWith("/pathology")) {
    const userToken = request.cookies.get("token")?.value;
    if (!userToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Fast structural validation first
    if (!isTokenStructurallyValid(userToken)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const decodedUser = await verifyUserToken(userToken);
    if (!decodedUser || decodedUser.userRole !== "PATHOLOGY") {
      return NextResponse.redirect(new URL("/login", request.url));
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

  return NextResponse.next();
}

// Specify the paths to protect - more specific matchers for better performance
export const config = {
  matcher: [
    "/admin/:path*", 
    "/dashboard/:path*", 
    "/pathology/:path*",
    "/doctor/:path*"
  ],
};
