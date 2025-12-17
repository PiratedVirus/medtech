import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import { checkUserExists, checkUserExistsInAnyClinic } from "@/lib/check-user";
import { msg91Service } from "@/lib/msg91-service";
import { clearOtpRequest } from "@/lib/otp-cache";
import { warmDoctorCaches } from "@/lib/cache-warming";
import { extractSubdomain } from "@/lib/subdomain-utils";
import { getClinicIdFromSubdomain } from "@/lib/clinic-context-middleware";

// JWT + cookie lifetime (in days)
const TOKEN_LIFETIME_DAYS = 15;
const TOKEN_LIFETIME_SECONDS = TOKEN_LIFETIME_DAYS * 24 * 60 * 60;

// Roles that require strict clinic assignment (cannot register in multiple clinics)
const STAFF_ROLES = ['DOCTOR', 'DIETICIAN', 'LAB_TECH', 'PATHOLOGY', 'PHLEBOTOMIST', 'ADMIN'];

/**
 * Get subdomain clinic ID from request
 */
async function getSubdomainClinicId(): Promise<number | null> {
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const subdomain = extractSubdomain(hostname);
  
  if (!subdomain) {
    return null;
  }
  
  return await getClinicIdFromSubdomain(subdomain);
}

/**
 * Verify staff role clinic access
 * Staff roles (doctors, etc.) cannot register in multiple clinics
 */
function verifyStaffClinicAccess(
  userClinicId: number | null,
  userRole: string,
  subdomainClinicId: number | null
): { allowed: boolean; error?: string } {
  // If no subdomain, allow access
  if (!subdomainClinicId) {
    return { allowed: true };
  }

  // Staff roles MUST be assigned to a clinic and it MUST match the subdomain
    if (!userClinicId) {
      return {
        allowed: false,
        error: "Your account is not assigned to any clinic. Please contact your administrator."
      };
    }
    
    if (userClinicId !== subdomainClinicId) {
      return {
        allowed: false,
        error: "You cannot access this clinic portal. Please use your assigned clinic's URL."
      };
    }
    
  return { allowed: true };
}

// Optimized OTP verification using MSG91 service

export async function POST(request: NextRequest) {
  const { phoneNumber, code, reqId } = await request.json();
  
  try {
    // Get clinic ID from subdomain
    const subdomainClinicId = await getSubdomainClinicId();
    
    // Validate input
    if (!phoneNumber || !code || !reqId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 });
    }

    // Verify OTP using optimized MSG91 service
    const verificationResult = await msg91Service.verifyOtp(phoneNumber, code, reqId);
    
    if (verificationResult.success) {
      const plusAddedPhoneNumber = "+" + phoneNumber;
      
      // Clear OTP request cache
      await clearOtpRequest(phoneNumber);
      
      // ===== MULTI-TENANCY: Check user in THIS specific clinic =====
      // A patient can register with same phone in multiple clinics
      const userInThisClinic = await checkUserExists(plusAddedPhoneNumber, subdomainClinicId);
      
      if (!userInThisClinic) {
        // User doesn't exist in THIS clinic
        // Check if they exist in any other clinic (for better UX messaging)
        const userInAnyClinic = await checkUserExistsInAnyClinic(plusAddedPhoneNumber);
        
        if (userInAnyClinic) {
          // User exists in another clinic
          const existingRole = userInAnyClinic.role;
          
          // Staff roles cannot register in multiple clinics
          if (STAFF_ROLES.includes(existingRole)) {
            console.log(`[AUTH] Staff user ${userInAnyClinic.id} (role: ${existingRole}) attempted to access different clinic`);
            return NextResponse.json({
              success: false,
              error: `You are registered as ${existingRole} at ${userInAnyClinic.clinic?.name || 'another clinic'}. Staff accounts cannot be used across multiple clinics.`,
              clinicMismatch: true,
              existingClinic: userInAnyClinic.clinic?.name || null
            }, { status: 403 });
          }
          
          // Patient exists in another clinic - allow registration in this clinic
          console.log(`[AUTH] Patient ${userInAnyClinic.id} exists in clinic ${userInAnyClinic.clinicId}, allowing registration in clinic ${subdomainClinicId}`);
        }
        
        // User doesn't exist in this clinic - they need to register
        return NextResponse.json({ 
          success: true, 
          userExists: false,
          isNewToThisClinic: !!userInAnyClinic, // Flag if they exist elsewhere
          message: userInAnyClinic 
            ? "You're not registered with this clinic yet. Please complete registration."
            : "OTP verified successfully. Please complete registration.",
          clinicId: subdomainClinicId
        });
      }

      // User exists in this clinic - proceed with login
      const userRole = userInThisClinic.role;
      const userClinicId = userInThisClinic.clinicId;

      // For staff roles, verify clinic access
      if (STAFF_ROLES.includes(userRole)) {
        const clinicAccess = verifyStaffClinicAccess(userClinicId, userRole, subdomainClinicId);
      
      if (!clinicAccess.allowed) {
          console.log(`[AUTH] Staff clinic access denied for user ${userInThisClinic.id} (role: ${userRole}, userClinicId: ${userClinicId}, subdomainClinicId: ${subdomainClinicId})`);
          return NextResponse.json({
            success: false,
            error: clinicAccess.error,
            clinicMismatch: true
          }, { status: 403 });
        }
      }

      // ADMIN and SUPER_ADMIN should use admin login
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        return NextResponse.json({
          success: false,
          error: "Please use the admin login portal.",
          clinicMismatch: true
        }, { status: 403 });
      }
      
      // Create JWT token with clinicId for this specific clinic
      const token = jwt.sign(
        { 
          plusAddedPhoneNumber, 
          userExists: true, 
          userRole: userRole,
          userId: userInThisClinic.id,
          clinicId: userClinicId || null
        },
        process.env.JWT_SECRET!,
        { expiresIn: `${TOKEN_LIFETIME_DAYS}d` }
      );
      
      const response = NextResponse.json({ 
        success: true, 
        userExists: true,
        message: "OTP verified and user authenticated",
        clinicId: userClinicId
      });
      
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: TOKEN_LIFETIME_SECONDS,
        path: "/",
      });
      
      // Warm doctor caches in background (non-blocking)
      if (userRole === "DOCTOR" || userRole === "DIETICIAN") {
        warmDoctorCaches(plusAddedPhoneNumber).catch((error) => {
          console.error("[AUTH] Cache warming failed (non-critical):", error);
        });
      }
      
      return response;
    } else {
      return NextResponse.json({
        success: false,
        error: verificationResult.error || "Invalid OTP",
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}
