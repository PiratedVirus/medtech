"use client";

import { Facebook, Instagram, Mail, Youtube, Twitter, Linkedin, Building2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useClinicBranding } from "@/hooks/use-clinic-branding";
import { Skeleton } from "@/components/ui/skeleton";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { branding, isLoading, isDefault } = useClinicBranding();

  // Social media icon mapping
  const socialIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="h-5 w-5" />,
    instagram: <Instagram className="h-5 w-5" />,
    youtube: <Youtube className="h-5 w-5" />,
    twitter: <Twitter className="h-5 w-5" />,
    linkedin: <Linkedin className="h-5 w-5" />,
  };

  // Get active social links
  const activeSocialLinks = branding.socialLinks
    ? Object.entries(branding.socialLinks).filter(([_, url]) => url && url !== "#")
    : [];

  // Loading skeleton
  if (isLoading) {
    return (
      <footer className="text-black border-t-2">
        <div className="container px-4 py-12 mx-auto">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-6">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-2 gap-8 col-span-1 sm:col-span-2">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="text-black border-t-2">
      <div className="container px-4 py-12 mx-auto">
        {/* Responsive Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Column 1 - Logo & Tagline */}
          <div className="space-y-6 text-center md:text-left">
            <div className="space-y-2 flex flex-col items-center md:items-start">
              {/* Use footerLogo (rectangular) if available, fallback to logo (square) */}
              {branding.footerLogo || branding.logo ? (
                <Image
                  src={branding.footerLogo || branding.logo || "/images/new-logo.png"}
                  alt={branding.name}
                  width={250}
                  height={50}
                  className="mb-1 max-h-14 w-auto object-contain"
                />
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-8 w-8" style={{ color: branding.primaryColor || "#134F30" }} />
                  <span className="text-xl font-bold" style={{ color: branding.primaryColor || "#134F30" }}>
                    {branding.name}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-center md:text-left">
              {branding.footerTagline || branding.subtitle || "Connecting Patients with Doctors, Seamlessly"}
            </p>
          </div>

          {/* Column 2 & 3 - Links (Side by Side on Mobile) */}
          <div className="grid grid-cols-2 gap-8 col-span-1 sm:col-span-2">
            {/* Clinic Links */}
            <div>
              <h3 className="text-xl font-semibold mb-4">{branding.name}</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm hover:underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/about/policies#privacy-policy" className="text-sm hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/about/policies#terms-conditions" className="text-sm hover:underline">
                    Terms and Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/about/policies#refund-cancellation" className="text-sm hover:underline">
                    Refund and Cancellation Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard/doctors" className="text-sm hover:underline">
                    Find a Doctor
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/appointments"
                    className="text-sm hover:underline"
                  >
                    Book Appointment
                  </Link>
                </li>
                {branding.websiteUrl && branding.websiteUrl !== "#" && (
                  <li>
                    <a 
                      href={branding.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm hover:underline"
                    >
                      Visit Website
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Column 4 - Contact Info */}
          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <div className="space-y-2 text-sm">
              {branding.email && (
                <p>
                  <a href={`mailto:${branding.email}`} className="hover:underline">
                    {branding.email}
                  </a>
                </p>
              )}
              {branding.phone && (
                <p>
                  <a href={`tel:${branding.phone}`} className="hover:underline">
                    {branding.phone}
                  </a>
                </p>
              )}
              {branding.address && (
                <p className="text-gray-600">{branding.address}</p>
              )}
              {branding.timings && (
                <p className="text-gray-500 text-xs mt-2">
                  <span className="font-medium">Hours:</span> {branding.timings}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div 
        className="border-t text-white border-white/10"
        style={{ backgroundColor: branding.primaryColor || "#134f30" }}
      >
        <div className="container px-4 py-4 mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            {branding.copyrightText || `Copyright © ${currentYear} ${branding.name} | All rights reserved.`}
          </p>
          <div className="flex gap-4">
            {/* Render social links if available */}
            {activeSocialLinks.length > 0 ? (
              activeSocialLinks.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white/80 transition-colors"
                  aria-label={platform}
                >
                  {socialIcons[platform] || <Mail className="h-5 w-5" />}
                </a>
              ))
            ) : (
              // Default social icons if none configured
              <>
                <Link href="#" className="hover:text-white/80">
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link href="#" className="hover:text-white/80">
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link href="#" className="hover:text-white/80">
                  <Mail className="h-5 w-5" />
                </Link>
                <Link href="#" className="hover:text-white/80">
                  <Youtube className="h-5 w-5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
