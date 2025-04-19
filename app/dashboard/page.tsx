'use client'
import FooterVideo from "@/components/patients/home/FooterVideo";
import ServiceCard from "@/components/patients/home/ServiceCard";
import MediumBlogCarousel from "@/patients/home/ArticleSection";
import HealthInsightsPanel from "@/patients/home/HealthInsightsPanel";
import HomeOverview from "@/patients/home/HomeOverview";

export default function Home() {


    return (
        <div className="mb-95">
            <HomeOverview />
            <ServiceCard />
            <HealthInsightsPanel />
            <MediumBlogCarousel />
            <FooterVideo />
        </div>
    )
}
