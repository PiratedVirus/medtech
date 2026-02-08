"use client";

import { ParallaxBackground } from '@/components/brahma-rx/ParallaxBackground';
import { Header } from '@/components/brahma-rx/Header';
import { HeroSection } from '@/components/brahma-rx/HeroSection';
import { ProblemsAndSolutions } from '@/components/brahma-rx/ProblemsAndSolutions';
import { FeaturesSection } from '@/components/brahma-rx/FeaturesSection';
import { HowItWorksSection } from '@/components/brahma-rx/HowItWorksSection';
import { OrbitingModules } from '@/components/brahma-rx/OrbitingModules';
import { ModulesSection } from '@/components/brahma-rx/ModulesSection';
import { AboutSection } from '@/components/brahma-rx/AboutSection';
import { ContactSection } from '@/components/brahma-rx/ContactSection';
import { Footer } from '@/components/brahma-rx/Footer';

export default function BrahmaRxLanding() {
  return (
    <div className="brahma-rx-theme relative isolate min-h-screen overflow-x-hidden font-sans" style={{ color: '#E8ECF1' }}>
      {/* Parallax Background: Stars + Cosmic glow */}
      <ParallaxBackground />

      {/* Header with sticky navigation */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero with Fibonacci Lotus + Brand Title + USP Badges */}
        <HeroSection />

        {/* Problems ↔ Solutions */}
        <ProblemsAndSolutions />

        {/* Core Features - Full Width Bands */}
        <FeaturesSection />

        {/* Orbiting Modules Visualization */}
        <OrbitingModules />

        {/* Modules Cards */}
        <ModulesSection />

        {/* How It Works */}
        <HowItWorksSection />

        {/* About Section */}
        <AboutSection />

        {/* Contact + CTA (over lotus pond) */}
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
