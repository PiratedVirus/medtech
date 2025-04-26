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
import { MeetTeamSection } from "@/components/common/landing-page/MeetTeam";
import PatientTestimonials from "@/components/common/landing-page/PatientTestimonial";
import FooterVideo from "@/components/patients/home/FooterVideo";
import ArticlesSection from "@/components/patients/home/ArticleSection";
import TripleCard from "@/components/common/landing-page/TripleCard";
import Footer from "@/components/common/Footer";
import HowWorks from "@/components/common/landing-page/HowCardDBWorks";

export default function LandingPageTailwind() {
  return (
    <>
      <InfoBar />
      <Header />
      <div id="home">
        <HeroSection />
      </div>
      <AdditionalServices />
      <HowWorks />
      <div id="services">
        <ServicesSection />
      </div>
      <DoctorsAndConsultationsGrid />
      {/* <div id="doctors">
        <BestDoctorsSection />
        <MeetTeamSection />
      </div> */}
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