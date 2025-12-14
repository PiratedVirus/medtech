"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function ClinicNotFoundPage() {
  const searchParams = useSearchParams();
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isClinicMismatch ? "Clinic Access Denied" : "Clinic Not Found"}
        </h1>

        <div className="text-gray-600 mb-6 space-y-2">
          {isClinicMismatch ? (
            <>
              <p>
                You are trying to access a clinic portal that doesn&apos;t match your account.
              </p>
              <p className="text-sm">
                Please use the correct clinic URL to access your account.
              </p>
            </>
          ) : (
            <>
              <p>
                The clinic portal you&apos;re trying to access doesn&apos;t exist or is not available.
              </p>
              {subdomain && (
                <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-2">
                  Subdomain: <span className="font-semibold">{subdomain}</span>
                </p>
              )}
              <p className="text-sm mt-4">
                Please check the URL and try again, or contact your clinic administrator.
              </p>
            </>
          )}
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-custom-green text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Link>

          {isClinicMismatch && (
            <p className="text-sm text-gray-500 mt-4">
              If you believe this is an error, please contact support.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
