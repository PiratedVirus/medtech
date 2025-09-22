'use client'
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";

// UI Components
import CdLoader from "@/components/ui/custom/cd-loader";
import { HealthInsightsPanel } from "@/components/admin/HealthInsightsPanel";

// Custom Components
import PatientInfoCard from "@/components/doctors/patients/PatientInfoCard";
import UpcomingAppointmentCard from "@/components/doctors/patients/UpcomingAppointmentCard";
import DietPlanRequestCard from "@/components/doctors/patients/DietPlanRequestCard";
import PrescriptionsSection from "@/components/doctors/patients/PrescriptionsSection";
import LabReportsSection from "@/components/doctors/patients/LabReportsSection";
import PastAppointmentRow from "@/components/doctors/patients/PastAppointmentRow";
import UnifiedAnalysisModal from "@/components/common/UnifiedAnalysisModal";
import HealthToolsRow from "@/components/doctors/patients/HealthToolsRow";
import PatientInsightsModal from "@/components/doctors/patients/PatientInsightsModal";
import PatientSummarySection from "@/components/doctors/patients/PatientSummarySection";
import PatientPillsRow from "@/components/doctors/patients/PatientPillsRow";
import PatientAISummaryRow from "@/components/doctors/patients/PatientAISummaryRow";

// Type Definitions
interface PatientProfile {
  age: number;
  weight: number;
  height: number;
  gender: string;
  allergies?: string;
  medicalHistory?: string;
  emergencyContact: string;
  dateOfBirth?: string;
  address?: string;
  profilePicture?: string | null;
  planTrackers: {
    subscriptionId: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    plan: {
      id: number;
      name: string;
    };
  }[];
}

interface Plan {
  id: number;
  planName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface LabBooking {
  id: number;
  labPackageName: string;
  date: string;
  status: string;
  reportLink?: string[] | null;
  labResult?: string[] | null;
}

interface DoctorAppointment {
  id: number;
  doctorName: string;
  date: string;
  type: string;
  status: string;
  prescriptionLink?: string | null;
  complaints?: string;
  medicines?: string;
  tests?: string;
  doctorNotes?: string;
}

interface PatientDetails {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | number;
  joinedOn: string;
  subscriptions: Plan[];
  profile: PatientProfile;
  labBookings: LabBooking[];
  doctorAppointments: DoctorAppointment[];
}

interface DoctorPatientDetailsClientProps {
  patientId: string;
}

const DoctorPatientDetailsClient = ({ patientId }: DoctorPatientDetailsClientProps) => {
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [standaloneReports, setStandaloneReports] = useState<any[]>([]);
  const { profile } = useDecryptedProfile();
  const isDietician = profile?.role === 'DIETICIAN' || profile?.role === 'DIETICIAN_ADMIN' || profile?.role === 'NUTRITIONIST';

  const aiSummary = `Patient John Doe, a 45-year-old male with a history of type 2 diabetes and hypertension, presents with well-controlled chronic conditions. Recent lab results show HbA1c at 6.2%, indicating good glycemic control. Blood pressure readings average 140/90 mmHg, slightly elevated but within acceptable range for this patient's risk profile. Weight has remained stable at 75 kg with a BMI of 24.5, indicating healthy body composition. Lipid panel reveals total cholesterol of 180 mg/dL with LDL at 100 mg/dL, both within target ranges. Renal function tests show normal creatinine levels at 0.9 mg/dL with an eGFR of 85 mL/min/1.73m². The patient demonstrates good medication adherence and lifestyle modifications, including regular exercise and dietary compliance. No significant complications of diabetes are noted, with normal fundoscopic examination and intact peripheral pulses. Current treatment regimen includes metformin 500mg twice daily and lisinopril 10mg daily, both well-tolerated. The patient reports good energy levels and no new symptoms. Overall, this represents a stable clinical picture with well-managed chronic conditions and no immediate concerns requiring intervention.`;

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  // Fetch standalone reports for the patient
  useEffect(() => {
    if (patientId) {
      fetchStandaloneReports();
    }
  }, [patientId]);

  const fetchStandaloneReports = async () => {
    try {
      const response = await fetch(`/api/reports/upload?patientId=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStandaloneReports(data.reports);
        }
      }
    } catch (error) {
      console.error('Failed to fetch standalone reports:', error);
    }
  };

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/doctor/patients/${patientId}`);
      const data = response.data;
      setPatientDetails(data);
      // Initialize notes from the latest completed appointment
      const completed = (data?.doctorAppointments || []).filter(
        (apt: any) => apt.status === "COMPLETED" || apt.prescriptionLink
      );
      const latest = completed[0];
      setDoctorNotes(latest?.doctorNotes || "");
    } catch (error) {
      console.error("Error fetching patient details:", error);
      toast.error("Failed to fetch patient details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await axios.post(`/api/doctor/patients/${patientId}/notes`, {
        notes: doctorNotes
      });
      toast.success("Notes saved successfully");
      // Refresh to fetch updated notes on the appointment
      await fetchPatientDetails();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  // Loading State
  if (!patientDetails) {
    return <CdLoader />;
  }

  // Get completed appointments for summary section
  const completedAppointments = patientDetails?.doctorAppointments?.filter(apt =>
    apt.status === "COMPLETED" || apt.prescriptionLink
  ) || [];
  const latestCompletedAppointment = completedAppointments[0];
  const previousCompletedAppointments = completedAppointments.slice(1) || [];

  // Main Render
  return (
    <>
      <ToastContainer />
      <div className="container mx-auto p-4">
        {/* Top Row - 12 columns layout */}
        <div className="grid gap-4 grid-cols-12 mb-6 items-stretch">
          {/* Patient info - always 2 cols */}
          <div className="col-span-2 h-full">
            <PatientInfoCard patient={{
              ...patientDetails,
              subscriptions: patientDetails.subscriptions
            }} />
          </div>

          {/* Upcoming appointments - 2 cols normally, 4 cols when diet card hidden */}
          <div className={isDietician ? "col-span-2 h-full" : "col-span-4 h-full"}>
            <UpcomingAppointmentCard appointments={patientDetails.doctorAppointments} patientName={patientDetails.name} />
          </div>

          {/* Diet plan - 2 cols only for dieticians */}
          {isDietician && (
            <div className="col-span-2 h-full">
              <DietPlanRequestCard patient={patientDetails} />
            </div>
          )}

          {/* Prescriptions - 3 cols */}
          <div className="col-span-3 h-full">
            <PrescriptionsSection appointments={patientDetails.doctorAppointments} patientName={patientDetails.name} />
          </div>

          {/* Lab Reports - 3 cols */}
          <div className="col-span-3 h-full">
            <LabReportsSection 
              labBookings={patientDetails.labBookings} 
              patientId={patientId}
              onViewMore={() => setModalOpen(true)}
            />
          </div>
        </div>
        {/* Patient Summary + Metrics Row */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold text-secondary">Patient Summary</h3>
            <div className="flex-1" />
            <div className="max-w-[65%] w-full">
              <PatientPillsRow userIdOverride={Number(patientId)} inline />
            </div>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="mt-2">
          <PatientAISummaryRow patientId={Number(patientId)} summary={aiSummary} />
        </div>


        {/* Summary Section */}
        <div className="mt-6">

          <PatientSummarySection
            patientId={patientId}
            latestCompletedAppointment={latestCompletedAppointment}
            previousCompletedAppointments={previousCompletedAppointments}
            doctorNotes={doctorNotes}
            onNotesChange={setDoctorNotes}
            onSaveNotes={handleSaveNotes}
            savingNotes={savingNotes}
          />
        </div>
        <div className="grid gap-4 grid-cols-12 mt-6">
          <PastAppointmentRow appointments={patientDetails.doctorAppointments} patientId={patientId} />
          <HealthToolsRow onOpenInsights={() => setInsightsOpen(true)} />
        </div>

        {/* Health Insights */}
        {/* <div className="col-span-full mt-6">
          <HealthInsightsPanel patientId={patientId} />
        </div> */}
        
        {/* Lab Report Analysis Modal */}
        <UnifiedAnalysisModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          patientId={patientId}
          labReports={patientDetails.labBookings}
          standaloneReports={standaloneReports}
          preSelectedStandaloneReportId={null}
        />

        {/* Patient Insights Modal (Full insights reused from dashboard) */}
        <PatientInsightsModal
          isOpen={insightsOpen}
          onClose={() => setInsightsOpen(false)}
          patientId={Number(patientId)}
        />
      </div>
    </>
  );
};

export default DoctorPatientDetailsClient; 