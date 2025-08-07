'use client'
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { useDecryptedProfile } from "@/hooks/use-profile";

// UI Components
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CdLoader from "@/components/ui/custom/cd-loader";
import { PlanUsageMinimal } from "@/components/patients/plans/PlanUsage";
import { HealthInsightsPanel } from "@/components/admin/HealthInsightsPanel";

// Custom Components
import PatientInfoCard from "@/components/doctors/patients/PatientInfoCard";
import UpcomingAppointmentCard from "@/components/doctors/patients/UpcomingAppointmentCard";
import DietPlanRequestCard from "@/components/doctors/patients/DietPlanRequestCard";
import PrescriptionsSection from "@/components/doctors/patients/PrescriptionsSection";
import LabReportsSection from "@/components/doctors/patients/LabReportsSection";

// Icons
import {
  User, Calendar, Phone, Heart, Droplet, Activity,
  Ruler, Scale, FileText, Home, Stethoscope, Pill, Microscope,
  Clock, Utensils, AlertCircle
} from "lucide-react";

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
  // State Management
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<Plan | null>(null);
  const [doctorNotes, setDoctorNotes] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Hooks
  const router = useRouter();
  const { profile } = useDecryptedProfile();

  // Data Fetching
  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  useEffect(() => {
    const activeSub = patientDetails?.subscriptions?.find(sub => sub.isActive);
    setActiveSubscription(activeSub || null);
    
    // Initialize doctor notes with the latest appointment's notes
    if (patientDetails?.doctorAppointments?.[0]?.doctorNotes) {
      setDoctorNotes(patientDetails.doctorAppointments[0].doctorNotes);
    }
  }, [patientDetails]);

  const fetchPatientDetails = async () => {
    try {
      const response = await axios.get(`/api/doctor/patients/${patientId}`);
      setPatientDetails(response.data);
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
      toast.error("Failed to fetch patient details");
    }
  };

  const handleSaveNotes = async () => {
    if (!patientDetails?.doctorAppointments?.[0]?.id) return;
    
    setSavingNotes(true);
    try {
      await axios.put(`/api/doctor/patients/${patientId}`, {
        appointmentId: patientDetails.doctorAppointments[0].id,
        doctorNotes: doctorNotes
      });
      await fetchPatientDetails();
      toast.success("Notes saved successfully");
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const SummarySection = () => {
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
    
    // Get completed appointments (those with status COMPLETED or with prescriptions)
    const completedAppointments = patientDetails?.doctorAppointments?.filter(apt => 
      apt.status === "COMPLETED" || apt.prescriptionLink
    ) || [];
    const latestCompletedAppointment = completedAppointments[0];
    const previousCompletedAppointments = completedAppointments.slice(1) || [];

    // Get selected appointment or aggregate all previous
    const selectedAppointment = selectedAppointmentId 
      ? completedAppointments.find(apt => apt.id.toString() === selectedAppointmentId)
      : null;

    // Aggregate data from previous appointments (when no specific appointment is selected)
    const aggregatedComplaints = !selectedAppointmentId ? previousCompletedAppointments
      .map(apt => apt.complaints)
      .filter(Boolean)
      .join(", ") : "";
    
    const aggregatedMedicines = !selectedAppointmentId ? previousCompletedAppointments
      .map(apt => apt.medicines)
      .filter(Boolean)
      .join(", ") : "";

    // Mock checkups data (no backend support as requested)
    const mockCheckups = [
      { name: "HbA1c", value: "48", unit: "mmol | mol" },
      { name: "FBS", value: "100", unit: "mg | dL" },
      { name: "BP", value: "140 / 70", unit: "mm | Hg" }
    ];

    return (
      <div className="col-span-full">
        <h3 className="text-2xl font-bold text-secondary mb-6">Patient Summary</h3>
        
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {/* Latest Completed Appointment Card */}
            <Card className="w-[85%] flex-shrink-0 bg-white border-1 shadow-sm border-gray-200 rounded-lg ">
              <CardHeader className="pb-3 border-b bg-custom-mutedgreen">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg text-gray-800">Latest Completed Appointment</h4>
                  </div>
                  {latestCompletedAppointment && (
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                      {new Date(latestCompletedAppointment.date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-stone-10">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Checkups */}
                    <div className="flex justify-between">
                      <h5 className="font-semibold text-gray-800 mb-1 flex items-center gap-2"> Checkups </h5>
                      <button className="w-8 h-8 bg-secondary text-white rounded-full flex mr-10 items-center justify-center hover:bg-secondary/90 transition-colors">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                    </div>
                    <div>
    
                      <div className="space-y-3">
                        {mockCheckups.map((checkup, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 min-w-[60px]">{checkup.name}:</span>
                            <span className="bg-secondary/10 text-secondary px-2 py-1 rounded text-sm font-medium">{checkup.value}</span>
                            <span className="rounded text-sm font-medium">{checkup.unit}</span>
                            <button className="text-secondary hover:text-secondary/80">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        ))}

                      </div>
                    </div>

                    {/* All Complaints */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        All Complaints
                      </h5>
                      <div className="space-y-2">
                        {latestCompletedAppointment?.complaints ? (
                          latestCompletedAppointment.complaints.split(',').map((complaint, index) => (
                            <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="flex items-center gap-2 bg-custom-mutedgreen p-2 rounded-lg">
                                {complaint.trim()}
                                {/* Show flag icon for flagged complaints (mock logic) */}
                                {complaint.toLowerCase().includes('blood pressure') && (
                                  <svg className="h-3 w-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                  </svg>
                                )}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No complaints recorded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Notes */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        Notes
                      </h5>
                      <Textarea
                        placeholder="Doctor Notes will be displayed here"
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        className="min-h-[100px] resize-none bg-gray-50 border-gray-200"
                      />
                    </div>

                    {/* Medicines */}
                    <div>
                      <h5 className="font-bold text-gray-800 mb-3">Medicines</h5>
                      <div className="space-y-2">
                        {latestCompletedAppointment?.medicines ? (
                          latestCompletedAppointment.medicines.split(',').map((medicine, index) => (
                            <div key={index} className="text-sm text-gray-700 bg-custom-mutedgreen p-3 rounded">
                              <div className="font-semibold">{medicine.trim()}</div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No medicines prescribed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Appointments Card */}
            <Card className="w-[85%] flex-shrink-0  border-1 border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-3 border-b bg-custom-mutedgreen">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg text-gray-800">Previous Appointments</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedAppointmentId}
                      onChange={(e) => setSelectedAppointmentId(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="">All Previous Appointments</option>
                      {previousCompletedAppointments.map(apt => (
                        <option key={apt.id} value={apt.id.toString()}>
                          {new Date(apt.date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                      {selectedAppointmentId ? "1" : previousCompletedAppointments.length} appointment{selectedAppointmentId ? "" : "s"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Checkups */}
                    <div>
                    <div className="flex justify-between">
                      <h5 className="font-semibold text-gray-800 mb-1 flex items-center gap-2"> Checkups </h5>
                      <button className="w-8 h-8 bg-secondary text-white rounded-full flex mr-10 items-center justify-center hover:bg-secondary/90 transition-colors">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                    </div>
                      <div className="space-y-3">
                        {mockCheckups.map((checkup, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 min-w-[60px]">{checkup.name}:</span>
                            <span className="bg-secondary/10 text-secondary px-2 py-1 rounded text-sm font-medium">{checkup.value}</span>
                            <span className="bg-secondary/10 text-secondary px-2 py-1 rounded text-sm font-medium">{checkup.unit}</span>
                            <button className="text-secondary hover:text-secondary/80">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        ))}

                      </div>
                    </div>

                    {/* All Complaints */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3">
                        All Complaints
                      </h5>
                      <div className="space-y-2">
                        {selectedAppointment ? (
                          selectedAppointment.complaints ? (
                            selectedAppointment.complaints.split(',').map((complaint, index) => (
                              <div key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="flex items-center gap-2 bg-custom-mutedgreen p-2 rounded-lg">
                                  {complaint.trim()}
                                  {/* Show flag icon for flagged complaints (mock logic) */}
                                  {complaint.toLowerCase().includes('blood pressure') && (
                                    <svg className="h-3 w-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                  )}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No complaints recorded</p>
                          )
                        ) : (
                          <p className="text-sm text-gray-700 bg-custom-mutedgreen p-3 rounded-lg">
                            {aggregatedComplaints || "No complaints recorded"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* AI Summary */}
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-3">
                        AI Summary (Coming Soon)
                      </h5>
                      <div className="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
                        <p className="text-sm text-secondary">
                          AI-powered analysis of patient history will be available here to provide insights and trends.
                        </p>
                      </div>
                    </div>

                    {/* Medicines */}
                    <div>
                      <h5 className="font-bold text-gray-800 mb-3">Medicines</h5>
                      <div className="space-y-2">
                        {selectedAppointment ? (
                          selectedAppointment.medicines ? (
                            selectedAppointment.medicines.split(',').map((medicine, index) => (
                              <div key={index} className="text-sm text-gray-700 bg-custom-mutedgreen p-3 rounded">
                                <div className="font-semibold">{medicine.trim()}</div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No medicines prescribed</p>
                          )
                        ) : (
                          <div className="text-sm text-gray-700 bg-custom-mutedgreen p-3 rounded">
                            <div className="font-semibold">{aggregatedMedicines || "No medicines prescribed"}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center mt-4 gap-2">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Save Notes Button */}
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="bg-secondary hover:bg-secondary/90"
          >
            {savingNotes ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </div>
    );
  };

  // Loading State
  if (!patientDetails) {
    return <CdLoader />;
  }

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
        <LabReportsSection labBookings={patientDetails.labBookings} />

        {/* Health Insights */}
        <div className="col-span-full mt-6">
          <HealthInsightsPanel patientId={patientId} />
        </div>

        {/* Summary Section */}
        <div className="col-span-full mt-6">
          <SummarySection />
        </div>
      </div>
    </>
  );
};

export default DoctorPatientDetailsClient; 