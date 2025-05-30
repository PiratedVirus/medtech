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
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";
import { ArrowLeft } from "lucide-react";

// Colors
const BAR_FILL_NORMAL = "#E6F4F1";      // default bar fill
const BAR_FILL_HOVER = "#064e3b";      // darker green on hover
const AXIS_LINE_COLOR = "#666666";     // match x-axis line color

// (Optional) Same config if you want to map metricName => color/icon
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

type MonthData = {
  month: string;
  average: number;
};

type MetricData = {
  metricName: string;
  data: MonthData[];
};

function formatMonthLabel(ymString: string) {
  const [year, month] = ymString.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "short" });
}

// Generate empty data for last 6 months
function generateEmptyMonthlyData() {
  const data = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(today.getMonth() - i);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    
    data.push({
      month: `${year}-${month}`,
      average: 0
    });
  }
  
  return data;
}

export default function DetailedHealthInsights() {
  const { profile } = useDecryptedProfile();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["insights", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const res = await fetch(`/api/insights?userId=${profile.id}`);
      return res.json();
    },
    enabled: !!profile?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <CdLoader />
      </div>
    );
  }

  // Initialize metrics - always ensure all DEFAULT_METRICS are included
  let metricsMap = new Map();
  
  // First, prepare all default metrics with zero values
  DEFAULT_METRICS.forEach(metricName => {
    metricsMap.set(metricName, {
      metricName,
      data: generateEmptyMonthlyData()
    });
  });
  
  // Then, override with actual data where available
  if (data?.success && data?.metrics?.length > 0) {
    data.metrics.forEach((metric: MetricData) => {
      metricsMap.set(metric.metricName, metric);
      
      // Also add any additional metrics from API that weren't in our defaults
      if (!DEFAULT_METRICS.includes(metric.metricName)) {
        metricsMap.set(metric.metricName, metric);
      }
    });
  }
  
  // Convert map to array
  const metrics: MetricData[] = Array.from(metricsMap.values());

  return (
    <div className="bg-muted min-h-screen px-4 sm:px-8 md:px-16 lg:px-20 py-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="inline-flex items-center text-primary mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
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

/** Child component for each metric row */
function MetricChartRow({
  metric,
  formatMonthLabel,
}: {
  metric: MetricData;
  formatMonthLabel: (ymString: string) => string;
}) {
  const [hoverIndex, setHoverIndex] = React.useState(-1);

  const lastSixMonths = metric.data.slice(-6).map((m) => ({
    ...m,
    month: formatMonthLabel(m.month),
  }));
  const latest = lastSixMonths[lastSixMonths.length - 1]?.average ?? 0;

  const config = METRIC_CONFIG[metric.metricName] || {
    color: "#FDFDFD",
    imageSrc: "/icons/blood4.svg",
    unit: "",
    statusLabel: "Normal",
  };
  const { profile } = useDecryptedProfile();
  
  // Update status label if no data
  const statusLabel = latest === 0 && metric.data.every(m => m.average === 0) 
    ? "No Data" 
    : config.statusLabel;

  return (
    <div className="flex flex-col lg:flex-row gap-5 mb-8 items-center lg:items-start">
      {/* Graph in a rounded card */}
      <div className="bg-white rounded-xl p-6 w-full lg:w-2/3">
        <h2 className="text-xl font-semibold mb-4">{metric.metricName}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={lastSixMonths}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis
              tickFormatter={(val) => {
                // Append the metric's unit if available
                return config.unit ? `${val}${config.unit}` : val;
              }}
            />
            <Tooltip
              content={<CustomTooltip unit={config.unit} />}
              cursor={{ fill: "none" }} // remove grey highlight
            />
            <Bar
              dataKey="average"
              shape={(props: any) => <BottomStrokeBar {...props} />}
            >
              {lastSixMonths.map((entry: MonthData, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={hoverIndex === index ? BAR_FILL_HOVER : BAR_FILL_NORMAL}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(-1)}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Card */}
      <div className="w-full lg:w-1/3 pl-0 lg:pl-6 mt-6 lg:mt-0">
        <HealthInsightsCard
          title={metric.metricName}
          reading={latest}
          unit={config.unit}
          statusLabel={statusLabel}
          color={config.color}
          imageSrc={config.imageSrc}
          data={lastSixMonths.map((d) => ({ value: d.average }))}
          userId={Number(profile?.id)}
        />
      </div>
    </div>
  );
}

/** Custom bar shape: only stroke the bottom line. */
function BottomStrokeBar(props: any) {
  const { x, y, width, height, fill } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} />
      <line
        x1={x}
        y1={y + height}
        x2={x + width}
        y2={y + height}
        stroke={AXIS_LINE_COLOR}
        strokeWidth={1}
      />
    </g>
  );
}

/** Custom Tooltip with orange BG and white text */
function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: TooltipProps<any, any> & { unit?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#F2994A] text-white p-2 rounded">
      <p className="font-medium">{label}</p>
      <p className="font-semibold">
        {payload[0].value}
        {unit}
      </p>
    </div>
  );
}