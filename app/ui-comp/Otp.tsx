"use client"

import React  from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useState, useRef } from "react"

export default function OTPVerification() {
  const [otp, setOtp] = useState(["", "", "", ""])
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      if (value !== "" && index < 3) {
        inputRefs[index + 1].current?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      inputRefs[index - 1].current?.focus()
    }
  }

  return (
    <div className="w-[400px] bg-[#FAFAFA] p-6 font-[-apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto]">
      {/* Header */}
      <div className="flex justify-between items-center mb-14">
        <button className="flex items-center text-custom-green gap-1 text-[15px]">
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-custom-green text-[22px] font-normal">OTP</h1>
          <div className="h-0.5 w-8 bg-custom-green mt-1" />
        </div>
        <div className="w-[52px]" />
      </div>

      {/* OTP Input Section */}
      <div className="space-y-14">
        <div>
          <h2 className="text-[26px] text-gray-800 font-normal mb-8">Enter OTP</h2>

          <div className="flex gap-4 justify-between mb-6">
            {[0, 1, 2, 3].map((index) => (
              <Input
                key={index}
                type="text"
                maxLength={1}
                value={otp[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={inputRefs[index]}
                className="w-[72px] h-[72px] text-center text-2xl bg-white rounded-2xl border-gray-200 focus-visible:ring-1 focus-visible:ring-custom-green focus-visible:ring-offset-0 shadow-sm"
              />
            ))}
          </div>

          <button className="text-custom-green text-[15px] text-center w-full">Resend OTP</button>
        </div>

        {/* Submit Button */}
        <Button className="w-full bg-custom-orange hover:bg-custom-orange/95 text-white rounded-[16px] h-14 text-lg font-normal shadow-custom">
          Submit
        </Button>

        {/* Terms and Privacy */}
        <div className="text-center text-[15px] text-gray-600">
          By signing in you agree to our{" "}
          <Link href="#" className="text-custom-green">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="#" className="text-custom-green">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}

