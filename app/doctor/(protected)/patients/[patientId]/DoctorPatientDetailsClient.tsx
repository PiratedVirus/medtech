'use client'
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { useDecryptedProfile } from "@/hooks/use-profile";

// UI Components
import CdLoader from "@/components/ui/custom/cd-loader";
import { HealthInsightsPanel } from "@/components/admin/HealthInsightsPanel";

// Custom Components
import PatientInfoCard from "@/components/doctors/patients/PatientInfoCard";
import UpcomingAppointmentCard from "@/components/doctors/patients/UpcomingAppointmentCard";
import DietPlanRequestCard from "@/components/doctors/patients/DietPlanRequestCard";
import PrescriptionsSection from "@/components/doctors/patients/PrescriptionsSection";
import LabReportsSection from "@/components/doctors/patients/LabReportsSection";
import LabReportsRow from "@/components/doctors/patients/LabReportsRow";
import HealthToolsRow from "@/components/doctors/patients/HealthToolsRow";
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
  const { profile } = useDecryptedProfile();

  // Mock data for pills and AI summary
  const [patientPills, setPatientPills] = useState([
    { id: "1", key: "Blood Pressure", value: "140/90 mmHg" },
    { id: "2", key: "Blood Sugar", value: "120 mg/dL" },
    { id: "3", key: "Weight", value: "75 kg" },
    { id: "4", key: "BMI", value: "24.5" },
    { id: "5", key: "Heart Rate", value: "72 bpm" }
  ]);

  const aiSummary = `Patient John Doe, a 45-year-old male with a history of type 2 diabetes and hypertension, presents with well-controlled chronic conditions. Recent lab results show HbA1c at 6.2%, indicating good glycemic control. Blood pressure readings average 140/90 mmHg, slightly elevated but within acceptable range for this patient's risk profile. Weight has remained stable at 75 kg with a BMI of 24.5, indicating healthy body composition. Lipid panel reveals total cholesterol of 180 mg/dL with LDL at 100 mg/dL, both within target ranges. Renal function tests show normal creatinine levels at 0.9 mg/dL with an eGFR of 85 mL/min/1.73m². The patient demonstrates good medication adherence and lifestyle modifications, including regular exercise and dietary compliance. No significant complications of diabetes are noted, with normal fundoscopic examination and intact peripheral pulses. Current treatment regimen includes metformin 500mg twice daily and lisinopril 10mg daily, both well-tolerated. The patient reports good energy levels and no new symptoms. Overall, this represents a stable clinical picture with well-managed chronic conditions and no immediate concerns requiring intervention.`;

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/doctor/patients/${patientId}`);
      setPatientDetails(response.data);
      setDoctorNotes(response.data.doctorNotes || "");
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
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleEditPill = (pillId: string) => {
    // TODO: Implement edit functionality when backend is ready
    console.log("Edit pill:", pillId);
    toast.info("Edit functionality will be available soon");
  };

  const handleAddPill = () => {
    // TODO: Implement add functionality when backend is ready
    console.log("Add new pill");
    toast.info("Add functionality will be available soon");
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
        <div className="grid gap-4 grid-cols-12 mb-6">
          {/* First 6 columns (2+2+2) */}
          <PatientInfoCard patient={{
            ...patientDetails,
            subscriptions: patientDetails.subscriptions
          }} />
          <UpcomingAppointmentCard appointments={patientDetails.doctorAppointments} />
          <DietPlanRequestCard patient={patientDetails} />

          {/* Next 6 columns */}
          <PrescriptionsSection appointments={patientDetails.doctorAppointments} patientName={patientDetails.name} />
        </div>

        {/* Lab Reports Section */}


                  {/* Pills and AI Summary Section */}
          <div className="mt-6">
            <PatientPillsRow pills={patientPills} onEditPill={handleEditPill} onAddPill={handleAddPill} />
          </div>
          <div className="mt-1">
            <PatientAISummaryRow summary={aiSummary} />
          </div>

        {/* Summary Section */}
        <div className="mt-6">
        <PatientSummarySection
          latestCompletedAppointment={latestCompletedAppointment}
          previousCompletedAppointments={previousCompletedAppointments}
          doctorNotes={doctorNotes}
          onNotesChange={setDoctorNotes}
          onSaveNotes={handleSaveNotes}
          savingNotes={savingNotes}
        />
        </div>
        <div className="grid gap-4 grid-cols-12 mt-6">
          <LabReportsRow labBookings={patientDetails.labBookings} />
          <HealthToolsRow />
        </div>


        {/* Health Insights */}
        {/* <div className="col-span-full mt-6">
          <HealthInsightsPanel patientId={patientId} />
        </div> */}
      </div>
    </>
  );
};

export default DoctorPatientDetailsClient; 