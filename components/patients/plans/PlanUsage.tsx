"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { differenceInMonths } from "date-fns";

// shadcn UI components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Example types (adjust as per your schema)
interface PlanTracker {
  id: number;
  userId: number;
  planId: number;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  isActive: boolean;
  usedDoctorConsultation: number;
  usedLabTests: number;
  usedDieticianConsultation: number;
  usedOphthalmologistConsultation: number;
  usedMedicines: number;
  // ...
}

interface PlanFeature {
  id: number;
  featureName: string;
  occurrencesPerInterval: number;
  intervalInMonths: number;
  parameters?: number;
}

// Circular progress ring
function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
}: {
  percentage: number; // 0-100
  size?: number;
  strokeWidth?: number;
}) {
  // E.g. radius is half the size minus half stroke
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          className="text-gray-300"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          // Replaced "text-green-500" with "text-secondary"
          className="text-secondary"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

export default function PlanUsage({ userId }: { userId: number }) {
  // 1) Fetch usage data
  const { data, isLoading, isError } = useQuery({
    queryKey: ["plan-usage", userId],
    queryFn: async () => {
      const res = await axios.get(`/api/plans/planUsage?userId=${userId}`);
      return res.data; // shape: { success, data: { planTracker, planFeatures } }
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="p-4">Loading plan usage...</div>;
  }
  if (isError || !data?.success) {
    return <div className="p-4">Error loading plan usage.</div>;
  }

  const { planTracker, planFeatures } = data.data as {
    planTracker: PlanTracker;
    planFeatures: PlanFeature[];
  };

  // 2) Basic plan info
  const startDate = new Date(planTracker.startDate);
  const endDate = new Date(planTracker.endDate);
  const now = new Date();
  const planLengthMonths = differenceInMonths(endDate, startDate);

  // 3) For each feature, figure out how many used in *this* interval vs. total
  //    (Naive approach: usage counters are total used so far. For interval-based usage,
  //     you'd normally store usage per interval in the DB. We'll do a simplified approach.)
  function getUsedCount(featureName: string): number {
    switch (featureName.toLowerCase()) {
      case "doctor consultation":
        return planTracker.usedDoctorConsultation;
      case "lab tests":
        return planTracker.usedLabTests;
      case "dietician consultation":
        return planTracker.usedDieticianConsultation;
      case "ophthalmologist consultation":
        return planTracker.usedOphthalmologistConsultation;
      case "medicines":
        return planTracker.usedMedicines;
      default:
        return 0;
    }
  }

  // 4) Render each feature in a 2-column grid, center the container
  return (
    <div className="w-full px-20 mx-auto space-y-4 py-4">
      <Card className="text-center bg-muted">
        <CardHeader>
          <CardTitle>
              <div className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-4xl font-semibold bg-clip-text text-transparent">
              {`Your are subscribed to ${planTracker.plan.name} plan`}
          </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <div>
            <strong>Plan valid:</strong> {startDate.toLocaleDateString()} -{" "}
            {endDate.toLocaleDateString()}
          </div>
          {/* <div className="mt-1">
            <strong>Status:</strong>{" "}
            {planTracker.isActive && now < endDate ? "Active" : "Expired"}
          </div> */}
        </CardContent>
      </Card>

      {/* Two-column layout for the features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {planFeatures.map((feat) => {
          const usedCount = getUsedCount(feat.featureName);
          const totalIntervals = Math.floor(planLengthMonths / feat.intervalInMonths);
          const totalAllowed = totalIntervals * feat.occurrencesPerInterval;
          const usedPercentage = totalAllowed > 0 ? (usedCount / totalAllowed) * 100 : 0;
          const clampedPct = Math.min(100, Math.max(0, usedPercentage));

          return (
            <Card key={feat.id}>
              <CardHeader>
                <CardTitle className="text-primary" >{feat.featureName} Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {/* Circular Progress */}
                  <CircularProgress percentage={clampedPct} />

                  <div className="flex-1">
                    <div className="text-sm text-gray-600">
                      Allowed:{" "}
                      <strong>
                        {feat.occurrencesPerInterval} every {feat.intervalInMonths} month
                        {feat.intervalInMonths > 1 ? "s" : ""}
                      </strong>
                      , over {totalIntervals} interval
                      {totalIntervals > 1 ? "s" : ""} ={" "}
                      <strong>{totalAllowed}</strong> total
                    </div>
                    <Separator className="my-2" />
                    <div className="text-sm text-gray-600">
                      Used so far: <strong>{usedCount}</strong> / {totalAllowed}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}