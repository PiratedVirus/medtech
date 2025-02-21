import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID!;

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { phoneNumber, code } = await request.json();

  try {
    const verificationCheck = await client.verify.v2.services(serviceSid)
      .verificationChecks
      .create({ to: phoneNumber, code });

    if (verificationCheck.status === 'approved') {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid OTP' });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}