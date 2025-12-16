import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getCachedUserProfile, getCachedUserProfileById } from "@/lib/auth-cache";
import { getSubdomainClinic } from "@/lib/clinic-auth";

interface TokenPayload {
  plusAddedPhoneNumber: string;
  userId?: number;
  clinicId?: number | null;
  userRole?: string;
}

export async function GET() {
  try {
    // Step 1: Get subdomain clinic for multi-tenancy
    const { clinicId: subdomainClinicId } = await getSubdomainClinic();
    
    // Step 2: Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Step 3: Verify JWT
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 403 },
      );
    }

    if (!decoded.plusAddedPhoneNumber) {
      return NextResponse.json(
        { success: false, error: "Invalid token payload" },
        { status: 403 },
      );
    }

    // Step 4: Fetch user details with multi-tenancy support
    // Priority 1: Use userId from token (new tokens have this)
    // Priority 2: Use phoneNumber + clinicId
    let user;
    
    if (decoded.userId) {
      // New tokens have userId - use it directly for accurate lookup
      user = await getCachedUserProfileById(decoded.userId);
      console.log("[get-user-profile] Fetched user by ID:", decoded.userId, "Found:", user?.id);
    } else {
      // Old tokens - use phoneNumber + clinicId for lookup
      // Use subdomain clinicId or token clinicId
      const clinicIdForLookup = subdomainClinicId || decoded.clinicId;
      user = await getCachedUserProfile(decoded.plusAddedPhoneNumber, clinicIdForLookup);
      console.log("[get-user-profile] Fetched user by phone+clinic:", decoded.plusAddedPhoneNumber, clinicIdForLookup, "Found:", user?.id);
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Step 5: Validate clinic access for multi-tenancy
    if (subdomainClinicId && user.clinicId !== subdomainClinicId) {
      console.log(`[get-user-profile] Clinic mismatch: user clinic ${user.clinicId}, subdomain clinic ${subdomainClinicId}`);
      return NextResponse.json(
        { 
          success: false, 
          error: "You are not registered with this clinic. Please use the correct clinic URL.",
          clinicMismatch: true
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[get-user-profile] Error:", error);
    return NextResponse.json(
      { success: false, error: "Token verification failed" },
      { status: 403 },
    );
  }
}
