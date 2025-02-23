import { NextResponse } from "next/server";
import twilio from "twilio";
import jwt from "jsonwebtoken";
import { checkUserExists } from "@/lib/check-user";
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
      const userExists = await checkUserExists(phoneNumber);
      const token = jwt.sign({ phoneNumber, userExists }, jwtSecret, {
        expiresIn: "24h",
      });
      console.log("Token generated");
      // Use Next.js cookies helper instead
      const response = NextResponse.json({ success: true, userExists });
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
