"use client";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setLabBookingData } from "@/store/labSlice";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";
import axios from "axios";
import CdLoader from "@/components/ui/custom/cd-loader";
import { CircleCheckBig } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LabCard from "@/components/patients/labs/view/LabCard";
// Removed labResult import, using live data from API
import LabResultCard from "@/components/patients/labs/view/LabResultCard";
import { useState } from "react";
import ReportUploadButton from "@/components/common/ReportUploadButton";
import StandaloneReportCard from "@/components/patients/labs/view/StandaloneReportCard";
import UnifiedAnalysisModal from "@/components/common/UnifiedAnalysisModal";
import ParameterTrendsModal from "@/components/patients/labs/ParameterTrendsModal";
import { Button } from "@/components/ui/button";

export default function LabsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { profile, isLoading: profileLoading } = useDecryptedProfile();
  const patientId = profile?.id;
  const clinicId = profile?.clinicId;
  const { data: labData = { scheduled: [], completed: [] }, isLoading: loadingResults, refetch: fetchLabData } = useQuery({
    queryKey: ["labResults", patientId],
    queryFn: async () => {
      const response = await axios.get(`/api/labs?patientId=${patientId}`);
      return response.data || { scheduled: [], completed: [] };
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,  // 5 minutes - lab results change moderately
    refetchOnMount: false,     // Use cached data when available
  });

  // Fetch standalone reports (manually uploaded)
  const { data: standaloneReports = [], isLoading: loadingStandaloneReports, refetch: fetchStandaloneReports } = useQuery({
    queryKey: ["standaloneReports", patientId],
    queryFn: async () => {
      const response = await axios.get(`/api/reports/upload?patientId=${patientId}`);
      return response.data?.reports || [];
    },
    enabled: !!patientId,
    staleTime: 10 * 60 * 1000, // 10 minutes - standalone reports change rarely
    refetchOnMount: false,     // Use cached data when available
  });

  const handleBookAppointment = (lab: any) => {
    dispatch(setLabBookingData(lab));
    router.push(`/dashboard/labs/${lab.id}`);
  };

  const handleViewStandaloneAnalysis = (report: any) => {
    setSelectedStandaloneReport(report);
    setAnalysisModalOpen(true);
  };

  const handleUploadSuccess = () => {
    // Refresh both lab data and standalone reports after upload
    fetchLabData();
    fetchStandaloneReports();
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
    enabled: !!clinicId && !!profile?.id, // Only run when clinicId and profile.id exist
    staleTime: 15 * 60 * 1000,  // 15 minutes - lab packages rarely change
    refetchOnMount: false,      // Use cached data when available
  });

  const [searchPackages, setSearchPackages] = useState("");
  const [searchTests, setSearchTests] = useState("");
  const [tab, setTab] = useState<'catalog' | 'bookings'>("catalog");
  const [reportTab, setReportTab] = useState<'lab-generated' | 'manually-uploaded' | 'parameter-trends'>("lab-generated");
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [parameterTrendsOpen, setParameterTrendsOpen] = useState(false);
  const [selectedStandaloneReport, setSelectedStandaloneReport] = useState<any>(null);

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
      {/* Toggle Tabs */}
      <div className="bg-muted px-4 sm:px-8 md:px-12 lg:px-20 py-4 flex items-center justify-center">
        <div className="inline-flex border rounded-full overflow-hidden">
          <button
            className={`px-4 py-2 text-sm font-medium ${tab === 'catalog' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setTab('catalog')}
          >
            Tests & Packages
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-l ${tab === 'bookings' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setTab('bookings')}
          >
            My Bookings
          </button>
        </div>
      </div>

      {tab === 'catalog' && (
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
      </>
      )}

      {tab === 'bookings' && (
      <>
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
                Reports & Analysis
              </p>
              <div className="flex items-center gap-2 mt-5">
                <p className="text-lg">
                  View your lab reports and AI-powered analysis
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <ReportUploadButton
                patientId={Number(profile?.id)}
                onUploadSuccess={handleUploadSuccess}
                variant="default"
                size="sm"
              >
                Upload Report
              </ReportUploadButton>
            </div>
          </div>

          {/* Report Type Tabs */}
          <div className="mb-6">
            <div className="inline-flex border rounded-full overflow-hidden">
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  reportTab === 'lab-generated' 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setReportTab('lab-generated')}
              >
                Lab Generated Reports ({labData.completed.length})
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium border-l ${
                  reportTab === 'manually-uploaded' 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setReportTab('manually-uploaded')}
              >
                Manually Uploaded ({standaloneReports.length})
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium border-l ${
                  reportTab === 'parameter-trends' 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setReportTab('parameter-trends')}
              >
                Parameter Trends
              </button>
            </div>
          </div>

          {/* Lab Generated Reports Tab */}
          {reportTab === 'lab-generated' && (
            <>
              {labData.completed.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {labData.completed.map((result: any) => (
                    <LabResultCard key={result.id} result={result} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No lab-generated reports available yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Book lab tests to see your reports here.</p>
                </div>
              )}
            </>
          )}

          {/* Manually Uploaded Reports Tab */}
          {reportTab === 'manually-uploaded' && (
            <>
              {standaloneReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {standaloneReports.map((report: any) => (
                    <StandaloneReportCard 
                      key={report.id} 
                      report={report} 
                      onViewAnalysis={handleViewStandaloneAnalysis}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No manually uploaded reports yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Upload your lab reports to see AI analysis here.</p>
                </div>
              )}
            </>
          )}

          {/* Parameter Trends Tab */}
          {reportTab === 'parameter-trends' && (
            <>
              <div className="text-center py-12">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Parameter Trends</h3>
                  <p className="text-gray-600">
                    Track how your lab parameters change over time with interactive charts
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/dashboard/parameter-trends')}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
                >
                  View Parameter Trends
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      </>
      )}

      {/* Analysis Modal */}
      <UnifiedAnalysisModal
        isOpen={analysisModalOpen}
        onClose={() => {
          setAnalysisModalOpen(false);
          setSelectedStandaloneReport(null);
        }}
        patientId={String(profile?.id)}
        labReports={labData.completed}
        standaloneReports={standaloneReports}
        preSelectedStandaloneReportId={selectedStandaloneReport?.id || null}
      />

      {/* Parameter Trends Modal */}
      <ParameterTrendsModal
        isOpen={parameterTrendsOpen}
        onClose={() => setParameterTrendsOpen(false)}
        patientId={Number(profile?.id)}
      />
    </>
  );
}