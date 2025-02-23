"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import DoctorCard from "@/components/patients/DoctorCard";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CircleCheckBig } from "lucide-react";
import { useDecryptedProfile } from "@/hooks/use-profile";

export default function Home() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { clinicId, isLoading: profileLoading } = useDecryptedProfile();

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!clinicId) {
        return;
      }
      try {
        const response = await axios.get(`/api/doctors/get-doctors?clinicId=${clinicId}`, { withCredentials: true });

        if (response.data.success) {
          setDoctors(response.data.doctors);
        } else {
          setError("Failed to load doctors");
        }
      } catch (error) {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (!profileLoading) {
      fetchDoctors();
    }
  }, [clinicId, profileLoading]);

  // Show loading state while either profile is loading or doctors are loading
  if (profileLoading || loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return <p className="text-red-500 text-center py-5">{error}</p>;
  }

  return (
    <div className="bg-muted min-h-screen px-20 pb-10">
      <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
        <div>
          <p className="text-4xl font-bold text-gray-800">
            {doctors.length} dieticians available for consultation
          </p>
          <div className="flex items-center gap-2 mt-5">
            <CircleCheckBig className="text-green-700 h-6 w-6" />
            <p className="text-lg">
              Book appointments with minimum wait-time and verified dietician details
            </p>
          </div>
        </div>

        <Button
          className="bg-teal-100 border-0 shadow-none rounded-lg p-6 flex items-center justify-center gap-2
          w-full md:w-auto mt-5 md:mt-0"
        >
          <span className="text-green-800">
            <b>Choose Date</b>
          </span>
          <CalendarIcon className="text-green-800 h-6 w-6" />
        </Button>
      </div>

      {doctors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 py-10">
          No dieticians available at the moment.
        </p>
      )}
    </div>
  );
}