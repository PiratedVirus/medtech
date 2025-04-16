"use client"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { differenceInMonths } from "date-fns"
import { ArrowRight, Loader2 } from "lucide-react"

// shadcn UI components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
// import CdLoader from "@/components/ui/custom/cd-loader"

/* ---------------------  Types & Interfaces --------------------- */

interface SubscriptionTracker {
  id: number
  userId: number
  planId: number
  startDate: string // ISO string
  endDate: string // ISO string
  isActive: boolean
  doctorConsultationDates: string[]
  dieticianConsultationDates: string[]
  labTestsDates: string[]
  ophthalmologistConsultationDates: string[]
  usedMedicines: number
  plan?: {
    name: string
  }
}

interface PlanFeature {
  id: number
  featureName: string
  occurrencesPerInterval: number
  intervalInMonths: number
  parameters?: number
}

/* ---------------------  1) Shared Hook: usePlanUsageQuery  --------------------- */

function usePlanUsageQuery(userId: number, subscriptionId: number) {
  return useQuery({
    queryKey: ["plan-usage", userId, subscriptionId],
    queryFn: async () => {
      const res = await axios.get(`/api/plans/planUsage?subscriptionId=${subscriptionId}`)
      return res.data // shape: { success, data: { subscriptionTracker, planFeatures } }
    },
    enabled: !!userId && !!subscriptionId, // only run if we have user & subscription
  })
}

/* ---------------------  2) Shared Helper: computeFeatureUsage  --------------------- */
/**
 * For a given feature, returns { totalAllowed, usedCount, remaining, percentage }
 */
function computeFeatureUsage(feature: PlanFeature, subscriptionTracker: SubscriptionTracker) {
  // 1) Calculate how many intervals the plan spans
  const startDate = new Date(subscriptionTracker.startDate)
  const endDate = new Date(subscriptionTracker.endDate)
  const planLengthMonths = differenceInMonths(endDate, startDate)

  // 2) totalAllowed = total intervals * occurrences per interval
  const totalIntervals = feature.intervalInMonths ? Math.floor(planLengthMonths / feature.intervalInMonths) : 0
  const totalAllowed = totalIntervals * (feature.occurrencesPerInterval || 0)

  // 3) Figure out how many remain (the length of the array),
  //    since you said your arrays hold *future* or *unused* items.
  let remainingCount = 0
  switch (feature.featureName.toLowerCase()) {
    case "doctor consultation":
      remainingCount = subscriptionTracker.doctorConsultationDates.length
      break
    case "lab tests":
      remainingCount = subscriptionTracker.labTestsDates.length
      break
    case "dietician consultation":
      remainingCount = subscriptionTracker.dieticianConsultationDates.length
      break
    case "ophthalmologist consultation":
      remainingCount = subscriptionTracker.ophthalmologistConsultationDates.length
      break
    case "medicines":
      remainingCount = subscriptionTracker.usedMedicines
      // If "usedMedicines" is actually storing future medicine usage,
      // rename it or invert logic accordingly.
      break
    default:
      remainingCount = 0
  }

  // 4) usedCount = totalAllowed - remainingCount
  let usedCount = totalAllowed - remainingCount
  // clamp to avoid negative
  if (usedCount < 0) usedCount = 0

  // 5) usedPercentage = (usedCount / totalAllowed) * 100
  const usedPercentage = totalAllowed > 0 ? (usedCount / totalAllowed) * 100 : 0
  const clampedPct = Math.min(100, Math.max(0, usedPercentage))

  return {
    totalAllowed,
    usedCount,
    remaining: remainingCount,
    clampedPct,
    totalIntervals,
  }
}

/* ---------------------  3) CircularProgress  --------------------- */

function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 8,
}: {
  percentage: number // 0-100
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

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
          className="text-[#56A67C]"
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
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[#134F30]">
        {Math.round(percentage)}%
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------
   4) PlanUsage: Full usage view (two-column layout)
------------------------------------------------------------------ */
export default function PlanUsage({
  userId,
  subscriptionId,
}: {
  userId: number
  subscriptionId: number
}) {
  // 1) Fetch usage data
  const { data, isLoading, isError } = usePlanUsageQuery(userId, subscriptionId)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }
  if (isError || !data?.success) {
    return <div className="p-4">Error loading plan usage.</div>
  }

  const { subscriptionTracker, planFeatures } = data.data as {
    subscriptionTracker: SubscriptionTracker
    planFeatures: PlanFeature[]
  }

  // 2) Render the full layout
  return <PlanUsageFullLayout subscriptionTracker={subscriptionTracker} planFeatures={planFeatures} />
}

/** The "Full" usage layout */
function PlanUsageFullLayout({
  subscriptionTracker,
  planFeatures,
}: {
  subscriptionTracker: SubscriptionTracker
  planFeatures: PlanFeature[]
}) {
  const startDate = new Date(subscriptionTracker.startDate)
  const endDate = new Date(subscriptionTracker.endDate)

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
          const { totalAllowed, usedCount, remaining, clampedPct, totalIntervals } = computeFeatureUsage(
            feat,
            subscriptionTracker,
          )

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
                      <span className="text-gray-500 italic">({remaining} remaining)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
   5) PlanUsageMinimal: a minimal usage view (just circles + feature name)
------------------------------------------------------------------ */
export function PlanUsageMinimal({
  userId,
  subscriptionId,
}: {
  userId: number
  subscriptionId: any
}) {
  // 1) Fetch usage data
  const { data, isLoading, isError } = usePlanUsageQuery(userId, subscriptionId)

  if (isLoading) {
    return <PlanUsageMinimalSkeleton />
  }
  if (isError || !data?.success) {
    return <div className="p-4">Error loading plan usage.</div>
  }

  const { subscriptionTracker, planFeatures } = data.data as {
    subscriptionTracker: SubscriptionTracker
    planFeatures: PlanFeature[]
  }

  // 2) Render the minimal layout
  return <PlanUsageMinimalLayout subscriptionTracker={subscriptionTracker} planFeatures={planFeatures} />
}

/** The "Minimal" usage layout (single row with circular progress rings) */
function PlanUsageMinimalLayout({
  subscriptionTracker,
  planFeatures,
}: {
  subscriptionTracker: SubscriptionTracker
  planFeatures: PlanFeature[]
}) {
  const startDate = new Date(subscriptionTracker.startDate)
  const endDate = new Date(subscriptionTracker.endDate)
  const planLengthMonths = differenceInMonths(endDate, startDate)

  return (
    <Card className="group relative w-full h-[184px] overflow-hidden  bg-custom-mutedgreen shadow-none transition-all duration-300 ">
      {/* Large chart outline in background */}
      <div className="absolute -right-8 -top-4 h-40 w-40 opacity-5">
        <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-[#174b30]">
          <path
            d="M21 21H4.6c-.56 0-1.1-.22-1.48-.62C2.76 20 2.53 19.46 2.5 18.9V3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 7L15.5 12.5L11.5 8.5L3 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F28A2E]/10 to-[#56A67C]/10">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#134F30]">
              <path
                d="M21 21H4.6c-1.1 0-2-.9-2-2V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 9l4 4 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-primary">Plan Usage</span>
        </div>

        <div className="flex justify-center items-center gap-4 px-1 mt-2">
          {planFeatures.slice(0, 4).map((feat) => {
            const { totalAllowed, usedCount, clampedPct } = computeFeatureUsage(feat, subscriptionTracker)

            return (
              <div key={feat.id} className="flex flex-col items-center">
                <CircularProgress percentage={clampedPct} size={70} strokeWidth={6} />
                <div className="text-xs mt-1 text-gray-500 font-medium">
                  {usedCount}/{totalAllowed}
                </div>
                <div className="text-xs font-medium text-center text-gray-700">{feat.featureName.split(" ")[0]}</div>
              </div>
            )
          })}
        </div>


      </div>
    </Card>
  )
}
/** Skeleton loader for minimal usage layout */
export function PlanUsageMinimalSkeleton() {
  const Circle = () => (
    <div className="flex flex-col items-center">
      <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
      <div className="w-16 h-4 bg-muted rounded mt-2 animate-pulse" />
      <div className="w-24 h-4 bg-muted rounded mt-1 animate-pulse" />
    </div>
  )

  return (
    <div className="w-full mx-auto py-4 space-y-6">
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Circle key={idx} />
        ))}
      </div>
      <div className="flex items-center gap-6 px-6">
        <Circle />
        <div className="flex-1 flex justify-center">
          <div className="w-[160px] h-10 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}
