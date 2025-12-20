"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to determine which features are available for the current clinic/subdomain
 * 
 * Currently, subscription plans are only available for the "cd" (Care Diabetics) subdomain
 */

// Subdomains that have access to subscription plans
const PLAN_ENABLED_SUBDOMAINS = ['cd', 'carediabetics'];

export interface ClinicFeatures {
  hasPlans: boolean;
  subdomain: string | null;
  isLoading: boolean;
}

export function useClinicFeatures(): ClinicFeatures {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Extract subdomain from current hostname
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const extractedSubdomain = extractSubdomainClient(hostname);
      setSubdomain(extractedSubdomain);
      setIsLoading(false);
    }
  }, []);

  const hasPlans = subdomain ? PLAN_ENABLED_SUBDOMAINS.includes(subdomain.toLowerCase()) : true; // Default to true for localhost without subdomain

  return {
    hasPlans,
    subdomain,
    isLoading
  };
}

/**
 * Extract subdomain from hostname (client-side version)
 */
function extractSubdomainClient(hostname: string): string | null {
  // Remove port if present
  const hostWithoutPort = hostname.split(':')[0];
  
  // Skip localhost and IP addresses
  if (hostWithoutPort === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort)) {
    return null;
  }

  const parts = hostWithoutPort.split('.');
  
  // Handle clinic.localhost pattern for development
  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0].toLowerCase();
  }

  // Handle subdomain.domain.com patterns
  if (parts.length >= 3) {
    const firstPart = parts[0].toLowerCase();
    const knownEnvironments = ['test', 'dev', 'staging', 'preview', 'demo', 'www'];
    
    if (knownEnvironments.includes(firstPart)) {
      // For patterns like www.clinic.domain.com
      if (firstPart === 'www' && parts.length >= 4) {
        return parts[1].toLowerCase();
      }
      return null;
    }
    
    return firstPart;
  }

  return null;
}

/**
 * Check if plans feature is enabled for a given subdomain
 */
export function isPlansEnabled(subdomain: string | null): boolean {
  if (!subdomain) return true; // Default to true for main domain
  return PLAN_ENABLED_SUBDOMAINS.includes(subdomain.toLowerCase());
}
