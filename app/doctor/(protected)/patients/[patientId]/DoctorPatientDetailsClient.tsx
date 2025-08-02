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
import CdLoader from "@/components/ui/custom/cd-loader";
import { PlanUsageMinimal } from "@/components/patients/plans/PlanUsage";
import { HealthInsightsPanel } from "@/components/admin/HealthInsightsPanel";

// Icons
import {
  User, Calendar, Phone, Heart, Droplet, Activity,
  Ruler, Scale, FileText, Home, Stethoscope, Pill, Microscope
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

  // UI Components
  const ProfileInfoCard = () => (
    <Card className="col-span-full relative overflow-hidden rounded-lg bg-slate-50 text-gray-700 p-6">
      {/* Background icon */}
      <div className="absolute -right-10 -top-6 opacity-10">
        <User size={200} />
      </div>
      {/* Content */}
      <div className="relative space-y-4">
        <div className="flex justify-between items-center my-4">
          <div>
            <h2 className="text-3xl text-secondary font-bold">{patientDetails?.name}</h2>
            <p className="text-gray-600">
              Member since <b>{new Date(patientDetails?.joinedOn || '').toLocaleDateString()}</b>
            </p>
          </div>
          {(patientDetails?.subscriptions ?? []).length > 0 && (
            <div className="text-lg px-3 py-1 mr-14">
              Subscribed to <span className="text-secondary"><strong>{patientDetails?.subscriptions[0].planName}</strong></span> till{" "}
              {patientDetails?.subscriptions?.[0]?.endDate ? new Date(patientDetails.subscriptions[0].endDate).toLocaleDateString() : 'N/A'}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {patientDetails && [
            { icon: <Calendar className="h-4 w-4 flex-shrink-0" />, label: "Age", value: `${patientDetails.profile.age} yrs` },
            { icon: <Scale className="h-4 w-4 flex-shrink-0" />, label: "Weight", value: `${patientDetails.profile.weight} kg` },
            { icon: <Ruler className="h-4 w-4 flex-shrink-0" />, label: "Height", value: `${patientDetails.profile.height} cm` },
            { icon: <Activity className="h-4 w-4 flex-shrink-0" />, label: "Gender", value: patientDetails.profile.gender },
            { icon: <Home className="h-4 w-4 flex-shrink-0" />, label: "Address", value: patientDetails.profile.address || "N/A" },
            {
              icon: <Calendar className="h-4 w-4 flex-shrink-0" />,
              label: "Date of Birth",
              value: patientDetails.profile.dateOfBirth ? new Date(patientDetails.profile.dateOfBirth).toLocaleDateString() : 'N/A'
            },
            { icon: <Phone className="h-4 w-4 flex-shrink-0" />, label: "Mobile", value: patientDetails.phoneNumber || "N/A" },
            { icon: <Droplet className="h-4 w-4 flex-shrink-0" />, label: "Allergies", value: patientDetails.profile.allergies || 'None' },
            { icon: <Heart className="h-4 w-4 flex-shrink-0" />, label: "Medical History", value: patientDetails.profile.medicalHistory || 'N/A' },
            { icon: <Phone className="h-4 w-4 flex-shrink-0" />, label: "Emergency Contact", value: patientDetails.profile.emergencyContact },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 rounded-full bg-custom-mutedgreen px-3 py-2 text-sm">
              {item.icon}
              <span className="text-xs">{item.label}:</span>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const LabReportsSection = () => (
    <Card className="rounded-lg p-4 bg-custom-mutedgreen">
      <h3 className="font-semibold text-xl mb-4">Lab Reports</h3>
      <div className="flex flex-wrap gap-4">
        {patientDetails?.labBookings.map(labBooking => (
          <Card
            key={labBooking.id}
            className="group relative overflow-hidden border border-gray-100 bg-stone-50 shadow-sm transition-all duration-300 rounded-lg p-4 w-36 h-48 flex flex-col items-center text-center"
          >
            <div className="absolute -right-4 -top-4 h-24 w-24 opacity-5">
              <FileText className="h-full w-full" />
            </div>
            <h4 className="font-medium mb-2"><b>{labBooking.labPackageName}</b></h4>
            <p className="text-sm mb-4">Booked on {new Date(labBooking.date).toLocaleDateString()}</p>
            <div className="mt-auto flex items-center justify-between">
              {Array.isArray(labBooking.reportLink) && labBooking.reportLink.length > 0 ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant={"outline"} size="sm">View Reports</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Lab Reports</DialogTitle>
                    <div className="flex flex-wrap gap-2">
                      {labBooking.reportLink.map((url, index) => {
                        const fileName = decodeURIComponent(url.split("/").pop() || `LabReport-${index + 1}`);
                        return (
                          <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="whitespace-nowrap">{fileName}</Button>
                          </a>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <span className="text-gray-500 text-sm">No reports</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );

  const AppointmentPrescriptionsSection = () => (
    <Card className="rounded-lg p-4 bg-custom-mutedgreen">
      <h3 className="font-semibold text-xl mb-4">Appointment Prescriptions</h3>
      <div className="flex flex-wrap gap-4">
        {patientDetails?.doctorAppointments.map(appointment => (
          <Card key={appointment.id}
            className="group relative overflow-hidden border border-gray-100 bg-stone-50 shadow-sm transition-all duration-300 rounded-lg p-4 w-36 h-48 flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-2 text-secondary">
              # {appointment.id}
            </Badge>
            <h4 className="font-medium mb-2">{appointment.doctorName}</h4>
            <p className="text-sm mb-2">
              Date: {new Date(appointment.date).toLocaleDateString('en-GB')}
            </p>
            <div className="mt-auto flex flex-col items-center gap-2">
              {appointment.prescriptionLink ? (
                <a
                  href={appointment.prescriptionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">View</Button>
                </a>
              ) : (
                <span className="text-gray-500 text-sm">No prescription</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );

  const SummarySection = () => {
    const latestAppointment = patientDetails?.doctorAppointments?.[0];
    const previousAppointments = patientDetails?.doctorAppointments?.slice(1) || [];

    // Aggregate data from previous appointments
    const aggregatedComplaints = previousAppointments
      .map(apt => apt.complaints)
      .filter(Boolean)
      .join(", ");
    
    const aggregatedMedicines = previousAppointments
      .map(apt => apt.medicines)
      .filter(Boolean)
      .join(", ");
    
    const aggregatedTests = previousAppointments
      .map(apt => apt.tests)
      .filter(Boolean)
      .join(", ");

    return (
      <div className="col-span-full">
        <h3 className="text-2xl font-bold text-secondary mb-6">Patient Summary</h3>
        
        <div className="flex gap-6 overflow-x-auto pb-4">
          {/* Latest Appointment Card */}
          <Card className="min-w-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-lg text-blue-800">Latest Appointment</h4>
                {latestAppointment && (
                  <Badge variant="outline" className="ml-auto">
                    {new Date(latestAppointment.date).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestAppointment ? (
                <>
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Complaints
                    </h5>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                      {latestAppointment.complaints || "No complaints recorded"}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Medicines
                    </h5>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                      {latestAppointment.medicines || "No medicines prescribed"}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                      <Microscope className="h-4 w-4" />
                      Tests
                    </h5>
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                      {latestAppointment.tests || "No tests ordered"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">No appointments found</p>
              )}
            </CardContent>
          </Card>

          {/* Aggregated Previous Appointments Card */}
          <Card className="min-w-[400px] bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-lg text-green-800">Previous Appointments Summary</h4>
                <Badge variant="outline" className="ml-auto">
                  {previousAppointments.length} appointments
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  All Complaints
                </h5>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                  {aggregatedComplaints || "No complaints recorded"}
                </p>
              </div>
              
              <div>
                <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  All Medicines
                </h5>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                  {aggregatedMedicines || "No medicines prescribed"}
                </p>
              </div>
              
              <div>
                <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                  <Microscope className="h-4 w-4" />
                  All Tests
                </h5>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                  {aggregatedTests || "No tests ordered"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Notes Section */}
        <Card className="mt-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardHeader>
            <h4 className="font-semibold text-lg text-purple-800">Personal Notes</h4>
            <p className="text-sm text-purple-600">Add or update your personal notes about this patient</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your personal notes about this patient..."
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>
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
        {/* Dashboard Grid */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Patient Info */}
          <ProfileInfoCard />

          {/* Lab Reports */}
          <LabReportsSection />

          {/* Appointment Prescriptions */}
          <AppointmentPrescriptionsSection />

          {/* Health Insights */}
          <div className="col-span-full">
            <HealthInsightsPanel patientId={patientId} />
          </div>

          {/* Summary Section */}
          <SummarySection />
        </div>
      </div>
    </>
  );
};

export default DoctorPatientDetailsClient; 