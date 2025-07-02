"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setLabBookingData } from "@/store/labSlice";
import { useDecryptedProfile } from "@/hooks/use-profile";
import axios from "axios";
import CdLoader from "@/components/ui/custom/cd-loader";
import { CircleCheckBig } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LabCard from "@/components/patients/labs/view/LabCard";
// Removed labResult import, using live data from API
import LabResultCard from "@/components/patients/labs/view/LabResultCard";
import { useState } from "react";

export default function LabsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { profile, isLoading: profileLoading } = useDecryptedProfile();
  const patientId = profile?.id;
  const clinicId = profile?.clinicId;
  const { data: labData = { scheduled: [], completed: [] }, isLoading: loadingResults } = useQuery({
    queryKey: ["labResults", patientId],
    queryFn: async () => {
      const response = await axios.get(`/api/labs?patientId=${patientId}`);
      return response.data || { scheduled: [], completed: [] };
    },
    enabled: !!patientId,
  });

  const handleBookAppointment = (lab: any) => {
    dispatch(setLabBookingData(lab));
    router.push(`/dashboard/labs/${lab.id}`);
  };


  // Fetch labs using React Query
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
    staleTime: 1 * 6 * 1, // ✅ Cache valid for 10 minutes
    gcTime: 6 * 1 * 1, // ✅ Keeps cache for 1 hour
    refetchOnWindowFocus: false, // ✅ Prevents re-fetching on tab switch
    refetchOnMount: false, // ✅ Prevents re-fetching when navigating back
    refetchOnReconnect: true, // ✅ Fetches only if internet reconnects
    enabled: !!clinicId, // ✅ Runs only when clinicId exists
  });

  const [searchPackages, setSearchPackages] = useState("");
  const [searchTests, setSearchTests] = useState("");

  const labPackages = (labs || [])
    .filter((lab: any) => lab.isLabPackage === true)
    .filter((lab: any) => lab.name.toLowerCase().includes(searchPackages.toLowerCase()));

  const individualTests = (labs || [])
    .filter((lab: any) => lab.isLabPackage === false)
    .filter((lab: any) => lab.name.toLowerCase().includes(searchTests.toLowerCase()));

  if (profileLoading || isLoading) {
    return <CdLoader />;
  }

  if (isError) {
    return <p className="text-red-500 text-center py-5">Something went wrong. Failed to load labs.</p>;
  }
  return (
    <>
      {/* Lab Booking Section */}
      <div className="bookPackages">
        <div className="bg-muted h-fit px-4 sm:px-8 md:px-12 lg:px-20 pb-4">
          <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
            <div>
              <>
                {labPackages.length > 0 && (
                  <>
                    <p className="text-4xl font-bold text-gray-800">
                      {labPackages.length} packages available for booking
                    </p>
                    <div className="flex items-center gap-2 mt-5">
                      <CircleCheckBig className="text-green-700 h-6 w-6" />
                      <p className="text-lg">
                        Book Lab package with certified Lab Technicians
                      </p>
                    </div>
                  </>
                )}

              </>

            </div>
            <div className="mt-4 md:mt-0">
              <input
                type="text"
                placeholder="Search lab package..."
                className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-80 text-gray-500 focus:border-primary focus:outline-none"
                value={searchPackages}
                onChange={(e) => setSearchPackages(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {labPackages.map((lab: any) => (
              <LabCard key={lab.id} labPackage={lab} handleBookAppointment={handleBookAppointment} />
            ))}
          </div>
        </div>
      </div>
      <div className="bookPackages">
        <div className="bg-muted h-fit px-4 sm:px-8 md:px-12 lg:px-20 pb-4">
          <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
            <div>
              <>
                {individualTests.length > 0 && (
                  <>
                    <p className="text-4xl font-bold text-gray-800">
                      {individualTests.length} tests available for booking
                    </p>
                    <div className="flex items-center gap-2 mt-5">
                      <CircleCheckBig className="text-green-700 h-6 w-6" />
                      <p className="text-lg">
                        Book Lab tests with certified Lab Technicians
                      </p>
                    </div>
                  </>
                )}

              </>

            </div>
            <div className="mt-4 md:mt-0">
              <input
                type="text"
                placeholder="Search lab tests..."
                className="border border-gray-300 rounded-md px-4 py-2 w-full md:w-80 text-gray-500 focus:border-primary focus:outline-none"
                value={searchTests}
                onChange={(e) => setSearchTests(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {individualTests.map((lab: any) => (
              <LabCard key={lab.id} labPackage={lab} handleBookAppointment={handleBookAppointment} />
            ))}
          </div>
        </div>
      </div>

      {/* Past Lab Bookings Section */}
      <div className="currentPackages">
        <div className="bg-muted h-fit px-4 sm:px-8 md:px-12 lg:px-20 pb-10">
          <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
            <div>
              <p className="text-4xl font-bold text-gray-800">
                Scheduled bookings
              </p>
              <div className="flex items-center gap-2 mt-5">
                <p className="text-lg">
                  Here you can view your current bookings
                </p>
              </div>
            </div>
          </div>


          {labData.scheduled.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {labData.scheduled.map((result: any) => (
                <LabResultCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No scheduled bookings available at the moment.</p>
          )}
        </div>
      </div>

      <div className="pastPackages">
        <div className="bg-muted h-fit px-4 sm:px-8 md:px-12 lg:px-20 pb-10">
          <div className="py-7 mb-5 flex flex-col md:flex-row md:items-center justify-between border-b-2">
            <div>
              <p className="text-4xl font-bold text-gray-800">
                {labData.completed.length} reports available from past bookings
              </p>
              <div className="flex items-center gap-2 mt-5">
                <p className="text-lg">
                  Here you can view your past bookings
                </p>
              </div>
            </div>
          </div>


          {labData.completed.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {labData.completed.map((result: any) => (
                <LabResultCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No past reports available yet.</p>
          )}
        </div>
      </div>

    </>
  );
}