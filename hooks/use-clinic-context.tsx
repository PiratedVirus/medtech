"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ClinicContext {
  clinicId: number | null;
  subdomain: string | null;
  clinicName: string | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Extract subdomain from hostname (client-side)
 */
function extractSubdomainFromHostname(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Skip localhost and IP addresses
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }
  
  // Known environment subdomains to skip
  const knownEnvironments = ['test', 'dev', 'staging', 'preview', 'demo', 'www'];
  
  // If we have 3+ parts (subdomain.domain.tld or subdomain.env.domain.tld)
  if (parts.length >= 3) {
    const firstPart = parts[0].toLowerCase();
    
    // Skip if it's an environment subdomain
    if (knownEnvironments.includes(firstPart)) {
      return null;
    }
    
    return firstPart;
  }
  
  // For localhost development with subdomain (e.g., manipal.localhost:3000)
  if (parts.length === 2 && parts[1].startsWith('localhost')) {
    return parts[0].toLowerCase();
  }
  
  return null;
}

/**
 * Hook to validate clinic context on client side
 * Fetches clinic by subdomain and redirects to clinic-not-found if not found
 */
export function useClinicContext(options: { redirectOnNotFound?: boolean } = {}): ClinicContext {
  const { redirectOnNotFound = true } = options;
  const router = useRouter();
  const [context, setContext] = useState<ClinicContext>({
    clinicId: null,
    subdomain: null,
    clinicName: null,
    isLoading: true,
    isError: false,
    error: null,
  });

  useEffect(() => {
    const validateClinic = async () => {
      const subdomain = extractSubdomainFromHostname();
      
      // No subdomain = no clinic context needed (e.g., main domain)
      if (!subdomain) {
        setContext({
          clinicId: null,
          subdomain: null,
          clinicName: null,
          isLoading: false,
          isError: false,
          error: null,
        });
        return;
      }

      try {
        // Call the debug endpoint to get clinic info
        const response = await fetch(`/api/debug/clinic-lookup?subdomain=${encodeURIComponent(subdomain)}`);
        const data = await response.json();

        if (response.ok && (data.exactMatch || data.caseInsensitiveMatch)) {
          const clinic = data.exactMatch || data.caseInsensitiveMatch;
          setContext({
            clinicId: clinic.id,
            subdomain: clinic.subdomain,
            clinicName: clinic.name,
            isLoading: false,
            isError: false,
            error: null,
          });
        } else {
          // Clinic not found
          setContext({
            clinicId: null,
            subdomain,
            clinicName: null,
            isLoading: false,
            isError: true,
            error: 'Clinic not found',
          });

          // Redirect to clinic-not-found page
          if (redirectOnNotFound) {
            router.replace('/clinic-not-found');
          }
        }
      } catch (error) {
        console.error('[useClinicContext] Error validating clinic:', error);
        setContext({
          clinicId: null,
          subdomain,
          clinicName: null,
          isLoading: false,
          isError: true,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    validateClinic();
  }, [redirectOnNotFound, router]);

  return context;
}

/**
 * Simple hook to just get the subdomain without validation
 */
export function useSubdomain(): string | null {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    setSubdomain(extractSubdomainFromHostname());
  }, []);

  return subdomain;
}

export { extractSubdomainFromHostname };
