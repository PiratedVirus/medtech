"use client";

import React from "react";
import { useDecryptedProfile } from "@/hooks/use-profile";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import CdLoader from "@/components/ui/custom/cd-loader";
import HealthInsightsCard from "@/components/ui/custom/cd-health-insights-card";

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
  "Body Water": {
    color: "#E0C6FC",
    imageSrc: "/icons/water.svg",
    unit: "%",
    statusLabel: "Normal",
  },
  "Visceral Fat": {
    color: "#C6DAFC",
    imageSrc: "/icons/v-fat.svg",
    unit: "%",
    statusLabel: "Normal",
  },
};

export default function HealthInsightsPanel() {
  const { profile } = useDecryptedProfile();
  const router = useRouter();

  // 1) Fetch data from the same endpoint used by Detailed Insights
  const { data, isLoading, isError } = useQuery({
    queryKey: ["insightsPanel", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const res = await fetch(`/api/insights?userId=${profile.id}`);
      return res.json();
    },
    enabled: !!profile?.id,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <CdLoader />
      </div>
    );
  }
  if (isError || !data) {
    return <div className="p-4">Failed to load insights.</div>;
  }
  if (!data.success || data.metrics.length === 0) {
    return <div className="p-4">No Insights Available</div>;
  }

  // data.metrics is an array of MetricData from DB
  const metrics: MetricData[] = data.metrics;

  // 2) Transform each metric to the shape needed by HealthInsightsCard
  const mappedMetrics = metrics.map((m) => {
    const config = METRIC_CONFIG[m.metricName] || {
      color: "#EEE",
      imageSrc: "/icons/blood.svg",
      unit: "",
      statusLabel: "Normal",
    };
    // latest reading = last monthly average
    const lastValue = m.data.slice(-1)[0]?.average ?? 0;

    return {
      title: m.metricName,
      reading: lastValue,
      unit: config.unit,
      statusLabel: config.statusLabel,
      color: config.color,
      imageSrc: config.imageSrc,
      // We can map the monthly data to the "data" array for a mini-sparkline if you want
      data: m.data.map((x) => ({ value: x.average })),
      userId: Number(profile?.id)
    };
  });

  return (
    <div className="px-20 py-4 bg-custom-mutedbg flex flex-col justify-center">
      <div className="flex items-end w-full pb-5 justify-between my-3">
        <h2 className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-3xl font-semibold bg-clip-text text-transparent">
          Health Insights
        </h2>
        <button
          className="text-primary text-xl underline p-1 rounded-full transition-colors"
          onClick={() => router.push("/dashboard/insights")}
        >
          View Insights
        </button>
      </div>

      <div className="flex flex-row gap-3">
        {mappedMetrics.map((metric, index) => (
          <HealthInsightsCard key={index} {...metric} />
        ))}
      </div>
    </div>
  );
}