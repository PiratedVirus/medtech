import { NextResponse } from "next/server";
import { msg91Service } from "@/lib/msg91-service";
import { 
  checkRateLimit, 
  isPhoneBlocked, 
  trackOtpAttempt, 
  cacheOtpRequest, 
  getCachedOtpRequest 
} from "@/lib/otp-cache";

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();

  try {
    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      return NextResponse.json({
        success: false,
        error: "Invalid phone number"
      }, { status: 400 });
    }

    // Check if phone number is blocked
    if (await isPhoneBlocked(phoneNumber)) {
      return NextResponse.json({
        success: false,
        error: "Too many attempts. Please try again later."
      }, { status: 429 });
    }

    // Check rate limiting
    if (!(await checkRateLimit(phoneNumber))) {
      return NextResponse.json({
        success: false,
        error: "Rate limit exceeded. Please wait before requesting another OTP."
      }, { status: 429 });
    }

    // Check if OTP request already exists
    const existingRequest = await getCachedOtpRequest(phoneNumber);
    if (existingRequest) {
      return NextResponse.json({
        success: true,
        message: "OTP already sent. Please check your phone.",
        cached: true
      });
    }

    // Send OTP using optimized MSG91 service
    const result = await msg91Service.sendOtp(phoneNumber);

    if (result.success) {
      // Cache the request
      await cacheOtpRequest(phoneNumber, result.data.reqId || 'cached');
      
      // Track attempt
      await trackOtpAttempt(phoneNumber);

      return NextResponse.json({ 
        success: true, 
        message: result.data.message || "OTP sent successfully",
        reqId: result.data.reqId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to send OTP"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}