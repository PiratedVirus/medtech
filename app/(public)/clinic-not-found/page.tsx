"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClinicNotFoundPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  // Extract subdomain from hostname
  const getSubdomain = (host: string) => {
    const parts = host.split(".");
    if (parts.length >= 3) {
      return parts[0];
    }
    return null;
  };

  const subdomain = getSubdomain(hostname);
  const isClinicMismatch = error === "clinic_mismatch";
  const isNoSubdomain = error === "no_subdomain";

  // Clean URL by removing query params (optional - for cleaner URL)
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isClinicMismatch 
            ? "Access Denied" 
            : isNoSubdomain 
            ? "Invalid Access" 
            : "Clinic Not Found"}
        </h1>

        <div className="text-gray-600 mb-6 space-y-2">
          {isClinicMismatch ? (
            <>
              <p>
                You are trying to access a clinic portal that doesn&apos;t match your account.
              </p>
              <p className="text-sm">
                Please use the correct clinic website link provided by your clinic.
              </p>
            </>
          ) : isNoSubdomain ? (
            <>
              <p className="text-base">
                Please access this website using the link provided by your clinic.
              </p>
              <p className="text-sm mt-3 text-gray-700">
                Each clinic has its own unique website address. If you received a link from your clinic, please use that exact link to access your account.
              </p>
              <p className="text-sm mt-4 text-gray-500">
                If you don&apos;t have the correct link, please contact your clinic or check any emails or messages they may have sent you.
              </p>
            </>
          ) : (
            <>
              <p>
                The clinic portal you&apos;re trying to access doesn&apos;t exist or is not available.
              </p>
              {subdomain && (
                <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-2">
                  Clinic: <span className="font-semibold">{subdomain}</span>
                </p>
              )}
              <p className="text-sm mt-4">
                Please check the website address and try again, or contact your clinic administrator.
              </p>
            </>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            {!isNoSubdomain && (
              <Link href="/" className="flex-1">
                <Button className="w-full bg-custom-green text-white hover:bg-green-600">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            )}
          </div>

          {(isClinicMismatch || isNoSubdomain) && (
            <p className="text-sm text-gray-500 mt-4">
              Need help? Please contact your clinic for assistance.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
