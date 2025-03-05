import { useEffect, useState } from 'react';
import { decryptData } from '@/lib/encryption';

interface DecryptedProfile {
  id: string;
  name: string;
  email: string;
  clinicId?: string;
  role: string;
}

export const useDecryptedProfile = () => {
  const [profile, setProfile] = useState<DecryptedProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") { // ✅ Ensure it's running in the browser
      const getDecryptedProfile = () => {
        const encryptedProfile = sessionStorage.getItem("userProfile");
        return encryptedProfile ? decryptData(encryptedProfile) : null;
      };

      const decryptedProfile = getDecryptedProfile();
      setProfile(decryptedProfile);
      setIsLoading(false);
    }
  }, []);

  return {
    profile,
    clinicId: profile?.clinicId,
    isDoctor: profile?.role === 'DOCTOR',
    isAdmin: profile?.role === 'ADMIN',
    isLoading
  };
};