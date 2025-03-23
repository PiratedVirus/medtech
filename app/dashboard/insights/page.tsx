"use client";

import React from "react";
import { useDecryptedProfile } from "@/hooks/use-profile";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import CdLoader from "@/components/ui/custom/cd-loader";
import HealthInsightsCard from "@/components/ui/custom/cd-health-insights-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Color constants
const COLOR_NORMAL = "#56A67C";   // custom.green
const COLOR_HOVER = "#E6F4F1";    // custom.mutedgreen

// Metric config from your code
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

type MonthData = {
  month: string; // e.g. "2025-03"
  average: number;
};

type MetricData = {
  metricName: string;
  data: MonthData[];
};

/** Convert "YYYY-MM" to "Mar", "Apr", etc. */
function formatMonthLabel(ymString: string) {
  const [year, month] = ymString.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "short" });
}

export default function DetailedHealthInsights() {
  const { profile } = useDecryptedProfile();
  const router = useRouter();

  // Fetch data with React Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["insights", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const res = await fetch(`/api/insights?userId=${profile.id}`);
      return res.json();
    },
    enabled: !!profile?.id,
  });

  // Loading states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <CdLoader />
      </div>
    );
  }
  if (isError || !data) {
    return <div className="p-8">Failed to load insights.</div>;
  }
  if (!data.success || !data.metrics || data.metrics.length === 0) {
    return <div className="p-8">No Insights Available</div>;
  }

  const metrics: MetricData[] = data.metrics;

  return (
    <div className="p-8">
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Full Insights</h1>

      {metrics.map((metric) => (
        <MetricChartRow
          key={metric.metricName}
          metric={metric}
          formatMonthLabel={formatMonthLabel}
        />
      ))}
    </div>
  );
}

/**
 * Child component for each metric row
 */
function MetricChartRow({
  metric,
  formatMonthLabel,
}: {
  metric: MetricData;
  formatMonthLabel: (ymString: string) => string;
}) {
  // The hook is safely inside a dedicated component
  const [hoverIndex, setHoverIndex] = React.useState(-1);

  // Slice last 6 months if more than 6 data points
  const lastSixMonths = metric.data.slice(-6).map((m) => ({
    ...m,
    month: formatMonthLabel(m.month),
  }));

  // Latest average reading for the card
  const latest = lastSixMonths[lastSixMonths.length - 1]?.average ?? 0;

  // Pull config or fallback
  const config = METRIC_CONFIG[metric.metricName] || {
    color: "#FDFDFD",
    imageSrc: "/icons/default.svg",
    unit: "",
    statusLabel: "Normal",
  };

  return (
    <div className="mb-8 flex gap-4 items-start">
      {/* Chart */}
      <div className="w-2/3">
        <h2 className="text-xl font-semibold mb-2">{metric.metricName}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={lastSixMonths}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="average" stroke={COLOR_NORMAL}>
              {lastSixMonths.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={hoverIndex === index ? COLOR_HOVER : COLOR_NORMAL}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(-1)}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Card on the right */}
      <div className="w-1/3">
        <HealthInsightsCard
          title={metric.metricName}
          reading={latest}
          unit={config.unit}
          statusLabel={config.statusLabel}
          color={config.color}
          imageSrc={config.imageSrc}
          // example chart data for the mini preview inside the card
          data={lastSixMonths.map((d) => ({ value: d.average }))}
        />
      </div>
    </div>
  );
}