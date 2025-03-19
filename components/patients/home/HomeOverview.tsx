"use client";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/context/ProfileContext";
import { HomeAppointmentOverview } from "@/patients/home/HomeAppointmentOverview";
import { PlanUsageMinimal } from "@/components/patients/plans/PlanUsage";
import { useDecryptedProfile } from "@/hooks/use-profile";

export default function HomeOverview() {
  const { profile } = useProfile();

  return (
    <div className="bg-muted px-20 pt-5">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl">
          Good Morning <span className="text-secondary">{profile?.name}!</span>
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
            <h2 className="text-2xl font-semibold">
              Care Diabetics{" "}
              <span className="bg-gradient-to-r from-[#F4813F] via-[#FDB047] to-[#FDB047] bg-clip-text text-transparent">
                CARE+
              </span>
              {" "} Usage
            </h2>
            <PlanUsageMinimal userId={4} subscriptionId={profile?.subscriptionDetails?.subscriptionId} />
          </div>

          {/* <Button className="h-[51px] w-[267px] rounded-[59px]  text-white hover:bg-popover">
            <span className="mr-2">Buy Care Diabetics Care+</span>
            <ArrowRight className="h-5 w-5" />
          </Button> */}

          {/* <div className="flex gap-6 mt-auto">
            <Card className="flex-1 w-64 bg-[#E5F5F1]">
              <CardContent className="flex gap-4 p-4">
                <img
                  src="https://c.animaapp.com/Pl3sQKXr/img/image-19@2x.png"
                  alt="Program icon"
                  className="w-16 h-16 object-cover"
                />
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="font-medium">Care Diabetics Program</p>
                    <p className="text-sm">
                      Current Plan: <span className="text-primary">CARE</span>
                    </p>
                  </div>
                  <div className="text-sm">
                    <p>Expiry Date:</p>
                    <p>
                      20 Jan 2025{" "}
                      <span className="text-[#9747FF]">(45 days left)</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-36 bg-[#E5F5F1]">
              <CardContent className="h-full flex flex-col items-center justify-center p-4 text-center">
                <img
                  src="https://c.animaapp.com/Pl3sQKXr/img/image-4@2x.png"
                  alt="Other plans"
                  className="w-14 h-14 mb-2"
                />
                <p className="text-sm font-medium">Other plans</p>
              </CardContent>
            </Card>
          </div> */}
        </div>

        {/* Right Section - Appointment & Apps */}
        <div className="lg:col-span-4 flex flex-col items-end h-[423px] gap-6">
          <HomeAppointmentOverview />

          <Card className=" bg-custom-mutedgreen mt-auto h-52 w-full flex flex-col justify-end">
            <CardContent className="pt-2 pb-0 flex items-center justify-between">
              {/* Left - App Preview Image (Aligned at Bottom) */}
              <div className="relative w-52 flex items-end">
                <img
                  src="/images/iphone-large.png"
                  alt="App preview"
                  className="w-36 h-40 self-end"
                />
              </div>

              {/* Right - App Store Buttons */}
              <div className="space-y-4">
                <img
                  src="/images/playstore.png"
                  alt="Play Store"
                  className="h-[45px] w-auto cursor-pointer"
                />
                <img
                  src="/images/appstore.png"
                  alt="App Store"
                  className="h-[45px] w-auto cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
