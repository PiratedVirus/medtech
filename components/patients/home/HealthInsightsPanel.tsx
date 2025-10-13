"use client";

import React from "react";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import CdLoader from "@/components/ui/custom/cd-loader";
import HealthInsightsCard from "@/components/ui/custom/cd-health-insights-card";
import Link from "next/link";

/** DB returns data in this shape */
type MonthData = {
  month: string;
  average: number;
};

type MetricData = {
  metricName: string;   // e.g. "Blood Glucose"
  data: MonthData[];    // e.g. monthly averages
};

// Optional config if you want to match icons/colors from DB metric names
const METRIC_CONFIG: Record<
  string,
  { color: string; imageSrc: string; unit: string; statusLabel: string }
> = {
  "Blood Glucose": {
    color: "#F8E5D3",
    imageSrc: "/icons/blood.svg",
    unit: "mg/dL",
    statusLabel: "Normal",
  },
  "Body Fat": {
    color: "#FAD4D4",
    imageSrc: "/icons/body-fat.svg",
    unit: "%",
    statusLabel: "Normal",
  },
  "Muscle Mass": {
    color: "#D4F1F9",
    imageSrc: "/icons/muscle.svg",
    unit: "%",
    statusLabel: "Normal",
  },
  "BMI": {
    color: "#F9D4D4",
    imageSrc: "/icons/bmi.svg",
    unit: "",
    statusLabel: "Normal",
  },
  "Blood Pressure": {
    color: "#E0C6FC",
    imageSrc: "/icons/water.svg",
    unit: "mm/hg",
    statusLabel: "Normal",
  },
  "Visceral Fat": {
    color: "#C6DAFC",
    imageSrc: "/icons/v-fat.svg",
    unit: "level",
    statusLabel: "Normal",
  },
};

// Default metrics to show when no data is available
const DEFAULT_METRICS = [
  "Blood Pressure",
  "Blood Glucose",
  "Body Fat",
  "Muscle Mass",
  "BMI",
  "Visceral Fat"
];

export default function HealthInsightsPanel() {
  const { profile } = useDecryptedProfile();
  const router = useRouter();

  // 1) Fetch data from the same endpoint used by Detailed Insights
  const { data, isLoading } = useQuery({
    queryKey: ["insightsPanel", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const res = await fetch(`/api/insights?userId=${profile.id}`);
      return res.json();
    },
    enabled: !!profile?.id,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <CdLoader />
      </div>
    );
  }

  // Initialize metrics - always ensure all DEFAULT_METRICS are included
  let metricsMap = new Map();
  
  // First, prepare all default metrics with zero values
  DEFAULT_METRICS.forEach(metricName => {
    const config = METRIC_CONFIG[metricName];
    metricsMap.set(metricName, {
      title: metricName,
      reading: 0,
      unit: config.unit,
      statusLabel: "No Data",
      color: config.color,
      imageSrc: config.imageSrc,
      data: [{ value: 0 }],
      userId: Number(profile?.id)
    });
  });
  
  // Then, override with actual data where available
  if (data?.success && data?.metrics?.length > 0) {
    data.metrics.forEach((m: MetricData) => {
      const config = METRIC_CONFIG[m.metricName] || {
        color: "#EEE",
        imageSrc: "/icons/blood.svg",
        unit: "",
        statusLabel: "Normal",
      };
      
      const lastValue = m.data.slice(-1)[0]?.average ?? 0;
      
      metricsMap.set(m.metricName, {
        title: m.metricName,
        reading: lastValue,
        unit: config.unit,
        statusLabel: config.statusLabel,
        color: config.color,
        imageSrc: config.imageSrc,
        data: m.data.map((x: MonthData) => ({ value: x.average })),
        userId: Number(profile?.id)
      });
    });
  }
  
  // Convert map to array
  const mappedMetrics = Array.from(metricsMap.values());

  return (
    <div className="py-4 px-4 md:px-20 bg-custom-mutedbg flex flex-col justify-center">
      <div className="flex items-end w-full pb-5 justify-between my-3">
        <h2 className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-3xl font-semibold bg-clip-text text-transparent">
          Health Insights
        </h2>
        <Link
    href="/dashboard/insights"
    className="text-primary text-xl underline p-1 rounded-full transition-colors"
  >
    View Insights
  </Link>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-6 overflow-x-auto w-full h-[366px]">
        {mappedMetrics.map((metric, index) => (
          <div key={index} className="w-72 h-[366px]">
            <HealthInsightsCard {...metric} />
          </div>
        ))}
      </div>
    </div>
  );
}