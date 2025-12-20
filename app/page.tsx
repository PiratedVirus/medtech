'use client'
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import React from "react";
import Image from "next/image";
import Header from "@/components/common/Header";
import InfoBar from '@/components/common/landing-page/InfoBar';
import AdditionalServices from "@/components/common/landing-page/AdditionalServices";
import DoctorsAndConsultationsGrid from "@/components/common/landing-page/DoctorAndConsultion";
import ServicesSection from "@/components/common/landing-page/ServicesSection";
import HeroSection from "@/components/common/landing-page/HeroSection";
import BestDoctorsSection from "@/components/common/landing-page/BestDoctorsSection";
import {MeetTeamSection}  from "@/components/common/landing-page/MeetTeam";
import PatientTestimonials from "@/components/common/landing-page/PatientTestimonial";
import FooterVideo from "@/components/patients/home/FooterVideo";
import ArticlesSection from "@/components/patients/home/ArticleSection";
import TripleCard from "@/components/common/landing-page/TripleCard";
import Footer from "@/components/common/Footer";
import HowWorks from "@/components/common/landing-page/HowCardDBWorks";
import CareDiabeticsWorkflow from "@/components/common/landing-page/HowCdWorks";
import { useClinicContext } from "@/hooks/use-clinic-context";
import CdLoader from "@/components/ui/custom/cd-loader";

export default function LandingPageTailwind() {
  // Validate clinic context for subdomain-based access
  const { isLoading, isError, subdomain } = useClinicContext({ redirectOnNotFound: true });

  // Show loading while checking clinic
  if (isLoading) {
    return <CdLoader />;
  }

  // If clinic validation failed and we're on a subdomain, show loading (redirect is happening)
  if (isError && subdomain) {
    return <CdLoader />;
  }
  return (
    <>
      {/* <InfoBar /> */}
      <Header />
      <div id="home">
        <HeroSection />
      </div>
      <AdditionalServices />
      <CareDiabeticsWorkflow /> 
      <div id="services">
        <ServicesSection />
      </div>
      {/* <DoctorsAndConsultationsGrid /> */}
      <div id="doctors">
        {/* <BestDoctorsSection /> */}

        <div className="flex justify-center items-center bg-custom-mutedgreen py-10 px-4 md:px-20">
          <div className="w-full md:w-2/3">
            <Image
              src="/images/interlinked.png"
              alt="Doctor"
              width={1200}
              height={900}
              layout="responsive"
              objectFit="contain"
              priority
            />
          </div>
        </div>

        <MeetTeamSection />

        

        <div className="flex justify-center items-center bg-custom-mutedbg py-10 px-4 md:px-20">
          <div className="w-full md:w-2/3">
            <Image
              src="/images/early-detection.png"
              alt="Doctor"
              width={1200}
              height={800}
              layout="responsive"
              objectFit="contain"
              priority
            />
          </div>
        </div>
      </div>
      <FooterVideo />
      {/* <div id="testimonials">
        <PatientTestimonials />
      </div> */}
      <div id="blogs">
        <ArticlesSection />
      </div>
      {/* <TripleCard /> */}
      <Footer />
    </>

  );
}