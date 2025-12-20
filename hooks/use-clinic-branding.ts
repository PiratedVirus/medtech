"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

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

interface ClinicBrandingResponse {
  success: boolean;
  branding: ClinicBranding;
  isDefault: boolean;
}

/**
 * Default branding fallback for Care Diabetics
 */
const defaultBranding: ClinicBranding = {
  id: 0,
  name: "Care Diabetics",
  subdomain: "cd",
  logo: "/images/new-logo.png",           // Square logo for prescription
  footerLogo: "/images/new-logo.png",     // Footer logo
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

/**
 * Hook to fetch clinic branding based on current subdomain
 * Uses React Query for caching and efficient data fetching
 */
export function useClinicBranding() {
  const { data, isLoading, error } = useQuery<ClinicBrandingResponse>({
    queryKey: ["clinic-branding"],
    queryFn: async () => {
      const response = await axios.get("/api/clinic/branding");
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - branding rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    branding: data?.branding || defaultBranding,
    isDefault: data?.isDefault ?? true,
    isLoading,
    error,
  };
}

/**
 * Get the clinic logo URL with fallback
 */
export function useClinicLogo(): string {
  const { branding } = useClinicBranding();
  return branding.logo || "/images/new-logo.png";
}

/**
 * Get clinic name
 */
export function useClinicName(): string {
  const { branding } = useClinicBranding();
  return branding.name || "Care Diabetics";
}
