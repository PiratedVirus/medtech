"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import LoadingButton from "@/components/ui/custom/cd-loading-button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import RegistrationForm from "@/components/common/Registration";
import { isValidPhoneNumber } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInForm() {
  const [step, setStep] = useState<"signIn" | "otp" | "register">("signIn");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const searchParams = useSearchParams();
  const doctorCode = searchParams.get("doctorCode");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const router = useRouter();

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value !== "" && index < 3) inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      inputRefs[index - 1].current?.focus();
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    return `+91${phoneNumber}`;
  };

  const handleGetOtpClick = async () => {
    if (isValidPhoneNumber(phoneNumber)) {
      try {
        const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
        const trimmedPhoneNumber = formattedPhoneNumber.replace(/\+/g, '').replace(/\s+/g, '');

        const response = await axios.post("/api/auth/send-otp", {
          phoneNumber: trimmedPhoneNumber,
        });
        // console.log("the response is ", response);
        const data = response.data;
        if (data.success) {
          setStep("otp");
          setPhoneError("");
          const reqId = response.data.message;
          localStorage.setItem('reqId', reqId);
        } else {
          setPhoneError(data.error);
        }
      } catch (error) {
        setPhoneError("Failed to send OTP. Please try again.");
      }
    } else {
      setPhoneError("Please enter a valid 10-digit phone number.");
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.every((digit) => digit !== "")) {
      try {
        const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
        const trimmedPhoneNumber = formattedPhoneNumber.replace(/\+/g, '').replace(/\s+/g, '');

        const reqId = localStorage.getItem('reqId');
        const response = await axios.post("/api/auth/verify-otp", {
          phoneNumber: trimmedPhoneNumber,
          code: otp.join(""),
          reqId: reqId,
          widgetId: "356441767046363535383038"
        });
        const data = response.data;
        console.log("handleOtpSubmit response is ", response)

        if (data.success) {
          if (data.userExists) {
            window.location.href = "/dashboard";
          } else {
            setStep("register");
          }
          setOtpError("");
        } else {
          setOtpError(data.error);
        }
      } catch (error) {
        setOtpError("Failed to verify OTP. Please try again.");
      }
    } else {
      setOtpError("Please enter the complete OTP.");
    }
  };

  const handleRegistrationSubmit = async (data: any) => {
    try {
      const response = await axios.post("/api/auth/register", {
        ...data,
        phoneNumber: formatPhoneNumber(phoneNumber),
        doctorCode: doctorCode || data.doctorCode,
      });
      if (response.data.success) {
        window.location.href = "/dashboard";
      } else {
        alert("Registration Failed: " + response.data.error);
      }
    } catch (error: any) {
      alert("Registration Failed: " + error.message);
    }
  };

  return (
    <div className={`flex items-center justify-center p-6 h-full bg-[#f9fafb]`}>
      <div className="w-full max-w-[400px] space-y-16">
        {step === "signIn" ? (
          // **Sign In View**
          <div className="text-center">
            <h1 className="text-custom-green text-2xl font-normal">Sign in</h1>
            <div className="h-0.5 w-12 bg-custom-green mt-2 mx-auto" />
          </div>
        ) : step === "otp" ? (
          // **OTP View**
          <div className="flex justify-between items-center">
            <button
              className="flex items-center text-custom-green gap-1 text-[15px]"
              onClick={() => setStep("signIn")}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="text-center">
              <h1 className="text-custom-green text-[22px] font-normal">OTP</h1>
              <div className="h-0.5 w-8 bg-custom-green mt-1 mx-auto" />
            </div>
            <div className="w-[52px]" />
          </div>
        ) : (
          // **Registration View**
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto pb-20 px-2">
            <h1 className="text-custom-green text-center text-2xl font-normal">Register</h1>
            <div className="h-0.5 w-12 bg-custom-green text-center mt-2 mx-auto" />
            <RegistrationForm 
              onSubmit={handleRegistrationSubmit} 
              preFilledDoctorCode={doctorCode}
              isDoctorCodeDisabled={!!doctorCode}
            />
          </div>
        )}

        <div className="space-y-12">
          {step === "signIn" ? (
            <div>
              <h2 className="text-[28px] text-gray-800 font-normal mb-8">
                Enter 10-Digit mobile number
              </h2>
              <div className="flex rounded-[16px] overflow-hidden border border-gray-200">
                <div className="flex items-center px-6 bg-white text-gray-600 text-lg">
                  +91
                </div>
                <Input
                  type="tel"
                  required
                  placeholder="Enter your number"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numeric values and limit to 10 digits
                    if (/^\d{0,10}$/.test(value)) {
                      setPhoneNumber(value);
                    }
                  }}
                  pattern="\d{10}" // Ensures only 10 digits are valid
                  className="border-0 focus-visible:ring-0 text-lg bg-white placeholder:text-gray-300 h-14 px-6"
                />
              </div>
              {phoneError && (
                <p className="text-red-500 text-sm mt-2">{phoneError}</p>
              )}
            </div>
          ) : step === "otp" ? (
            <div>
              <h2 className="text-[26px] text-gray-800 font-normal mb-8 text-center">
                Enter OTP
              </h2>
              <div className="flex gap-4 justify-center mb-6">
                {[0, 1, 2, 3].map((index) => (
                  <Input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={otp[index]}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    ref={inputRefs[index]}
                    className="w-[72px] h-[72px] text-center text-2xl bg-white rounded-2xl border-gray-200 focus-visible:ring-1 focus-visible:ring-custom-green focus-visible:ring-offset-0 shadow-sm"
                  />
                ))}
              </div>
              {otpError && (
                <p className="text-red-500 text-sm mt-2">{otpError}</p>
              )}
              <button className="text-custom-green text-[15px] text-center w-full">
                Resend OTP
              </button>
            </div>
          ) : null}

          {/* Button: Get OTP */}
          {step === "signIn" && (
            <LoadingButton
              className="w-full h-14 bg-[#f28a2e] rounded-lg shadow-[0px_12px_21px_4px_rgba(224,126,41,0.33)]"
              onClick={handleGetOtpClick}
              loadingText="Sending..."
            >
              Get OTP
            </LoadingButton>
          )}

          {/* Button: Verify OTP */}
          {step === "otp" && (
            <LoadingButton
              className="w-full h-14 bg-[#f28a2e] rounded-lg shadow-[0px_12px_21px_4px_rgba(224,126,41,0.33)]"
              onClick={handleOtpSubmit}
              loadingText="Verifying..."
            >
              Verify OTP
            </LoadingButton>
          )}

          {/* Terms and Privacy */}
          <div className="text-center text-[15px] text-gray-600">
            By signing in you agree to our{" "}
            <Link href="/about/policies#terms-conditions" className="text-custom-green">
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link href="/about/policies#privacy-policy" className="text-custom-green">
              Privacy Policy
            </Link>
          </div>

          {/* Doctor Sign In */}
          {step === "signIn" && (
            <div className="text-center text-[15px] text-gray-600">
              Are you a doctor?{" "}
              <Link href="#" className="text-custom-green">
                Sign In
              </Link>{" "}
              here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
