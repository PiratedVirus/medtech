import { useEffect, useState } from 'react';
import { decryptData } from '@/lib/encryption';

interface DecryptedProfile {
  id: string;
  name: string;
  email: string;
  clinicId?: string;
  role: string;
  subscriptionDetails: any;
  patientProfile: any;
  phoneNumber: any;
  // Optional doctor profile info when the logged-in user is a doctor
  doctorProfile?: {
    meetRoomLink?: string; // older key in some records
    meetingRoomLink?: string; // normalized preferred key
    isDietician?: boolean;
    [key: string]: any;
  };
}

export const useDecryptedProfile = () => {
  const [profile, setProfile] = useState<DecryptedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debug = true; // Set to false to silence logs

  useEffect(() => {
    if (typeof window !== "undefined") { // ✅ Ensure it's running in the browser
      const getDecryptedProfile = () => {
        const encryptedProfile = sessionStorage.getItem("userProfile");
        return encryptedProfile ? decryptData(encryptedProfile) : null;
      };

      const decryptedProfile = getDecryptedProfile();
      if (debug) {
        // Log whatever is present in session
        // eslint-disable-next-line no-console
        console.log('[use-profile] sessionProfile', {
          hasProfile: Boolean(decryptedProfile),
          role: decryptedProfile?.role,
          hasDoctorProfile: Boolean((decryptedProfile as any)?.doctorProfile),
          meetRoomLink: (decryptedProfile as any)?.doctorProfile?.meetRoomLink,
          meetingRoomLink: (decryptedProfile as any)?.doctorProfile?.meetingRoomLink,
        });
      }
      // Normalize doctorProfile keys if present
      const normalized = (() => {
        if (!decryptedProfile) return null;
        const dp = decryptedProfile?.doctorProfile || {};
        const meetingRoomLink = dp.meetingRoomLink || dp.meetRoomLink;
        return {
          ...decryptedProfile,
          doctorProfile: Object.keys(dp).length > 0 ? { ...dp, meetingRoomLink } : undefined,
        } as DecryptedProfile;
      })();

      if (debug) {
        // eslint-disable-next-line no-console
        console.log('[use-profile] normalizedProfile', {
          role: normalized?.role,
          hasDoctorProfile: Boolean(normalized?.doctorProfile),
          meetingRoomLink: normalized?.doctorProfile?.meetingRoomLink,
        });
      }
      setProfile(normalized);
      setIsLoading(false);

      // If doctorProfile is missing or incomplete, fetch full profile once
      if (normalized && (!normalized.doctorProfile || normalized.doctorProfile.meetingRoomLink === undefined)) {
        const userId = normalized.id;
        if (userId) {
          if (debug) {
            // eslint-disable-next-line no-console
            console.log('[use-profile] fetching server profile for', userId);
          }
          fetch(`/api/profile?userId=${userId}`)
            .then(res => res.ok ? res.json() : null)
            .then(json => {
              const data = json?.data;
              if (!data) return;
              const dp = data?.doctorProfile || {};
              const meetingRoomLink = dp?.meetingRoomLink || dp?.meetRoomLink;
              if (debug) {
                // eslint-disable-next-line no-console
                console.log('[use-profile] serverProfile merged', {
                  role: data.role,
                  hasDoctorProfile: Boolean(dp && Object.keys(dp).length > 0),
                  meetingRoomLink,
                });
              }
              setProfile(prev => prev ? {
                ...prev,
                id: (data.id ?? prev.id)?.toString?.() || prev.id,
                role: data.role || prev.role,
                doctorProfile: Object.keys(dp).length > 0 ? { ...dp, meetingRoomLink } : prev.doctorProfile,
              } : prev);
            })
            .catch(() => {});
        }
      }
    }
  }, []);

  // Log when profile changes (useful to verify doctorProfile visibility on dashboard)
  useEffect(() => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.log('[use-profile] profile state', {
      id: profile?.id,
      role: profile?.role,
      isDieticianFlag: (profile as any)?.doctorProfile?.isDietician,
      hasDoctorProfile: Boolean(profile?.doctorProfile),
      meetingRoomLink: profile?.doctorProfile?.meetingRoomLink,
    });
  }, [debug, profile?.id, profile?.role, profile?.doctorProfile?.meetingRoomLink]);

  return {
    profile,
    clinicId: profile?.clinicId,
    isDoctor: profile?.role === 'DOCTOR',
    isDietician: profile?.role === 'DIETICIAN' || Boolean(profile?.doctorProfile?.isDietician),
    isAdmin: profile?.role === 'ADMIN',
    isLoading
  };
};