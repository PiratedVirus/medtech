import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { checkUserExists } from "@/lib/check-user";
import { msg91Service } from "@/lib/msg91-service";
import { clearOtpRequest } from "@/lib/otp-cache";
import { warmDoctorCaches } from "@/lib/cache-warming";
import { getPatientClinicId, verifyPatientClinicMatch } from "@/lib/patient-clinic-middleware";
import prisma from "@/lib/prisma";

// JWT + cookie lifetime (in days)
const TOKEN_LIFETIME_DAYS = 15;   // ⬅️ change this to whatever “more than a week” means to you
const TOKEN_LIFETIME_SECONDS = TOKEN_LIFETIME_DAYS * 24 * 60 * 60;

// Optimized OTP verification using MSG91 service

export async function POST(request: NextRequest) {
  const { phoneNumber, code, reqId } = await request.json();
  
  try {
    // Get clinic ID from subdomain (set by middleware)
    const subdomainClinicId = getPatientClinicId(request);
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
      
      // Check if user exists
      const user = await checkUserExists(plusAddedPhoneNumber);
      if (!user) {
        return NextResponse.json({ 
          success: true, 
          userExists: false,
          message: "OTP verified successfully"
        });
      }

      // For PATIENT role, verify clinic context matches
      if (user.role === "PATIENT" && subdomainClinicId) {
        const patientClinicId = user.clinicId;
        
        // If patient has no clinic, allow (will be set during registration)
        if (!patientClinicId) {
          // Patient will be assigned clinic during registration
        } else if (!verifyPatientClinicMatch(patientClinicId, subdomainClinicId)) {
          // Patient belongs to different clinic - deny access
          return NextResponse.json({
            success: false,
            error: "You cannot access this clinic portal. Please use the correct clinic URL.",
            clinicMismatch: true
          }, { status: 403 });
        }
      }

      const userRole = user?.role;
      
      // Create JWT token for existing users
      const token = jwt.sign(
        { plusAddedPhoneNumber, userExists: true, userRole: userRole },
        process.env.JWT_SECRET!,
        { expiresIn: `${TOKEN_LIFETIME_DAYS}d` }
      );
      
      const response = NextResponse.json({ 
        success: true, 
        userExists: true,
        message: "OTP verified and user authenticated"
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