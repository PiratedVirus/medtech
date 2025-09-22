import React, { createContext, useContext } from "react";

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

interface ProfileContextType {
  profile: DecryptedProfile | null;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

interface ProfileProviderProps {
  profile: DecryptedProfile | null;
  children: React.ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  profile,
  children,
}) => {
  return (
    <ProfileContext.Provider value={{ profile }}>
      {children}
    </ProfileContext.Provider>
  );
};
