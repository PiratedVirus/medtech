import React, { createContext, useContext } from "react";
import UserProfile from "@/store/userSlice"; // Adjust the import path as needed

interface ProfileContextType {
  profile: typeof UserProfile | null;
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
  profile: typeof UserProfile | null;
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
