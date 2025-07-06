"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export interface DoctorDashboardActionCardProps {
  href: string;
  headerLabel: string;
  cardTitle: string;
  cardDescription: string;
  PrimaryIcon: React.ElementType;
  OutlineIcon: React.ElementType;
  ctaIcon?: React.ElementType;
  accentColor?: string;
  primaryIconColor?: string;
  outlineIconColor?: string;
}

export default function DoctorDashboardActionCard({
  href,
  headerLabel,
  cardTitle,
  cardDescription,
  PrimaryIcon,
  OutlineIcon,
  ctaIcon: CtaIcon,
  accentColor = "#F28A2E",
  primaryIconColor = "#134F30",
  outlineIconColor = "#134F30",
}: DoctorDashboardActionCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="group relative w-full h-[120px] overflow-hidden border border-gray-100 bg-custom-mutedgreen shadow-sm transition-all duration-300 hover:shadow-md">
        {/* Background outline icon rendered with reduced opacity */}
        <div className="absolute -right-8 -top-4 h-28 w-28 opacity-5">
          <OutlineIcon className="h-full w-full" style={{ color: outlineIconColor }} />
        </div>
        <div className="relative flex flex-col justify-between p-4 h-full">
          {/* Header Section */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(242,138,46,0.1)] to-[rgba(86,166,124,0.1)]">
              <PrimaryIcon className="h-4 w-4" style={{ color: primaryIconColor }} />
            </div>
            <span className="text-sm font-medium" style={{ color: accentColor }}>
              {headerLabel}
            </span>
          </div>
          {/* Main Content */}
          <div className="mt-2 flex-grow">
            <h3 className="mb-0.5 text-lg font-semibold text-gray-800 leading-tight">{cardTitle}</h3>
            <p className="text-[11px] text-gray-600 leading-snug line-clamp-2">{cardDescription}</p>
          </div>

        </div>
      </Card>
    </Link>
  );
} 