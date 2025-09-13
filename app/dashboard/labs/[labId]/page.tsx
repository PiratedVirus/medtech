'use client';
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import axios from "axios";
import CdLoader from "@/components/ui/custom/cd-loader";


import LabBookingHome from "@/components/patients/labs/booking/LabBookingHome";

export default function LabBookingHomePage () {
    const labBbookingData = useSelector((state: RootState) => state.labBooking.labBookingData);
    if(labBbookingData) {
        console.log("serving from if")
        return <LabBookingHome packageInfo={labBbookingData} />
    } else {
        console.log("serving from else")

        const { clinicId, isLoading: profileLoading, profile } = useDecryptedProfile();
        const { data: labs, isLoading, isError } = useQuery({
            queryKey: ["labs", clinicId], // Unique cache key
            queryFn: async () => {
              if (!clinicId) return [];
              const response = await axios.get(
                `/api/labs/get-labs?clinicId=${clinicId}`,
                { withCredentials: true }
              );
              return response.data.success ? response.data.packages : [];
            },
            // Using global defaults for cache settings
            enabled: !!clinicId && !!profile?.id, // Only run when clinicId and profile.id exist
          });

          if (profileLoading || isLoading) {
            return <CdLoader />;
          }
          if(labs) {
            return <LabBookingHome packageInfo={labs[0]} />
          }

    }
    

}

