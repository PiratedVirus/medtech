"use client"
import React from "react";
import { Card } from "@/components/ui/card"
import { Pencil } from "lucide-react"
import { AreaChart } from "@/components/ui/chart"
import Image from "next/image";

// ...existing code...
export default function HealthInsightsCard({
  title = "Blood Glucose Level",
  reading = 80,
  unit = "mg/dL",
  statusLabel = "Normal",
  color = "#F8E5D3",
  imageSrc = "/icons/blood.svg",
  data = [{ value: 65 }, { value: 75 }, { value: 70 }, { value: 85 }, { value: 75 }, { value: 80 }, { value: 75 }],
}: {
  title?: string
  reading?: number
  unit?: string
  statusLabel?: string
  color?: string
  imageSrc?: string
  data?: { value: number }[]
}) {
  return (
    <Card className="w-full max-w-80 p-6 rounded-3xl bg-white border">
      <div className="flex items-center gap-4 mb-8">
        <Image
          className="flex"
          src={imageSrc}
          width={58}
          height={58}
          alt={title}
        />
        <h2 className="text-xl font-medium">{title}</h2>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-5xl font-medium">{reading}</span>
        <span className="text-gray-500 text-xl">{unit}</span>
        <button className="ml-1 hover:bg-gray-100 p-1 rounded-full transition-colors">
          <Pencil className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="inline-block mb-6">
        <div className="px-4 py-1 rounded-full" style={{ backgroundColor: color }}>
          <span className="text-sm font-medium">{statusLabel}</span>
        </div>
      </div>

      <div className="h-[100px]">
        <AreaChart
          lineColor={color}
          data={data}
          className="h-[100px]"
          showXAxis={false}
          showYAxis={false}
          showGridLines={false}
        />
      </div>
    </Card>
  )
}