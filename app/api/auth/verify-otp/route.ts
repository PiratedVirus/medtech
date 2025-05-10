import { NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import { checkUserExists } from "@/lib/check-user";

// Get your tokenAuth and widgetId from environment variables
const verifyOtpWithMsg91 = async (phoneNumber: string, otpCode: string, reqId: string, widgetId: string) => {
  const trimmedPhoneNumber = phoneNumber.replace(/\+/g, '').replace(/\s+/g, '');
  
  const url = `https://control.msg91.com/api/v5/widget/verifyOtp?otp=${otpCode}&mobile=${trimmedPhoneNumber}&widgetId=${widgetId}&reqId=${reqId}`;
  console.log("Widget ID:", widgetId);
  console.log("URL:", url);
  
  try {
    // Sending POST request to verify OTP
    const response = await axios.post(
      url, 
      {}, // Empty body or you can send payload if needed
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'tokenAuth': "448780TIwXeeD2gz9681126f7P1" // Your MSG91 auth key
        }
      }
    );
    console.log("MSG91 Verification Response:", response);
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('MSG91 Verification Error:', error.response.data);
      return error.response.data; // Return the error response for handling
    }
    console.error('MSG91 Verification Error:', error);
    throw new Error('Error verifying OTP: ' + (error as Error).message);
  }
};

export async function POST(request: Request) {
  const { phoneNumber, code, reqId, widgetId } = await request.json(); // Accept phone number, OTP, and reqId
  
  try {
    const verificationCheck = await verifyOtpWithMsg91(phoneNumber, code, reqId, widgetId);
    console.log("Verification Check Response:", verificationCheck);
    const plusAddedPhoneNumber = "+" + phoneNumber
    // Adjust this check based on the response format from MSG91
    if (verificationCheck.type === "success" || verificationCheck.status === "success") {
      const userExists = await checkUserExists(plusAddedPhoneNumber);
      const token = jwt.sign({ plusAddedPhoneNumber, userExists }, process.env.JWT_SECRET!, {
        expiresIn: "2592000",
      });
      
      const response = NextResponse.json({ success: true, userExists });
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 14400,
        path: "/",
      });
      
      return response;
    } else {
      return NextResponse.json({
        success: false,
        error: verificationCheck.message || "Invalid OTP",
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    });
  }
}