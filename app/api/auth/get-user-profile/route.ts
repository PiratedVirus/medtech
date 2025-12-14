import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { getCachedUserProfile } from "@/lib/auth-cache";
import { verifyPatientClinicMatch } from "@/lib/patient-clinic-middleware";

export async function GET() {
  try {
    // Get clinic ID from headers (set by middleware)
    const headersList = await headers();
    const clinicIdHeader = headersList.get('x-clinic-id');
    const subdomainClinicId = clinicIdHeader ? parseInt(clinicIdHeader, 10) : null;
    // Step 1: Await cookies() and extract token
    const cookieStore = await cookies(); //  Await cookies()
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Step 2: Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      plusAddedPhoneNumber: string;
    };
    console.log("Decoded JWT:", decoded);
    console.log("Decoded phone number:", decoded.plusAddedPhoneNumber);
    if (!decoded.plusAddedPhoneNumber) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );
    }

    // Step 3: Fetch user details from Redis cache (with database fallback)
    const user = await getCachedUserProfile(decoded.plusAddedPhoneNumber);
    console.log("Fetched user from cache:", user);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // For PATIENT role, verify clinic context matches
    if (user.role === "PATIENT" && subdomainClinicId) {
      const patientClinicId = user.clinicId;
      
      if (!verifyPatientClinicMatch(patientClinicId, subdomainClinicId)) {
        return NextResponse.json(
          { 
            success: false, 
            error: "You cannot access this clinic portal. Please use the correct clinic URL.",
            clinicMismatch: true
          },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Token verification failed" },
      { status: 403 },
    );
  }
}
