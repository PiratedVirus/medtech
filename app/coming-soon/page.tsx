"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Stethoscope, Calendar, Shield, Clock } from "lucide-react"
import Image from "next/image"

export default function ComingSoonOption3() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setEmail("")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">


      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left Side */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
          <div className="max-w-xl space-y-8">
            <div>
            <Image src="/images/new-logo.png" alt="Logo" width={300} height={300} className="my-8" />

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight">
                  Coming Soon
              </h1>
              <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
                We're building a comprehensive healthcare platform that prioritizes your wellbeing with cutting-edge
                technology and compassionate care.
              </p>
              <Button variant={"outline"} className="mt-6 bg-primary hover:bg-primary text-white">
                <a href="/dashboard">Back to Dashboard</a>
              </Button>
            </div>



            {/* <div className="pt-6">
              <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                  {!isSubscribed ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Get Notified at Launch</h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="flex-1"
                          required
                        />
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-green-600 to-orange-600 hover:from-green-700 hover:to-orange-700 text-white"
                        >
                          Notify Me
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        By subscribing, you agree to our Privacy Policy and Terms of Service.
                      </p>
                    </form>
                  ) : (
                    <div className="text-center py-4 space-y-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-orange-500 rounded-full flex items-center justify-center mx-auto">
                        <Stethoscope className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Thank you!</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        We'll notify you when our healthcare platform launches.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div> */}
          </div>
        </div>

        {/* Right Side - Large Icon */}
        <div className="hidden md:flex w-1/2 bg-secondary items-center justify-center">
          <div className="p-16">
            <Stethoscope className="w-64 h-64 text-white opacity-90" strokeWidth={1} />
          </div>
        </div>
      </main>


    </div>
  )
}
