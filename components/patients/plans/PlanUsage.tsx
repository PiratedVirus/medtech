"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { differenceInMonths } from "date-fns";

// shadcn UI components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import CdLoader from "@/components/ui/custom/cd-loader";

/* ---------------------  Types & Interfaces --------------------- */

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
  plan?: {
    name: string;
  };
}

interface PlanFeature {
  id: number;
  featureName: string;
  occurrencesPerInterval: number;
  intervalInMonths: number;
  parameters?: number;
}

function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
}: {
  percentage: number; // 0-100
  size?: number;
  strokeWidth?: number;
}) {
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

/* ------------------------------------------------------------------
   1) DEFAULT EXPORT: Full usage view (two-column layout, details, etc.)
------------------------------------------------------------------ */
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
    return <CdLoader />;
  }
  if (isError || !data?.success) {
    return <div className="p-4">Error loading plan usage.</div>;
  }

  const { planTracker, planFeatures } = data.data as {
    planTracker: PlanTracker;
    planFeatures: PlanFeature[];
  };

  const startDate = new Date(planTracker.startDate);
  const endDate = new Date(planTracker.endDate);
  const now = new Date();
  const planLengthMonths = differenceInMonths(endDate, startDate);

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

  return (
    <div className="w-full px-20 mx-auto space-y-4 py-4">
      <Card className="text-center bg-muted">
        <CardHeader>
          <CardTitle>
            <div className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-4xl font-semibold bg-clip-text text-transparent">
              You are subscribed to {planTracker.plan?.name ?? "a"} plan
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <div>
            Plan valid:<strong> {startDate.toLocaleDateString()} -{" "}
            {endDate.toLocaleDateString()}</strong>
          </div>
        </CardContent>
      </Card>

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
                <CardTitle>{feat.featureName} Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
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

/* ------------------------------------------------------------------
   2) NAMED EXPORT: Minimal usage view (just circular bars + feature name)
------------------------------------------------------------------ */
export function PlanUsageMinimal({ userId }: { userId: number }) {
  // 1) Fetch usage data
  const { data, isLoading, isError } = useQuery({
    queryKey: ["plan-usage-minimal", userId],
    queryFn: async () => {
      const res = await axios.get(`/api/plans/planUsage?userId=${userId}`);
      return res.data;
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

  const startDate = new Date(planTracker.startDate);
  const endDate = new Date(planTracker.endDate);
  const planLengthMonths = differenceInMonths(endDate, startDate);

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

  // 2) Split features into two rows
  //    Row 1: first 4 features
  //    Row 2: the rest (assuming exactly 1 for a total of 5)
  const row1Features = planFeatures.slice(0, 4);
  const row2Features = planFeatures.slice(4);

  return (
    <div className="w-full mx-auto py-4 space-y-6">

      {/* Row 1: up to 4 circles */}
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {row1Features.map((feat) => {
          const usedCount = getUsedCount(feat.featureName);
          const totalIntervals = Math.floor(planLengthMonths / feat.intervalInMonths);
          const totalAllowed = totalIntervals * feat.occurrencesPerInterval;
          const usedPercentage = totalAllowed > 0 ? (usedCount / totalAllowed) * 100 : 0;
          const clampedPct = Math.min(100, Math.max(0, usedPercentage));

          return (
            <div key={feat.id} className="flex flex-col items-center">
              <CircularProgress percentage={clampedPct} size={80} />
              {/* Show numeric consumption below */}
              <div className="text-xs mt-2 text-gray-500 font-bold">
                {usedCount}/{totalAllowed}
              </div>
              <div className="text-sm font-medium mt-1 text-center">
                {feat.featureName}
              </div>

            </div>
          );
        })}
      </div>

      {/* Row 2: 1 circle at beginning, then ArrowButton in leftover space */}
      <div className="flex items-center gap-6 px-6">
        {/* If we have at least one feature in row2 */}
        {row2Features.length > 0 && (() => {
          const feat = row2Features[0];
          const usedCount = getUsedCount(feat.featureName);
          const totalIntervals = Math.floor(planLengthMonths / feat.intervalInMonths);
          const totalAllowed = totalIntervals * feat.occurrencesPerInterval;
          const usedPercentage = totalAllowed > 0 ? (usedCount / totalAllowed) * 100 : 0;
          const clampedPct = Math.min(100, Math.max(0, usedPercentage));

          return (
            <div key={feat.id} className="flex-none flex flex-col items-center">
              <CircularProgress percentage={clampedPct} size={80} />
              {/* numeric consumption */}

              <div className="text-xs mt-2 text-gray-500">
                {isNaN(totalAllowed)
                  ? "Not Applicable"
                  : `${usedCount}/${totalAllowed}`}
              </div>
              <div className="text-sm font-medium mt-1 text-center">
                {feat.featureName}
              </div>

            </div>
          );
        })()}

        {/* ArrowButton in the remaining space, centered */}
        <div className="flex-1 flex justify-center">
          <ArrowButton buttonText="View Plan Usage" href="/dashboard/plans" />
        </div>
      </div>
    </div>
  );
}