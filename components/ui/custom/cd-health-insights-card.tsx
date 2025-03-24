"use client";
import React from "react";
import { Card } from "@/components/ui/card"
import { Pencil } from "lucide-react"
import { AreaChart } from "@/components/ui/chart"
import Image from "next/image";

/** Darken a hex color by `factor` (0.2 => 20% darker) */
function darkenHex(hex: string, factor = 0.6) {
  let c = hex.replace(/^#/, "");
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];

  let r = parseInt(c.slice(0, 2), 16);
  let g = parseInt(c.slice(2, 4), 16);
  let b = parseInt(c.slice(4, 6), 16);

  r = Math.round(r * (1 - factor));
  g = Math.round(g * (1 - factor));
  b = Math.round(b * (1 - factor));

  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  const rr = r.toString(16).padStart(2, "0");
  const gg = g.toString(16).padStart(2, "0");
  const bb = b.toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
}

export default function HealthInsightsCard({
  title = "Blood Glucose Level",
  reading = 80,
  unit = "mg/dL",
  statusLabel = "Normal",
  color = "#F8E5D3",
  imageSrc = "/icons/blood.svg",
  data = [{ value: 65 }, { value: 75 }, { value: 70 }, { value: 85 }, { value: 75 }, { value: 80 }, { value: 75 }],
}) {
  // Make the line a darker shade of the given color
  const darkerLineColor = darkenHex(color, 0.3);

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

      <div className="h-20">
        <AreaChart
          lineColor={darkerLineColor}
          data={data}
          className="h-20"
          showXAxis={false}
          showYAxis={false}
          showGridLines={false}
        />
      </div>
    </Card>
  )
}