"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export interface HomePageCardSmallProps {
  href: string;
  /** Short label shown next to the primary icon (e.g. "Health Analytics") */
  headerLabel: string;
  /** Title of the card (e.g. "View Health Insights") */
  cardTitle: string;
  /** Detailed description displayed below the title */
  cardDescription: string;
  /** Call-to-action text at the bottom of the card */
  ctaText: string;
  /** Icon component to display as the primary icon within a rounded container */
  PrimaryIcon: React.ElementType;
  /** Icon component to be rendered as an outline in the background */
  OutlineIcon: React.ElementType;
  /** Optionally override the default CTA icon; defaults to ArrowRight if not provided */
  ctaIcon?: React.ElementType;
  /** Color for the header label text; defaults to "#F28A2E" */
  accentColor?: string;
  /** Color for the primary icon; defaults to "#134F30" */
  primaryIconColor?: string;
  /** Color for the outline icon; defaults to "#134F30" */
  outlineIconColor?: string;
}

export default function HomePageCardSmall({
  href,
  headerLabel,
  cardTitle,
  cardDescription,
  ctaText,
  PrimaryIcon,
  OutlineIcon,
  ctaIcon: CtaIcon,
  accentColor = "#F28A2E",
  primaryIconColor = "#134F30",
  outlineIconColor = "#134F30",
}: HomePageCardSmallProps) {
  // Use the provided CTA icon or fallback to the default ArrowRight icon
  const CTAIcon = CtaIcon ? CtaIcon : ArrowRight;

  return (
    <Link href={href} className="block">
      <Card className="group relative w-full h-[194px] sm:h-[184px] overflow-hidden border border-gray-100 bg-custom-mutedgreen shadow-sm transition-all duration-300 hover:shadow-md">
        {/* Background outline icon rendered with reduced opacity */}
        <div className="absolute -right-8 -top-4 h-40 w-40 opacity-5">
          <OutlineIcon className="h-full w-full" style={{ color: outlineIconColor }} />
        </div>

        <div className="relative flex flex-col justify-between p-5 h-full">
  {/* Header Section */}
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(242,138,46,0.1)] to-[rgba(86,166,124,0.1)]">
      <PrimaryIcon className="h-5 w-5" style={{ color: primaryIconColor }} />
    </div>
    <span className="text-sm font-medium" style={{ color: accentColor }}>
      {headerLabel}
    </span>
  </div>

  {/* Main Content */}
  <div className="mt-4 flex-grow">
    <h3 className="mb-1 text-lg font-semibold text-gray-800">{cardTitle}</h3>
    <p className="mb-3 text-xs text-gray-600">{cardDescription}</p>
  </div>

  {/* Call-to-Action */}
  <div className="flex items-center text-sm font-medium text-[#134F30] transition-all duration-300 group-hover:translate-x-1">
    {ctaText}
    <CTAIcon className="ml-1 h-4 w-4" />
  </div>
</div>
      </Card>
    </Link>
  );
}