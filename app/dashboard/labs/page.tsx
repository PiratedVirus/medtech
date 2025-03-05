"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setBookingData } from "@/store/appointmentSlice";
import { useDecryptedProfile } from "@/hooks/use-profile";
import axios from "axios";
import CdLoader from "@/components/ui/custom/cd-loader";
import { CircleCheckBig, CalendarIcon } from "lucide-react";
import DoctorCard from "@/components/patients/doctors/DoctorCard";
import { Button } from "@/components/ui/button";
import LabCard from "@/components/patients/labs/LabCard";

export default function DoctorsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [labs, setlabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { clinicId, isLoading: profileLoading } = useDecryptedProfile();

  const handleBookAppointment = (lab: any) => {
    dispatch(setBookingData(lab ));
    router.push(`/dashboard/labs/${lab.id}`);
  };

  useEffect(() => {
    const fetchLabs = async () => {
      if (!clinicId) {
        return;
      }
      try {
        const response = await axios.get(
          `/api/labs/get-labs?clinicId=${clinicId}`,
          { withCredentials: true },
        );

        if (response.data.success) {
          setlabs(response.data.packages);
        } else {
          setError("Failed to load labs");
        }
      } catch (error) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (!profileLoading) {
      fetchLabs();
    }
  }, [clinicId, profileLoading]);

  if (profileLoading || loading) {
    return <CdLoader />;
  }

  if (error) {
    return <p className="text-red-500 text-center py-5">{error}</p>;
  }

  if(labs?.length === 0) {
    return <p className="text-center text-gray-600 py-10">No labs available at the moment.</p>;
    }

  return (
    <div className="bg-muted min-h-screen px-4 sm:px-8 md:px-12 lg:px-20 pb-10">
      <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
        <div>
          <p className="text-4xl font-bold text-gray-800">
            {labs?.length ?? 0} packages available for booking
          </p>
          <div className="flex items-center gap-2 mt-5">
            <CircleCheckBig className="text-green-700 h-6 w-6" />
            <p className="text-lg">
              Book Lab package with certified Lab Technicians
            </p>
          </div>
        </div>
      </div>

      {labs?.length > 0 ? (
        <div className="flex items-start flex-wrap gap-6 mt-10">
          {labs.map((lab) => (
            <LabCard
              key={lab.id}
              labPackage={lab}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 py-10">
          No packages available at the moment.
        </p>
      )}
    </div>
  );
}
