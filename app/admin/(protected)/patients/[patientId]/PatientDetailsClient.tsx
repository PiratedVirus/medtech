'use client'
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { put } from "@vercel/blob";

// UI Components
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CdLoader from "@/components/ui/custom/cd-loader";
import { normalizeStatus } from "@/lib/utils/status";
import TotalEarningsCard from "@/components/admin/TotalEarningsCard";
import { PlanUsageMinimal } from "@/components/patients/plans/PlanUsage";
import { HealthInsightsPanel } from "@/components/admin/HealthInsightsPanel";
import ConsolidatedUploadModal from "@/components/pathology/ConsolidatedUploadModal";

// Icons
import {
  User, Calendar, Phone, Heart, Droplet, Activity,
  Ruler, Scale, FileText, Home
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
  payment?: Payment | null;
}

interface Payment {
  id?: number;
  amount: number;
  currency: string;
  paymentStatus: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

interface LabBooking {
  id: number;
  labPackageName: string;
  date: string;
  status: string;
  reportLink?: string[] | null;
  labResult?: string[] | null;
  payment?: Payment | null;
  reportAnalyses?: Array<{
    id: number;
    labBookingId: number;
    labResultIndex: number;
    processingStatus: string;
    processingError: string | null;
    processedAt: Date | null;
    llmSummary: string | null;
  }>;
}

interface DoctorAppointment {
  id: number;
  doctorName: string;
  date: string;
  type: string;
  status: string;
  prescriptionLink?: string | null;
  payment?: Payment | null;
}

interface DieticianAppointment {
  id: number;
  date: string;
  status: string;
  dietPlanLink?: string;
  prescriptionLink?: string | null;
  doctorName: string;
  payment?: Payment | null;
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
  dieticianAppointments: DieticianAppointment[];
}

interface PlanUsage {
  doctorConsultationDates?: string[];
  dieticianConsultationDates?: string[];
  labTestsDates?: string[];
  ophthalmologistConsultationDates?: string[];
}

interface PatientDetailsClientProps {
  patientId: string;
}

const UploadDropZone = ({
  onFileSelect,
  type,
}: {
  onFileSelect: (file: File) => Promise<void> | void;
  type?: string;
}) => (
  <div
    className="w-full h-36 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition"
    onDrop={async (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        await onFileSelect(file);
      }
    }}
    onDragOver={(e) => e.preventDefault()}
  >
    <div className="flex flex-col items-center gap-2">
      <FileText className="h-8 w-8 text-gray-500" />
      <p className="text-sm text-gray-600">Drag & drop PDF here or click below</p>
      <label className="cursor-pointer bg-muted px-3 py-1 text-sm rounded border border-gray-300 mt-2 hover:bg-primary hover:text-white transition">
        Browse file
        <input
          type="file"
          accept="application/pdf"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await onFileSelect(file);
            }
          }}
        />
      </label>
    </div>
  </div>
);

const PatientDetailsClient = ({ patientId }: PatientDetailsClientProps) => {
  // State Management
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null);
  const [uploadingAppointmentId, setUploadingAppointmentId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<Plan | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedLabBooking, setSelectedLabBooking] = useState<any>(null);
  
  // React Query for cache invalidation
  const queryClient = useQueryClient();
  
  // Hooks
  const router = useRouter();

  // Data Fetching
  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  useEffect(() => {
    const activeSub = patientDetails?.subscriptions?.find(sub => sub.isActive);
    setActiveSubscription(activeSub || null);
    if (activeSub?.id) {
      fetchPlanUsage(activeSub.id);
    }
  }, [patientDetails]);

  const fetchPatientDetails = async () => {
    try {
      const response = await axios.get(`/api/admin/optimized/dashboard/patients-details?patientId=${patientId}`);
      
      // Transform the API response to match component expectations
      const apiData = response.data;
      const transformedData = {
        id: apiData.id,
        name: apiData.name,
        email: apiData.email,
        phoneNumber: apiData.phoneNumber,
        joinedOn: apiData.createdAt, // API uses createdAt, component expects joinedOn
        subscriptions: (apiData.subscriptions || []).map((sub: any) => ({
          id: sub.subscriptionId,
          planName: sub.plan?.name || 'Unknown',
          startDate: sub.startDate,
          endDate: sub.endDate,
          isActive: sub.isActive,
          payment: sub.payments
        })),
        profile: {
          age: apiData.patientProfile?.age || 0,
          weight: apiData.patientProfile?.weight || 0,
          height: apiData.patientProfile?.height || 0,
          gender: apiData.patientProfile?.gender || 'Unknown',
          allergies: apiData.patientProfile?.allergies,
          medicalHistory: apiData.patientProfile?.medicalHistory,
          emergencyContact: apiData.patientProfile?.emergencyContact || '',
          dateOfBirth: apiData.patientProfile?.dateOfBirth,
          address: apiData.patientProfile?.address,
          profilePicture: apiData.patientProfile?.profilePicture,
          planTrackers: apiData.patientProfile?.planTrackers || []
        },
        labBookings: (apiData.labPatientBookings || []).map((booking: any) => ({
          id: booking.id,
          labPackageName: booking.labPackage?.name || 'Unknown',
          date: booking.labDate,
          status: booking.status,
          reportLink: booking.labResult,
          labResult: booking.labResult,
          payment: booking.payment,
          reportAnalyses: booking.reportAnalyses || [] // Include analysis data for progress tracking
        })),
        doctorAppointments: (apiData.doctorAppointments || []).map((appt: any) => ({
          id: appt.id,
          doctorName: appt.doctor?.name || 'Unknown',
          date: appt.doctorAvailability?.date || new Date().toISOString(),
          type: appt.consultationType,
          status: appt.status,
          prescriptionLink: appt.prescriptionLink,
          payment: appt.payment
        })),
        dieticianAppointments: (apiData.dieticianAppointments || []).map((appt: any) => ({
          id: appt.id,
          date: appt.doctorAvailability?.date || new Date().toISOString(),
          status: appt.status,
          dietPlanLink: appt.prescriptionLink, // Assuming prescriptionLink is used for diet plans too
          prescriptionLink: appt.prescriptionLink,
          doctorName: appt.doctor?.name || 'Unknown',
          payment: appt.payment
        }))
      };
      
      setPatientDetails(transformedData);
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
      setPatientDetails(null); // Set to null on error to prevent undefined access
    }
  };

  const fetchPlanUsage = async (subscriptionId: number) => {
    try {
      const res = await axios.get(`/api/plans/planUsage?subscriptionId=${subscriptionId}`);
      setPlanUsage(res?.data?.data?.subscriptionTracker || null);
    } catch (err) {
      console.error("Failed to fetch plan usage:", err);
    }
  };

  const handleUploadComplete = async () => {
    // Invalidate all relevant caches
    await queryClient.invalidateQueries({ queryKey: ['labResults'] });
    await queryClient.invalidateQueries({ queryKey: ['labResults', patientId] });
    await queryClient.invalidateQueries({ queryKey: ['labs'] });
    await queryClient.invalidateQueries({ queryKey: ['lab-analysis'] });
    await queryClient.invalidateQueries({ queryKey: ['patient-details', patientId] });
    await queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    
    // Refresh patient details from API
    await fetchPatientDetails();
    
    setUploadModalOpen(false);
    setSelectedLabBooking(null);
    
    // Force a hard refresh after a delay to ensure all components get updated data
    setTimeout(() => {
      fetchPatientDetails();
    }, 1000);
  };

  const handleFileUpload = async (
    file: File,
    appointmentId: number,
    type: "prescription" | "dietPlan"
  ) => {
    if (!file || !appointmentId) return;
    setUploading(true);
    setUploadSuccess(false);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const fileName = `appointment-${appointmentId}-${type}-${Date.now()}-${safeName}`;
      const { url } = await put(fileName, arrayBuffer, {
        access: "public",
        token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
      });

      await axios.put("/api/admin/optimized/appointments", {
        appointmentId,
        link: url,
      });

      await fetchPatientDetails();
      setUploadSuccess(true);
      toast.success(`${type === "prescription" ? "Prescription" : "Diet plan"} uploaded successfully.`);
      setTimeout(() => setUploadSuccess(false), 1500);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

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
          {patientDetails?.subscriptions && patientDetails.subscriptions.length > 0 && (
            <div className="text-lg px-3 py-1 mr-14">
              Subscribed to <span className="text-secondary"><strong>{patientDetails.subscriptions[0]?.planName || 'Unknown'}</strong></span> till{" "}
              {patientDetails.subscriptions[0]?.endDate ? new Date(patientDetails.subscriptions[0].endDate).toLocaleDateString() : 'N/A'}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {patientDetails && patientDetails.profile && [
            { icon: <Calendar className="h-4 w-4 flex-shrink-0" />, label: "Age", value: `${patientDetails.profile.age || 0} yrs` },
            { icon: <Scale className="h-4 w-4 flex-shrink-0" />, label: "Weight", value: `${patientDetails.profile.weight || 0} kg` },
            { icon: <Ruler className="h-4 w-4 flex-shrink-0" />, label: "Height", value: `${patientDetails.profile.height || 0} cm` },
            { icon: <Activity className="h-4 w-4 flex-shrink-0" />, label: "Gender", value: patientDetails.profile.gender || 'Unknown' },
            { icon: <Home className="h-4 w-4 flex-shrink-0" />, label: "Address", value: patientDetails.profile.address || "N/A" },
            {
              icon: <Calendar className="h-4 w-4 flex-shrink-0" />,
              label: "Date of Birth",
              value: patientDetails.profile.dateOfBirth ? new Date(patientDetails.profile.dateOfBirth).toLocaleDateString() : 'N/A'
            },
            { icon: <Phone className="h-4 w-4 flex-shrink-0" />, label: "Mobile", value: patientDetails.phoneNumber || "N/A" },
            { icon: <Droplet className="h-4 w-4 flex-shrink-0" />, label: "Allergies", value: patientDetails.profile.allergies || 'None' },
            { icon: <Heart className="h-4 w-4 flex-shrink-0" />, label: "Medical History", value: patientDetails.profile.medicalHistory || 'N/A' },
            { icon: <Phone className="h-4 w-4 flex-shrink-0" />, label: "Emergency Contact", value: patientDetails.profile.emergencyContact || 'N/A' },
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

  const AppointmentDatesSection = () => {
    const sections = [
      { label: "Doctor Consultations", dates: planUsage?.doctorConsultationDates || [] },
      { label: "Dietician Consultations", dates: planUsage?.dieticianConsultationDates || [] },
      { label: "Lab Tests", dates: planUsage?.labTestsDates || [] },
      { label: "Ophthalmologist Consultations", dates: planUsage?.ophthalmologistConsultationDates || [] },
    ];

    return (
      <div className="col-span-full grid grid-cols-4 gap-2">
        {sections.map(section => (
          <Card key={section.label} className="rounded-lg p-3 bg-slate-50 text-center">
            <h4 className="font-semibold mb-3">{section.label}</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {section.dates.map(date => (
                <span
                  key={date}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-custom-mutedgreen text-sm"
                >
                  {new Date(date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "2-digit",
                  })}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const LabReportsSection = () => {
    const labBookings = patientDetails?.labBookings || [];
    
    return (
      <Card className="rounded-lg p-4 bg-custom-mutedgreen">
        <h3 className="font-semibold text-xl mb-4">Lab Reports</h3>
        {labBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 opacity-20">
              <FileText className="h-16 w-16 text-gray-500" />
            </div>
            <p className="text-gray-600 font-medium">No lab reports available</p>
            <p className="text-sm text-gray-500 mt-1">Lab reports will appear here once they are uploaded.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {labBookings.map(labBooking => (
              <Card
                key={labBooking.id}
                className="group relative overflow-hidden border border-gray-100 bg-stone-50 shadow-sm transition-all duration-300 rounded-lg p-4 w-36 h-48 flex flex-col items-center text-center"
              >
                <div className="absolute -right-4 -top-4 h-24 w-24 opacity-5">
                  <FileText className="h-full w-full" />
                </div>
                <h4 className="font-medium mb-2"><b>{labBooking.labPackageName || 'Unknown Package'}</b></h4>
                <p className="text-sm mb-4">Booked on {labBooking.date ? new Date(labBooking.date).toLocaleDateString() : 'Unknown Date'}</p>
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
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedLabBooking({
                          id: labBooking.id,
                          labPackageName: labBooking.labPackageName,
                          labResult: labBooking.labResult || []
                        });
                        setUploadModalOpen(true);
                      }}
                    >
                      Upload Report
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    );
  };

  const AppointmentPrescriptionsSection = () => {
    const appointments = patientDetails?.doctorAppointments || [];
    
    return (
      <Card className="rounded-lg p-4 bg-custom-mutedgreen">
        <h3 className="font-semibold text-xl mb-4">Appointment Prescriptions</h3>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 opacity-20">
              <FileText className="h-16 w-16 text-gray-500" />
            </div>
            <p className="text-gray-600 font-medium">No prescriptions available</p>
            <p className="text-sm text-gray-500 mt-1">Prescriptions will appear here once they are uploaded.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {appointments.map(appointment => (
              <Card key={appointment.id}
                className="group relative overflow-hidden border border-gray-100 bg-stone-50 shadow-sm transition-all duration-300 rounded-lg p-4 w-36 h-48 flex flex-col items-center text-center">
                <Badge variant="outline" className="mb-2 text-secondary">
                  # {appointment.id}
                </Badge>
                <h4 className="font-medium mb-2">{appointment.doctorName || 'Unknown Doctor'}</h4>
                <p className="text-sm mb-2">
                  Date: {appointment.date ? new Date(appointment.date).toLocaleDateString('en-GB') : 'Unknown Date'}
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setUploadingAppointmentId(appointment.id)}>
                          Upload Prescription
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>Upload Prescription PDF</DialogTitle>
                        <UploadDropZone
                          onFileSelect={async (file) => {
                            if (!uploadingAppointmentId) {
                              toast.error("Please select an appointment first.");
                              return;
                            }
                            await handleFileUpload(file, uploadingAppointmentId, "prescription");
                          }}
                        />
                        {uploading && <p>Uploading...</p>}
                        {uploadSuccess && (
                          <p className="text-green-600 text-sm text-center mt-2">Upload successful!</p>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    );
  };

  const DietPlansSection = () => {
    const appointments = patientDetails?.dieticianAppointments || [];
    
    return (
      <Card className="rounded-lg p-4 bg-slate-50">
        <h3 className="font-semibold text-xl mb-4">Diet Plans</h3>
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 opacity-20">
              <FileText className="h-16 w-16 text-gray-500" />
            </div>
            <p className="text-gray-600 font-medium">No diet plans available</p>
            <p className="text-sm text-gray-500 mt-1">Diet plans will appear here once they are uploaded.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {appointments.map(appointment => (
              <Card key={appointment.id}
                className="group relative overflow-hidden border border-gray-100 bg-custom-mutedgreen shadow-sm transition-all duration-300 rounded-lg p-4 w-36 h-48 flex flex-col items-center text-center">
                <Badge variant="outline" className="mb-2 text-primary bg-neutral-50">
                  # {appointment.id}
                </Badge>
                <h4 className="font-medium mb-2">{appointment.doctorName}</h4>
                <p className="text-sm mb-2">
                  Date: {new Date(appointment.date).toLocaleDateString('en-GB')}
                </p>
                <div className="mt-auto flex flex-col items-center gap-2">
                  {appointment.dietPlanLink ? (
                    <a
                      href={appointment.dietPlanLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">View</Button>
                    </a>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setUploadingAppointmentId(appointment.id)}>
                          Upload Diet Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogTitle>Upload Diet Plan PDF</DialogTitle>
                        <UploadDropZone
                          onFileSelect={async (file) => {
                            if (!uploadingAppointmentId) {
                              toast.error("Please select an appointment first.");
                              return;
                            }
                            await handleFileUpload(file, uploadingAppointmentId, "dietPlan");
                          }}
                        />
                        {uploading && <p>Uploading...</p>}
                        {uploadSuccess && (
                          <p className="text-green-600 text-sm text-center mt-2">Upload successful!</p>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    );
  };

  // Manual payment collection handler
  const handleCollectPayment = async (paymentId: number) => {
    try {
      await axios.put("/api/admin/optimized/dashboard/patients-details", { paymentId });
      
      // Invalidate caches to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['patient-details', patientId] });
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      
      await fetchPatientDetails();
      toast.success("Payment marked as PAID.");
    } catch (err) {
      console.error("Payment update failed", err);
      toast.error("Failed to collect payment.");
    }
  };

  const PaymentHistorySection = () => (
    <div className="rounded-lg p-4 bg-slate-50">
      <h3 className="font-semibold mb-2">Payment History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-sm text-left">
          <thead className="bg-muted text-secondary font-semibold">
            <tr>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Reference</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Method</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {/* Appointment Payments */}
            {(patientDetails?.doctorAppointments || []).map(appointment => (
              appointment.payment ? (
                <tr key={`appointment-${appointment.id}`} className="border-b">
                  <td className="px-4 py-2">Appointment</td>
                  <td className="px-4 py-2">{appointment.doctorName}</td>
                  <td className="px-4 py-2">{appointment.payment.currency} {(appointment.payment.amount / 100)}</td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    {normalizeStatus(appointment.payment.paymentStatus) === "PENDING" ? (
                      <>
                        <Badge variant="destructive">Pending</Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">Collect</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogTitle>Confirm Payment Collection</DialogTitle>
                            <p>Are you sure you want to mark this payment as PAID?</p>
                            <div className="mt-4 flex justify-end gap-2">
                              <Button variant="outline" onClick={() => handleCollectPayment((appointment as any).payment.id!)}>
                                Confirm
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      <span>Paid</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{appointment.payment.razorpayPaymentId ? "Online" : "Offline"}</td>
                  <td className="px-4 py-2">{new Date(appointment.payment.createdAt).toLocaleDateString()}</td>
                </tr>
              ) : null
            ))}

            {/* Lab Bookings Payments */}
            {(patientDetails?.labBookings || []).map(labBooking => (
              labBooking.payment ? (
                <tr key={`lab-${labBooking.id}`} className="border-b">
                  <td className="px-4 py-2">Lab Booking</td>
                  <td className="px-4 py-2">{labBooking.labPackageName}</td>
                  <td className="px-4 py-2">{labBooking.payment?.currency ?? 'INR'} {(labBooking.payment?.amount ?? 0) / 100}</td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    {normalizeStatus(labBooking.payment.paymentStatus) === "PENDING" ? (
                      <>
                        <Badge variant="destructive">Pending</Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant={"ghost"} className="text-secondary" size="sm">Collect</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogTitle>Confirm Payment Collection</DialogTitle>
                            <p>Are you sure you want to mark this payment as PAID?</p>
                            <div className="mt-4 flex justify-end gap-2">
                              <Button variant="outline" onClick={() => handleCollectPayment((labBooking as any).payment.id!)}>
                                Confirm
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    ) : (
                      <span>Paid</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{labBooking.payment.razorpayPaymentId ? "Online" : "Offline"}</td>
                  <td className="px-4 py-2">{new Date(labBooking.date).toLocaleDateString()}</td>
                </tr>
              ) : null
            ))}

            {/* Subscription Payments */}
            {(patientDetails?.subscriptions || []).map(plan => (
              <tr key={`plan-${plan.id}`} className="border-b">
                <td className="px-4 py-2">Subscription</td>
                <td className="px-4 py-2">{plan.planName}</td>
                <td className="px-4 py-2">{plan.payment?.currency ?? 'INR'} {(plan.payment?.amount ?? 0) / 100}</td>
                <td className="px-4 py-2 flex items-center gap-2">
                  {normalizeStatus(plan.payment?.paymentStatus) === "PENDING" ? (
                    <>
                      <Badge variant="destructive">Pending</Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant={"ghost"} className="text-secondary" size="sm">Collect</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogTitle>Confirm Payment Collection</DialogTitle>
                          <p>Are you sure you want to mark this payment as PAID?</p>
                          <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => handleCollectPayment((plan as any).payment!.id!)}>
                              Confirm
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <span>Paid</span>
                  )}
                </td>
                <td className="px-4 py-2">Online</td>
                <td className="px-4 py-2">{new Date(plan.endDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Loading State
  if (!patientDetails) {
    return <CdLoader />;
  }

  // Main Render
  return (
    <>
      <ToastContainer />
      {/* Upload Modal - Same component used by pathology */}
      {selectedLabBooking && (
        <ConsolidatedUploadModal
          isOpen={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedLabBooking(null);
          }}
          booking={{
            id: selectedLabBooking.id,
            labPackageName: selectedLabBooking.labPackageName,
            labBooking: {
              labResult: selectedLabBooking.labResult
            }
          }}
          patientName={patientDetails?.name || 'Patient'}
          onUploadComplete={handleUploadComplete}
        />
      )}
      <div className="container mx-auto p-4">
        {/* Dashboard Grid */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Patient Info */}
          <ProfileInfoCard />

          {/* Plan Usage */}
          <div className="col-span-1">
            <PlanUsageMinimal
              userId={Number(patientDetails.id)}
              subscriptionId={activeSubscription?.id}
            />
          </div>

          {/* Earnings Card */}
          <TotalEarningsCard
            patientDetails={{
              doctorAppointments: patientDetails.doctorAppointments
                .filter(a => a.payment?.paymentStatus?.toUpperCase() === "PAID")
                .map(a => ({ payment: { amount: a.payment!.amount } })),
              plans: patientDetails.subscriptions
                .filter(p => p.payment?.paymentStatus?.toUpperCase() === "PAID")
                .map(p => ({ amount: p.payment!.amount })),
              labBookings: patientDetails.labBookings
                .filter(lb => lb.payment?.paymentStatus?.toUpperCase() === "PAID")
                .map(lb => ({ payment: { amount: lb.payment!.amount } })),
            }}
          />

          {/* Appointment Dates - Only show if patient is subscribed */}
          {activeSubscription && <AppointmentDatesSection />}

          {/* Lab Reports */}
          <LabReportsSection />

          {/* Appointment Prescriptions */}
          <AppointmentPrescriptionsSection />

          {/* Diet Plans */}
          <DietPlansSection />

          {/* Payment History */}
          <PaymentHistorySection />

          {/* Health Insights */}
          <div className="col-span-full">
            <HealthInsightsPanel patientId={patientId} />
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientDetailsClient;
