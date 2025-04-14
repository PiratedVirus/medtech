"use client";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/context/ProfileContext";
import HomeAppointmentOverview  from "@/patients/home/HomeAppointmentOverview";
import { PlanUsageMinimal } from "@/components/patients/plans/PlanUsage";
import { useDecryptedProfile } from "@/hooks/use-profile";
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import { useDispatch } from "react-redux";
import { setSubscriptionData } from "@/store/subscriptionSlice";
import axios from "axios";
import { useEffect } from "react";
import HeartRiskCardRed from "./RedHeartRisk";
import ViewHealthInsightsCard from "./ViewHealthInsightCard";


export default function HomeOverview() {
  //@ts-ignore
  const { profile }: { profile: { id: string; name: string; subscriptionDetails?: { subscriptionId: string } } } = useProfile();
  const dispatch = useDispatch();

  const fetchSubscriptionTracker = async (userId: string) => {
    try {
      const response = await axios.get(`/api/plans/planTracker?userId=${userId}`);
      dispatch(setSubscriptionData(response.data.data));
      return response.data;
    } catch (error) {
      console.error("Error fetching plan tracker:", error);
      return null;
    }
  };
  useEffect(() => {
    console.log("Profile", profile);
    if (profile?.id) {
      fetchSubscriptionTracker(profile.id).then((data) => {
        console.log("Plan Tracker Data", data);
      });
    }
  }, [profile]);

  const currentHour = new Date().getHours();
  let greeting = "";
  if (currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour < 17) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }

  return (
    <div className="bg-muted px-20 pt-5">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl">
          {greeting} <span className="text-secondary">{profile?.name}!</span>
        </h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section - Video Carousel */}
        <div className="lg:col-span-3">
          <div className="relative w- h-[423px] bg-cover bg-center rounded-lg overflow-hidden">
            <img
              src="/images/overview-col.png"
              alt="Doctor consultation"
              className="w-80 h-[423px] object-cover rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted opacity-80" />
              <div className="w-2 h-2 rounded-full bg-white" />
              <div className="w-1.5 h-1.5 rounded-full bg-muted opacity-80" />
            </div>
          </div>
        </div>

        {/* Middle Section - Program Details */}
        <div className="lg:col-span-5 flex flex-col h-[423px]">
          <div className="space-y-4 mb-6">

            {profile?.subscriptionDetails?.subscriptionId ? (
              <>
                <h2 className="text-2xl font-semibold">
                  Care Diabetics{" "}
                  <span className="bg-gradient-to-r from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent">
                    CARE+
                  </span>
                  {" "} Usage
                </h2>
                <PlanUsageMinimal userId={4} subscriptionId={profile?.subscriptionDetails?.subscriptionId} />
              </>
            ) : (
              <>
                {/* <div className="flex-1 flex justify-center"> */}
                <ArrowButton buttonText="Explore our plans" href="/dashboard/plans" />
                {/* </div> */}

              </>
            )}
          </div>
          <ViewHealthInsightsCard />

        </div>

        {/* Right Section - Appointment & Apps */}
        <div className="lg:col-span-4 flex flex-col items-end h-[423px] gap-6">
          <HomeAppointmentOverview />


          <HeartRiskCardRed />
        </div>
      </div>
    </div>
  );
}
