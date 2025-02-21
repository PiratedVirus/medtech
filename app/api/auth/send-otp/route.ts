import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID as string;

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();

  try {
    const verification = await client.verify.v2.services(serviceSid)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });

    return NextResponse.json({ success: true, verification });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message });
  }
}