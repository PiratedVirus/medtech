import { useQuery } from '@tanstack/react-query';
import { decryptData, encryptData } from '@/lib/encryption';
import axios from 'axios';

interface DecryptedProfile {
  id: string;
  name: string;
  email: string;
  clinicId?: string;
  role: string;
  subscriptionDetails: any;
  patientProfile: any;
  phoneNumber: any;
  lastUpdated?: string;
  doctorProfile?: {
    meetRoomLink?: string;
    meetingRoomLink?: string;
    isDietician?: boolean;
    [key: string]: any;
  };
}

// Helper function to get cached profile from sessionStorage
const getCachedProfile = (): DecryptedProfile | null => {
  if (typeof window === "undefined") return null;
  
  try {
    const encryptedProfile = sessionStorage.getItem("userProfile");
    if (!encryptedProfile) return null;
    
    const decryptedProfile = decryptData(encryptedProfile);
    
    // Check if profile is expired (24 hours)
    if (decryptedProfile?.lastUpdated) {
      const lastUpdated = new Date(decryptedProfile.lastUpdated);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        sessionStorage.removeItem("userProfile");
        return null;
      }
    }
    
    return decryptedProfile;
  } catch (error) {
    console.error('Error reading cached profile:', error);
    sessionStorage.removeItem("userProfile");
    return null;
  }
};

// Helper function to cache profile to sessionStorage
const setCachedProfile = (profile: DecryptedProfile) => {
  if (typeof window === "undefined") return;
  
  try {
    const profileWithTimestamp = {
      ...profile,
      lastUpdated: new Date().toISOString()
    };
    const encryptedProfile = encryptData(profileWithTimestamp);
    sessionStorage.setItem("userProfile", encryptedProfile);
  } catch (error) {
    console.error('Error caching profile:', error);
  }
};

// Centralized profile fetcher function
const fetchUserProfile = async (): Promise<DecryptedProfile | null> => {
  try {
    console.log('[fetchUserProfile] Starting API call...');
    const response = await axios.get("/api/auth/get-user-profile", {
      withCredentials: true,
    });
    
    console.log('[fetchUserProfile] API response:', response.data);
    
    const userProfile = response.data.user;
    if (!userProfile) {
      console.log('[fetchUserProfile] No user profile in response');
      return null;
    }
    
    // Normalize doctor profile keys
    const doctorProfile = userProfile?.doctorProfile;
    if (doctorProfile) {
      const meetingRoomLink = doctorProfile.meetingRoomLink || doctorProfile.meetRoomLink;
      userProfile.doctorProfile = { ...doctorProfile, meetingRoomLink };
    }
    
    console.log('[fetchUserProfile] Normalized profile:', userProfile);
    
    // Cache the profile
    setCachedProfile(userProfile);
    
    return userProfile;
  } catch (error) {
    console.error('[fetchUserProfile] Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Centralized profile hook using React Query
 * This replaces both useDecryptedProfile and Redux profile management
 */
export const useCentralizedProfile = () => {
  const queryResult = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    initialData: getCachedProfile,
    staleTime: 0, // Temporarily disable stale time for debugging
    gcTime: 60 * 60 * 1000,       // 1 hour - keep in memory longer
    refetchOnWindowFocus: false,   // Don't refetch on tab focus
    refetchOnMount: true,         // Force refetch on mount for debugging
    retry: (failureCount, error: any) => {
      // Don't retry auth errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 1; // Only retry once for profile
    },
  });

  const profile = queryResult.data;
  
  // If we have cached data but query is still loading, prioritize cached data
  const cachedProfile = getCachedProfile();
  const effectiveProfile = profile || cachedProfile;

  // Debug logging to understand what's happening
  console.log('[useCentralizedProfile] Debug:', {
    queryIsLoading: queryResult.isLoading,
    queryIsError: queryResult.isError,
    queryIsFetching: queryResult.isFetching,
    queryStatus: queryResult.status,
    queryData: profile,
    cachedProfileExists: !!cachedProfile,
    effectiveProfileExists: !!effectiveProfile,
    effectiveProfileId: effectiveProfile?.id,
    effectiveProfileClinicId: effectiveProfile?.clinicId,
    queryError: queryResult.error?.message,
    queryErrorStatus: queryResult.error?.response?.status,
  });

  
  return {
    profile: effectiveProfile,
    clinicId: effectiveProfile?.clinicId,
    isDoctor: effectiveProfile?.role === 'DOCTOR',
    isDietician: effectiveProfile?.role === 'DIETICIAN' || Boolean(effectiveProfile?.doctorProfile?.isDietician),
    isAdmin: effectiveProfile?.role === 'ADMIN',
    isPathology: effectiveProfile?.role === 'PATHOLOGY',
    isLoading: queryResult.isLoading && !cachedProfile, // Only show loading if no cached data
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    // Utility function to update profile cache
    updateProfile: (updates: Partial<DecryptedProfile>) => {
      if (effectiveProfile) {
        const updatedProfile = { ...effectiveProfile, ...updates };
        setCachedProfile(updatedProfile);
        queryResult.refetch();
      }
    },
    // Utility function to clear profile
    clearProfile: () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("userProfile");
      }
      // Clear the query cache
      queryResult.refetch();
    }
  };
};

// Backward compatibility export (gradually replace useDecryptedProfile with this)
export const useDecryptedProfile = useCentralizedProfile;
