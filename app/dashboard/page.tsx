'use client'
import { DietPlanCarousel, DietPlan } from "@/components/patients/home/DietDetails";
import FooterVideo from "@/components/patients/home/FooterVideo";
import ServiceCard from "@/components/patients/home/ServiceCard";
import AppointmentInfo from "@/patients/home/AppointmentInfo";
import MediumBlogCarousel from "@/patients/home/ArticleSection";
import HealthInsightsPanel from "@/patients/home/HealthInsightsPanel";
import HomeOverview from "@/patients/home/HomeOverview";
import MakeScheduleInfo from "@/patients/home/MakeScheduleInfo";

export default function Home() {
    // Placeholder diet plans array and request handler
    // Inside Home()

    const handleRequestNew = () => {
      // TODO: implement actual request logic
      console.log("Request new diet plan");
    };

    return (
        <div className="mb-95">
            <HomeOverview />
            <ServiceCard />
            <HealthInsightsPanel />
            {/* <DietPlanCarousel
              dietPlans={dietPlans}
              onRequestNew={handleRequestNew}
            /> */}
            {/* <MakeScheduleInfo /> */}
            {/* <AppointmentInfo /> */}
            <MediumBlogCarousel />
            <FooterVideo />
        </div>
    )
}
