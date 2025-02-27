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

export default function DoctorsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { clinicId, isLoading: profileLoading } = useDecryptedProfile();

  const handleBookAppointment = (doctor: any, type: "video" | "clinic") => {
    dispatch(setBookingData({ doctor, type }));
    router.push(`/dashboard/appointments/${doctor.id}`);
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!clinicId) {
        return;
      }
      try {
        const response = await axios.get(
          `/api/doctors/get-doctors?clinicId=${clinicId}`,
          { withCredentials: true },
        );

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

  if (profileLoading || loading) {
    return <CdLoader />;
  }

  if (error) {
    return <p className="text-red-500 text-center py-5">{error}</p>;
  }

  return (
    <div className="bg-muted min-h-screen px-4 sm:px-8 md:px-12 lg:px-20 pb-10">
      <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
        <div>
          <p className="text-4xl font-bold text-gray-800">
            {doctors.length} Doctors available for consultation
          </p>
          <div className="flex items-center gap-2 mt-5">
            <CircleCheckBig className="text-green-700 h-6 w-6" />
            <p className="text-lg">
              Book appointments with minimum wait-time and verified dietician
              details
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onBookAppointment={handleBookAppointment}
            />
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
