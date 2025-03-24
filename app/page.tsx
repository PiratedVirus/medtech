'use client'
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import React from "react";
import Image from "next/image";
import AdditionalServices from "@/components/common/landing-page/AdditionalServices";
import DoctorsAndConsultationsGrid from "@/components/common/landing-page/DoctorAndConsultion";
import ServicesSection from "@/components/common/landing-page/ServicesSection";
import HeroSection from "@/components/common/landing-page/HeroSection";
import BestDoctorsSection from "@/components/common/landing-page/BestDoctorsSection";

export default function LandingPageTailwind() {
  return (
    <>
    <HeroSection />
    <AdditionalServices />
    <ServicesSection />
    <DoctorsAndConsultationsGrid />
    <BestDoctorsSection />
    </>

  );
}