import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TableIcon } from "lucide-react";
import { useState } from "react";
import HealthInsightsTable from "./HealthInsightsTable";
import CdLoader from "@/components/ui/custom/cd-loader";
import { cn } from "@/lib/utils";

interface HealthInsightsPanelProps {
  patientId: string;
}

interface MetricData {
  current: number;
  unit: string;
  status: "normal" | "warning" | "critical";
  trend: number[];
}

const METRIC_CONFIG = {
  "Blood Pressure": {
    color: "bg-blue-100 text-blue-800",
    unit: "mmHg",
    statusLabel: (value: number) => {
      if (value <= 120) return "Normal";
      if (value <= 140) return "Elevated";
      return "High";
    },
  },
  "Blood Glucose": {
    color: "bg-purple-100 text-purple-800",
    unit: "mg/dL",
    statusLabel: (value: number) => {
      if (value < 100) return "Normal";
      if (value < 126) return "Prediabetes";
      return "Diabetes";
    },
  },
  "Body Fat": {
    color: "bg-orange-100 text-orange-800",
    unit: "%",
    statusLabel: (value: number) => {
      if (value < 25) return "Normal";
      if (value < 30) return "Overweight";
      return "Obese";
    },
  },
  "Muscle Mass": {
    color: "bg-green-100 text-green-800",
    unit: "%",
    statusLabel: (value: number) => {
      if (value >= 40) return "Excellent";
      if (value >= 30) return "Good";
      return "Low";
    },
  },
  "BMI": {
    color: "bg-yellow-100 text-yellow-800",
    unit: "kg/m²",
    statusLabel: (value: number) => {
      if (value < 18.5) return "Underweight";
      if (value < 25) return "Normal";
      if (value < 30) return "Overweight";
      return "Obese";
    },
  },
  "Visceral Fat": {
    color: "bg-red-100 text-red-800",
    unit: "level",
    statusLabel: (value: number) => {
      if (value < 5) return "Normal";
      if (value < 10) return "High";
      return "Very High";
    },
  },
};

export function HealthInsightsPanel({ patientId }: HealthInsightsPanelProps) {
  const [showTable, setShowTable] = useState(false);

  const { data: insightsData, isLoading } = useQuery({
    queryKey: ["health-insights", patientId],
    queryFn: async () => {
      const response = await fetch(`/api/insights?userId=${parseInt(patientId)}`);
      if (!response.ok) throw new Error("Failed to fetch insights");
      const data = await response.json();
      // data.metrics is expected to be an array of { metricName, data: [...] }
      return data as { metrics: Array<{ metricName: string; data: { month: string; average: number }[] }> };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <CdLoader />
      </div>
    );
  }

  // Transform the metrics array into a map keyed by metricName with current, currentDate and chips
  const metricsMap = Object.keys(METRIC_CONFIG).reduce((acc, metricName) => {
    const metricEntry = insightsData?.metrics?.find(m => m.metricName === metricName);
    const config = METRIC_CONFIG[metricName as keyof typeof METRIC_CONFIG];
    if (metricEntry) {
      const sorted = [...metricEntry.data].sort((a, b) => (new Date(a.month + "-01") < new Date(b.month + "-01") ? 1 : -1));
      const currentObj = sorted[0];
      const current = currentObj.average;
      const currentDate = new Date(currentObj.month + "-01");
      const chips = sorted.slice(1).map(obj => ({ reading: obj.average, date: new Date(obj.month + "-01") }));
      acc[metricName] = { current, currentDate, chips, unit: config.unit, color: config.color };
    } else {
      acc[metricName] = { current: 0, currentDate: null, chips: [], unit: config.unit, color: config.color };
    }
    return acc;
  }, {} as Record<string, { current: number; currentDate: Date | null; chips: Array<{ reading: number; date: Date }>; unit: string; color: string }>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Health Insights</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTable(true)}
          className="flex items-center gap-2"
        >
          <TableIcon className="h-4 w-4" />
          View in Table
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(metricsMap).map(([metric, data], cardIndex) => {
        //   const cardBg = cardIndex % 2 === 0 ? "bg-custom-mutedgreen" : "bg-custom-muted";
          const cardBg = "bg-custom-mutedgreen";
          return (
            <div
              key={metric}
              className={cn(
                "rounded-lg border-none p-4 shadow-sm",
                cardBg
              )}
            >
              <div className="mb-2 text-sm font-semibold text-muted-foreground">
                {metric}
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {data.current}
                  <span className="ml-1 text-sm text-muted-foreground">
                    {data.unit}
                  </span>
                  {data.currentDate && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      as of {data.currentDate.toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                {data.chips.map((chip, chipIndex) => {
                  let chipBg = "";
                  chipBg = cardBg === "bg-custom-mutedgreen" ? "bg-slate-100" : "bg-custom-mutedgreen";

                  return (
                    <div
                      key={chipIndex}
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium",
                        chipBg
                      )}
                    >
                      {`${chip.date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" })} - ${chip.reading}`}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <HealthInsightsTable
        patientId={Number(patientId)}
        isOpen={showTable}
        onClose={() => setShowTable(false)}
      />
    </div>
  );
}