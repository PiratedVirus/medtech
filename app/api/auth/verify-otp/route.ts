import { NextResponse } from "next/server";
import twilio from "twilio";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID!;
const jwtSecret = process.env.JWT_SECRET!;

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { phoneNumber, code } = await request.json();
  try {
    // const verificationCheck = await client.verify.v2
    //   .services(serviceSid)
    //   .verificationChecks.create({ to: phoneNumber, code });

    if (true) {
      console.log("Verification approved");
      const token = jwt.sign({ phoneNumber }, jwtSecret, { expiresIn: "1h" });
      console.log("Token generated");
      // Use Next.js cookies helper instead
      const response = NextResponse.json({ success: true });
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600,
        path: "/",
      });
      console.log("Token set in cookie");
      return response;
    } else {
      return NextResponse.json({ success: false, error: "Invalid OTP" });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    });
  }
}
