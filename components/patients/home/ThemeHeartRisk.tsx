"use client"

import Link from "next/link"
import { Activity, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function HeartRiskCardOrangeGreen() {
  return (
    <Link href="/heart-risk-predictor" className="block">
      <Card className="group relative aspect-[3/2] w-full max-w-md overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-green-50 shadow-md transition-all duration-300 hover:shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-green-500/10 opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-orange-400/20" />
        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-green-400/20" />

        <div className="relative flex h-full flex-col justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-green-500 text-white shadow-md">
              <Activity className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-orange-700">Patient Analytics</span>
          </div>

          <div>
            <h3 className="mb-2 text-2xl font-bold text-gray-800">Heart Risk Predictor</h3>
            <p className="mb-4 text-sm text-gray-600">
              Analyze cardiovascular health factors and predict potential risks
            </p>

            <div className="flex items-center text-sm font-medium text-green-600 transition-all duration-300 group-hover:translate-x-1">
              Check your heart health
              <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
