"use client";
import { BicepsFlexed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "@/hooks/context/ProfileContext";
import HomeAppointmentOverview from "@/patients/home/HomeAppointmentOverview";
import { PlanUsageMinimal } from "@/components/patients/plans/PlanUsage";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import { useDispatch } from "react-redux";
import { setSubscriptionData } from "@/store/subscriptionSlice";
import axios from "axios";
import { useState, useEffect } from "react";
import HeartRiskCardRed from "./RedHeartRisk";
import Link from "next/link"
import { DietPlanCarousel } from "@/components/patients/home/DietDetails";
import { useToast } from "@/hooks/use-toast";
import { LineChart, DollarSign } from "lucide-react"
import HomePageCardSmall from "@/components/ui/custom/cd-homepage-card-small"
import MedicalCarousel from "@/components/patients/home/MedicalCarousel";
import SubscribeCarePlanCard from "./SubscribePlanCard";
import DietPlanModal from "@/components/patients/home/DietPlanModal";



export default function HomeOverview() {
  //@ts-ignore
  const { profile }: { profile: { id: string; name: string; subscriptionDetails?: { subscriptionId: string } } } = useProfile();
  const [dieticianLink, setDieticianLink] = useState<string>("");
  const [dietPlan, setDietPlan] = useState<any>(null);
  const { toast } = useToast();
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const { clinicId } = useDecryptedProfile();
  const dispatch = useDispatch();

  const fetchSubscriptionTracker = async (subscriptionId: number) => {
    try {
      const response = await axios.get(`/api/plans/planUsage?subscriptionId=${subscriptionId}`);
      if (response.data.success) {
        dispatch(setSubscriptionData(response.data.data.subscriptionTracker));
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching plan usage:", error);
      return null;
    }
  };
  useEffect(() => {
    if (profile?.subscriptionDetails?.subscriptionId) {
      // Use planUsage API with subscriptionId for complete data
      fetchSubscriptionTracker(Number(profile.subscriptionDetails.subscriptionId)).then((data) => {
        console.log("Plan Usage Data", data);
      });
      // Fetch the latest dietician link
      const fetchDieticianLink = async () => {
        try {
          const dietPlanLinkResponse = await axios.get(`/api/dieticians/diet?id=${profile.id}`);
          setDieticianLink(dietPlanLinkResponse.data.dietLink);
          setDietPlan(dietPlanLinkResponse.data.dietPlan || null);
        } catch (error) {
          console.error("Error fetching dietician link:", error);
        }
      };

      fetchDieticianLink();

    }
  }, [profile]);

  // Dieticians fetching moved to DietPlanModal

  // Modal state and data is now encapsulated in DietPlanModal component

  // Diet modal logic moved to DietPlanModal

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
    <div className="bg-muted lg:px-20 px-5 pt-5">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl">
          {greeting} <span className="text-secondary">{profile?.name?.trim().split(/\s+/)[0] ?? ""}!</span>
        </h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section - Video Carousel */}
        <div className="lg:col-span-3 w-full">
          <MedicalCarousel />
        </div>

        {/* Middle Section - Program Details */}
        <div className="lg:col-span-5 flex flex-col h-[423px] w-full">
          <div className="space-y-4 mb-6">
            {profile?.subscriptionDetails?.subscriptionId ? (
              <PlanUsageMinimal userId={4} subscriptionId={profile?.subscriptionDetails?.subscriptionId} />
            ) : (
              <SubscribeCarePlanCard />
            )}
          </div>
          <div className="flex gap-3 w-full">
            <Link href="/health-insights" className="block w-full">
              <HomePageCardSmall
                href="/dashboard/insights"
                headerLabel="Health Analytics"
                cardTitle="View Insights"
                cardDescription="Personalized analysis of your health metrics"
                ctaText="Explore insights"
                PrimaryIcon={LineChart}
                OutlineIcon={LineChart}
              />
            </Link>
            <div className="block w-full" onClick={() => setIsDietModalOpen(true)} role="button">
              <HomePageCardSmall
                href="#"
                headerLabel="Diet details"
                cardTitle="View Diet"
                cardDescription="Personalized diet plans and meal suggestions"
                ctaText="Explore diet"
                PrimaryIcon={BicepsFlexed}
                OutlineIcon={BicepsFlexed}
              />
            </div>
          </div>
          {/* Diet Plan Modal */}
          <DietPlanModal open={isDietModalOpen} onOpenChange={setIsDietModalOpen} patientId={profile?.id} clinicId={clinicId} dietPlan={dietPlan} />
        </div>

        {/* Right Section - Appointment & Apps */}
        <div className="lg:col-span-4 flex flex-col items-end h-[423px] gap-6 w-full">
          <HomeAppointmentOverview />
          <HeartRiskCardRed />
        </div>
      </div>

    </div>
  );
}
