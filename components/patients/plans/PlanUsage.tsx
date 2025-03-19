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

interface SubscriptionTracker {
  id: number;
  userId: number;
  planId: number;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  isActive: boolean;
  doctorConsultationDates: string[];
  dieticianConsultationDates: string[];
  labTestsDates: string[];
  ophthalmologistConsultationDates: string[];
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

/* ---------------------  1) Shared Hook: usePlanUsageQuery  --------------------- */

function usePlanUsageQuery(userId: number, subscriptionId: number) {
  return useQuery({
    queryKey: ["plan-usage", userId, subscriptionId],
    queryFn: async () => {
      const res = await axios.get(`/api/plans/planUsage?subscriptionId=${subscriptionId}`);
      return res.data; // shape: { success, data: { subscriptionTracker, planFeatures } }
    },
    enabled: !!userId && !!subscriptionId, // only run if we have user & subscription
  });
}

/* ---------------------  2) Shared Helper: computeFeatureUsage  --------------------- */
/** 
 * For a given feature, returns { totalAllowed, usedCount, remaining, percentage }
 */
function computeFeatureUsage(
  feature: PlanFeature,
  subscriptionTracker: SubscriptionTracker
) {
  // 1) Calculate how many intervals the plan spans
  const startDate = new Date(subscriptionTracker.startDate);
  const endDate = new Date(subscriptionTracker.endDate);
  const planLengthMonths = differenceInMonths(endDate, startDate);

  // 2) totalAllowed = total intervals * occurrences per interval
  const totalIntervals = feature.intervalInMonths
    ? Math.floor(planLengthMonths / feature.intervalInMonths)
    : 0;
  const totalAllowed = totalIntervals * (feature.occurrencesPerInterval || 0);

  // 3) Figure out how many remain (the length of the array),
  //    since you said your arrays hold *future* or *unused* items.
  let remainingCount = 0;
  switch (feature.featureName.toLowerCase()) {
    case "doctor consultation":
      remainingCount = subscriptionTracker.doctorConsultationDates.length;
      break;
    case "lab tests":
      remainingCount = subscriptionTracker.labTestsDates.length;
      break;
    case "dietician consultation":
      remainingCount = subscriptionTracker.dieticianConsultationDates.length;
      break;
    case "ophthalmologist consultation":
      remainingCount = subscriptionTracker.ophthalmologistConsultationDates.length;
      break;
    case "medicines":
      remainingCount = subscriptionTracker.usedMedicines; 
      // If "usedMedicines" is actually storing future medicine usage, 
      // rename it or invert logic accordingly.
      break;
    default:
      remainingCount = 0;
  }

  // 4) usedCount = totalAllowed - remainingCount
  let usedCount = totalAllowed - remainingCount;
  // clamp to avoid negative
  if (usedCount < 0) usedCount = 0;

  // 5) usedPercentage = (usedCount / totalAllowed) * 100
  const usedPercentage = totalAllowed > 0 ? (usedCount / totalAllowed) * 100 : 0;
  const clampedPct = Math.min(100, Math.max(0, usedPercentage));

  return {
    totalAllowed,
    usedCount,
    remaining: remainingCount,
    clampedPct,
    totalIntervals,
  };
}

/* ---------------------  3) CircularProgress  --------------------- */

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
      <svg className="transform -rotate-90" width={size} height={size}>
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
   4) PlanUsage: Full usage view (two-column layout)
------------------------------------------------------------------ */
export default function PlanUsage({
  userId,
  subscriptionId,
}: {
  userId: number;
  subscriptionId: number;
}) {
  // 1) Fetch usage data
  const { data, isLoading, isError } = usePlanUsageQuery(userId, subscriptionId);

  if (isLoading) {
    return <CdLoader />;
  }
  if (isError || !data?.success) {
    return <div className="p-4">Error loading plan usage.</div>;
  }

  const { subscriptionTracker, planFeatures } = data.data as {
    subscriptionTracker: SubscriptionTracker;
    planFeatures: PlanFeature[];
  };

  // 2) Render the full layout
  return (
    <PlanUsageFullLayout subscriptionTracker={subscriptionTracker} planFeatures={planFeatures} />
  );
}

/** The "Full" usage layout */
function PlanUsageFullLayout({
  subscriptionTracker,
  planFeatures,
}: {
  subscriptionTracker: SubscriptionTracker;
  planFeatures: PlanFeature[];
}) {
  const startDate = new Date(subscriptionTracker.startDate);
  const endDate = new Date(subscriptionTracker.endDate);

  return (
    <div className="w-full px-20 mx-auto space-y-4 py-4">
      <Card className="text-center bg-muted">
        <CardHeader>
          <CardTitle>
            <div className="bg-gradient-to-r from-[#134F30] to-[#56A67C] text-4xl font-semibold bg-clip-text text-transparent">
              You are subscribed to {subscriptionTracker.plan?.name ?? "a"} plan
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <div>
            Plan valid:{" "}
            <strong>
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
            </strong>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {planFeatures.map((feat) => {
          const { totalAllowed, usedCount, remaining, clampedPct, totalIntervals } =
            computeFeatureUsage(feat, subscriptionTracker);

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
                      {totalIntervals > 1 ? "s" : ""} = <strong>{totalAllowed}</strong> total
                    </div>
                    <Separator className="my-2" />
                    <div className="text-sm text-gray-600">
                      Used so far:{" "}
                      <strong>
                        {usedCount} / {totalAllowed}
                      </strong>{" "}
                      <span className="text-gray-500 italic">
                        ({remaining} remaining)
                      </span>
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
   5) PlanUsageMinimal: a minimal usage view (just circles + feature name)
------------------------------------------------------------------ */
export function PlanUsageMinimal({
  userId,
  subscriptionId,
}: {
  userId: number;
  subscriptionId: any;
}) {
  // 1) Fetch usage data
  const { data, isLoading, isError } = usePlanUsageQuery(userId, subscriptionId);

  if (isLoading) {
    return <div className="p-4">Loading plan usage...</div>;
  }
  if (isError || !data?.success) {
    return <div className="p-4">Error loading plan usage.</div>;
  }

  const { subscriptionTracker, planFeatures } = data.data as {
    subscriptionTracker: SubscriptionTracker;
    planFeatures: PlanFeature[];
  };

  // 2) Render the minimal layout
  return (
    <PlanUsageMinimalLayout
      subscriptionTracker={subscriptionTracker}
      planFeatures={planFeatures}
    />
  );
}

/** The "Minimal" usage layout (two rows, circles, etc.) */
function PlanUsageMinimalLayout({
  subscriptionTracker,
  planFeatures,
}: {
  subscriptionTracker: SubscriptionTracker;
  planFeatures: PlanFeature[];
}) {
  const startDate = new Date(subscriptionTracker.startDate);
  const endDate = new Date(subscriptionTracker.endDate);
  const planLengthMonths = differenceInMonths(endDate, startDate);

  // Row 1: first 4 features
  const row1Features = planFeatures.slice(0, 4);
  // Row 2: the rest
  const row2Features = planFeatures.slice(4);

  return (
    <div className="w-full mx-auto py-4 space-y-6">
      {/* Row 1: up to 4 circles */}
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {row1Features.map((feat) => {
          const { totalAllowed, usedCount, remaining, clampedPct } =
            computeFeatureUsage(feat, subscriptionTracker);

          return (
            <div key={feat.id} className="flex flex-col items-center">
              <CircularProgress percentage={clampedPct} size={80} />
              {/* Show numeric consumption below */}
              <div className="text-xs mt-2 text-gray-500 font-bold">
                {usedCount}/{totalAllowed} used
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
          const { totalAllowed, usedCount, clampedPct } =
            computeFeatureUsage(feat, subscriptionTracker);

          return (
            <div key={feat.id} className="flex-none flex flex-col items-center">
              <CircularProgress percentage={clampedPct} size={80} />
              {/* numeric consumption */}
              <div className="text-xs mt-2 text-gray-500">
                {usedCount}/{totalAllowed}
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