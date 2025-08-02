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
        {patientDetails?.doctorAppointments?.filter(apt => 
          apt.status === "COMPLETED" || apt.prescriptionLink
        ).map(appointment => (
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

  const UpcomingAppointmentsSection = () => (
    <Card className="rounded-lg p-4 bg-custom-mutedgreen">
      <h3 className="font-semibold text-xl mb-4">Upcoming Appointments</h3>
      <div className="flex flex-wrap gap-4">
        {patientDetails?.doctorAppointments?.filter(apt => 
          apt.status === "Scheduled" && new Date(apt.date) > new Date()
        ).map(appointment => (
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
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                {appointment.type}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );

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

          {/* Upcoming Appointments */}
          <UpcomingAppointmentsSection />
        </div>
      </div>
    </>
  );
};

export default DoctorPatientDetailsClient; 