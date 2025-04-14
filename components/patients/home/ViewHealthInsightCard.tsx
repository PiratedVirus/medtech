"use client"

import Link from "next/link"
import { LineChart, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function ViewHealthInsightsCard() {
  return (
    <Link href="/health-insights" className="block">
      <Card className="group relative w-full max-w-xs overflow-hidden border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
        {/* Large chart outline in background */}
        <div className="absolute -right-8 -top-4 h-40 w-40 opacity-5">
          <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-[#134F30]">
            <path
              d="M21 21H4.6c-.56 0-1.1-.22-1.48-.62C2.76 20 2.53 19.46 2.5 18.9V3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 7L15.5 12.5L11.5 8.5L3 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="relative flex flex-col justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F28A2E]/10 to-[#56A67C]/10">
              <LineChart className="h-5 w-5 text-[#134F30]" />
            </div>
            <span className="text-sm font-medium text-[#F28A2E]">Health Analytics</span>
          </div>

          <div className="mt-4">
            <h3 className="mb-1 text-lg font-semibold text-gray-800">View Health Insights</h3>
            <p className="mb-3 text-xs text-gray-600">Personalized analysis of your health metrics and trends</p>

            <div className="flex items-center text-sm font-medium text-[#134F30] transition-all duration-300 group-hover:translate-x-1">
              Explore your insights
              <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
