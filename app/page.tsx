'use client'
import ArrowButton from "@/components/ui/custom/cd-arrow-button";
import React from "react";
import Image from "next/image";
import AdditionalServices from "@/components/common/landing-page/AdditionalServices";
import DoctorsAndConsultationsGrid from "@/components/common/landing-page/DoctorAndConsultion";
import ServicesSection from "@/components/common/landing-page/ServicesSection";
import HeroSection from "@/components/common/landing-page/HeroSection";
import BestDoctorsSection from "@/components/common/landing-page/BestDoctorsSection";
import { MeetTeamSection } from "@/components/common/landing-page/MeetTeam";
import PatientTestimonials from "@/components/common/landing-page/PatientTestimonial";
import FooterVideo from "@/components/patients/home/FooterVideo";
import ArticlesSection from "@/components/patients/home/ArticleSection";
import TripleCard from "@/components/common/landing-page/TripleCard";
import Footer from "@/components/common/Footer";

export default function LandingPageTailwind() {
  return (
    <>
    <HeroSection />
    <AdditionalServices />
    <ServicesSection />
    <DoctorsAndConsultationsGrid />
    <BestDoctorsSection />
    <MeetTeamSection /> 
    <FooterVideo />
    <PatientTestimonials />
    <ArticlesSection />
    <TripleCard />
    <Footer />
    </>

  );
}