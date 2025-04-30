import { NextResponse } from "next/server";
import axios from "axios";

// Set up MSG91 credentials
const msg91AuthKey = process.env.MSG91_AUTH_KEY!;
const msg91WidgetId = process.env.MSG91_WIDGET_ID!; // Widget ID from MSG91
const msg91TokenAuth = process.env.MSG91_TOKEN_AUTH!; // Token Auth from MSG91

// Function to send OTP using MSG91 Widget API
const sendOtpWithMsg91 = async (phoneNumber: string) => {
  const trimmedPhoneNumber = phoneNumber.replace(/\+/g, '').replace(/\s+/g, '');
  const url = `https://control.msg91.com/api/v5/widget/sendOtp`;

  const payload =   {
    "tokenAuth": "448780TIwXeeD2gz9681126f7P1",
    "widgetId": "356441767046363535383038",
    "identifier": trimmedPhoneNumber
}

  try {
    // Send OTP request to MSG91 API
    const response = await axios.post(url, payload);

    return response.data;
  } catch (error) {
    throw new Error('Error sending OTP: ' + (error as Error).message);
  }
};

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();

  try {
    // Send OTP using MSG91
    const response = await sendOtpWithMsg91(phoneNumber);
    // console.log("the response is ", response);

    // Check the response from MSG91
    if (response.type === "success") {
      return NextResponse.json({ success: true, message: response.message });
    } else {
      return NextResponse.json({ success: false, error: response.message });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    });
  }
}