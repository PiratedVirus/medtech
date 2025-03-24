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

export default function DetailedHealthInsights() {
  const { profile } = useDecryptedProfile();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
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
  if (isError || !data) {
    return <div className="p-8">Failed to load insights.</div>;
  }
  if (!data.success || data.metrics.length === 0) {
    return <div className="p-8">No Insights Available</div>;
  }

  const metrics: MetricData[] = data.metrics;

  return (
    <div className="bg-muted min-h-screen px-20 py-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
    imageSrc: "/icons/blood.svg",
    unit: "",
    statusLabel: "Normal",
  };

  return (
    <div className="flex gap-5 mb-8">
      {/* Graph in a rounded card */}
      <div className="bg-white rounded-xl p-6 w-2/3">
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
      <div className="w-1/3 pl-6">
        <HealthInsightsCard
          title={metric.metricName}
          reading={latest}
          unit={config.unit}
          statusLabel={config.statusLabel}
          color={config.color}
          imageSrc={config.imageSrc}
          data={lastSixMonths.map((d) => ({ value: d.average }))}
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