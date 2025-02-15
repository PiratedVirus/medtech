"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lato } from "next/font/google"
import Link from "next/link"

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
})

export default function SignIn() {
  return (
    <div className={`${lato.variable} font-sans min-h-screen flex items-center justify-center p-6 bg-white`}>
      <div className="w-full max-w-[440px] space-y-16">
        {/* Sign in header */}
        <div className="text-center">
          <h1 className="text-custom-green text-2xl font-normal">Sign in</h1>
          <div className="h-0.5 w-12 bg-custom-green mt-2 mx-auto" />
        </div>

        <div className="space-y-12">
          {/* Mobile number input section */}
          <div>
            <h2 className="text-[28px] text-gray-800 font-normal mb-8">Enter 10-Digit mobile number</h2>

            <div className="flex rounded-[16px] overflow-hidden border border-gray-200">
              <div className="flex items-center px-6 bg-white text-gray-600 text-lg">+91</div>
              <Input
                type="tel"
                placeholder="Enter your number"
                className="border-0 focus-visible:ring-0 text-lg placeholder:text-gray-300 h-14 px-6"
              />
            </div>
          </div>

          {/* Get OTP Button */}
          <Button className="w-full bg-custom-orange hover:bg-custom-orange/95 text-white rounded-[16px] h-14 text-xl font-normal shadow-custom">
            Get OTP
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

          {/* Doctor Sign In */}
          <div className="text-center text-[15px] text-gray-600">
            Are you a doctor?{" "}
            <Link href="#" className="text-custom-green">
              Sign In
            </Link>{" "}
            here
          </div>
        </div>
      </div>
    </div>
  )
}

