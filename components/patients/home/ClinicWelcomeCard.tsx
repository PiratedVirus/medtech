"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { 
  Stethoscope, 
  CalendarCheck, 
  FileText, 
  HeartPulse,
  ArrowRight,
  Building2
} from "lucide-react";
import Link from "next/link";

interface ClinicWelcomeCardProps {
  clinicName?: string;
}

/**
 * Welcome card for clinics that don't have subscription plans
 * Shows quick access to common features
 */
export default function ClinicWelcomeCard({ clinicName }: ClinicWelcomeCardProps) {
  const accentColor = "#F28A2E";
  const primaryIconColor = "#134F30";
  const outlineIconColor = "#134F30";

  return (
    <Card className="group relative w-full h-[194px] sm:h-[184px] overflow-hidden border border-gray-100 bg-custom-mutedgreen shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Background outline icon */}
      <div className="absolute -right-8 -top-4 h-40 w-40 opacity-5">
        <Building2
          className="h-full w-full"
          style={{ color: outlineIconColor }}
        />
      </div>

      <div className="relative flex flex-col justify-between p-5 h-full">
        {/* Header label */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full
                       bg-gradient-to-br from-[rgba(242,138,46,0.1)] to-[rgba(86,166,124,0.1)]"
          >
            <HeartPulse
              className="h-5 w-5"
              style={{ color: primaryIconColor }}
            />
          </div>
          <span
            className="text-sm font-medium"
            style={{ color: accentColor }}
          >
            Your Health Hub
          </span>
        </div>

        {/* Main content */}
        <div className="mt-3 flex-grow">
          <h3 className="mb-1 text-lg font-semibold text-gray-800">
            Welcome to {clinicName || "Your Clinic"}
          </h3>
          <p className="mb-2 text-xs text-gray-600">
            Access your appointments, prescriptions, and health records all in one place.
          </p>
        </div>

        {/* Quick access links */}
        <div className="flex items-center gap-4 text-xs">
          <Link 
            href="/dashboard/appointments" 
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            <span>Appointments</span>
          </Link>
          <Link 
            href="/dashboard/prescriptions" 
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Prescriptions</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}

/**
 * Alternative card showing health quick stats
 * For clinics without subscription plans
 */
export function HealthQuickAccessCard() {
  const primaryIconColor = "#134F30";

  const quickLinks = [
    {
      icon: CalendarCheck,
      label: "Appointments",
      href: "/dashboard/appointments",
      color: "#56A67C"
    },
    {
      icon: FileText,
      label: "Prescriptions", 
      href: "/dashboard/prescriptions",
      color: "#F28A2E"
    },
    {
      icon: Stethoscope,
      label: "Consultations",
      href: "/dashboard/consultations",
      color: "#134F30"
    },
    {
      icon: HeartPulse,
      label: "Health Data",
      href: "/dashboard/insights",
      color: "#E74C3C"
    }
  ];

  return (
    <Card className="group relative w-full h-[184px] overflow-hidden bg-custom-mutedgreen shadow-none transition-all duration-300">
      {/* Large stethoscope outline in background */}
      <div className="absolute -right-8 -top-4 h-40 w-40 opacity-5">
        <Stethoscope className="h-full w-full text-[#174b30]" />
      </div>

      <div className="relative flex h-full flex-col justify-between p-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F28A2E]/10 to-[#56A67C]/10">
            <HeartPulse className="h-5 w-5" style={{ color: primaryIconColor }} />
          </div>
          <span className="text-xl font-semibold text-gray-800">Quick Access</span>
        </div>

        {/* Quick access grid */}
        <div className="flex justify-center items-center gap-6 px-1 mt-2">
          {quickLinks.map((link, idx) => (
            <Link 
              key={idx} 
              href={link.href}
              className="flex flex-col items-center group/link hover:scale-105 transition-transform"
            >
              <div 
                className="w-[50px] h-[50px] rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${link.color}15` }}
              >
                <link.icon 
                  className="h-6 w-6" 
                  style={{ color: link.color }}
                />
              </div>
              <div className="text-xs font-medium text-center text-gray-700 mt-2 group-hover/link:text-primary transition-colors">
                {link.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
