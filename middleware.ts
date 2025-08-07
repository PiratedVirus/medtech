import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from 'jose';

// Function to verify JWT token using jose
async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Function to verify admin token
const verifyAdminToken = async (token: string) => {
  try {
    const decoded = await verifyJWT(token, process.env.JWT_SECRET!);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Function to verify user token
const verifyUserToken = async (token: string) => {
  try {
    const decoded = await verifyJWT(token, process.env.JWT_SECRET!);
    return decoded;
  } catch (error) {
    return null;
  }
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

    const decodedAdmin = await verifyAdminToken(adminToken);
    if (!decodedAdmin || decodedAdmin.role !== "ADMIN") {
      console.log("Invalid admin token as role not matching");
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // Doctor routes protection
  if (pathname.startsWith("/doctor")) {
    // Allow access to login page
    if (pathname === "/login") {
      return NextResponse.next();
    }

    const userToken = request.cookies.get("token")?.value;
    if (!userToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const decodedUser = await verifyUserToken(userToken);
    console.log("decodedUser ->", decodedUser);
    if (!decodedUser || !decodedUser.role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if user is a doctor
    if (decodedUser.role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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

    const decodedUser = await verifyUserToken(userToken);
    if (!decodedUser || !decodedUser.role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect doctors to doctor dashboard
    if (decodedUser.role === "DOCTOR" && pathname !== "/dashboard") {
      return NextResponse.redirect(new URL("/doctor", request.url));
    }

    // Prevent doctors from accessing patient dashboard
    if (decodedUser.role === "DOCTOR" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/doctor", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

// Update the matcher to include doctor routes
export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/doctor/:path*"],
};
