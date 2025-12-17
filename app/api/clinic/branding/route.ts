import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractSubdomain } from "@/lib/subdomain-utils";

export interface ClinicBranding {
  id: number;
  name: string;
  subdomain: string | null;
  logo: string | null;           // Square logo for prescription headers
  footerLogo: string | null;     // Rectangular/wide logo for footer display
  subtitle: string | null;
  address: string | null;
  contactInfo: string | null;
  timings: string | null;
  email: string | null;
  phone: string | null;
  footerTagline: string | null;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  } | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  websiteUrl: string | null;
  copyrightText: string | null;
}

/**
 * GET /api/clinic/branding
 * 
 * Fetches clinic branding information based on the current subdomain.
 * This is used by the footer and other components to display tenant-specific branding.
 */
export async function GET(request: NextRequest) {
  try {
    // Extract subdomain from request
    const hostname = request.headers.get("host") || "";
    const subdomain = extractSubdomain(hostname);

    if (!subdomain) {
      // Return default branding for main domain (Care Diabetics)
      return NextResponse.json({
        success: true,
        branding: getDefaultBranding(),
        isDefault: true,
      });
    }

    // Find clinic by subdomain
    const clinic = await prisma.clinic.findFirst({
      where: {
        subdomain: subdomain.toLowerCase(),
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        logo: true,
        footerLogo: true,
        subtitle: true,
        address: true,
        contactInfo: true,
        timings: true,
        email: true,
        phone: true,
        footerTagline: true,
        socialLinks: true,
        primaryColor: true,
        secondaryColor: true,
        websiteUrl: true,
        copyrightText: true,
      },
    });

    if (!clinic) {
      // Clinic not found, return default branding
      return NextResponse.json({
        success: true,
        branding: getDefaultBranding(),
        isDefault: true,
      });
    }

    // Parse socialLinks if it's a string
    let socialLinks = null;
    if (clinic.socialLinks) {
      socialLinks = typeof clinic.socialLinks === "string" 
        ? JSON.parse(clinic.socialLinks) 
        : clinic.socialLinks;
    }

    const branding: ClinicBranding = {
      ...clinic,
      socialLinks,
    };

    return NextResponse.json({
      success: true,
      branding,
      isDefault: false,
    });
  } catch (error) {
    console.error("[clinic-branding] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch clinic branding",
        branding: getDefaultBranding(),
        isDefault: true,
      },
      { status: 500 }
    );
  }
}

/**
 * Default branding for Care Diabetics (main domain)
 */
function getDefaultBranding(): ClinicBranding {
  return {
    id: 0,
    name: "Care Diabetics",
    subdomain: "cd",
    logo: "/images/new-logo.png",           // Square logo for prescription
    footerLogo: "/images/new-logo.png",     // Footer logo (can be same or different)
    subtitle: "Your Partner in Diabetes Care",
    address: null,
    contactInfo: null,
    timings: null,
    email: "connect@carediabetics.com",
    phone: null,
    footerTagline: "Connecting Patients with Doctors, Seamlessly",
    socialLinks: {
      facebook: "#",
      instagram: "#",
      youtube: "#",
    },
    primaryColor: "#134F30",
    secondaryColor: "#F28A2E",
    websiteUrl: "https://carediabetics.com",
    copyrightText: null,
  };
}
