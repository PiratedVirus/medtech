'use client'
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { put } from "@vercel/blob";
import axios from "axios";

// UI Components
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CdLoader from "@/components/ui/custom/cd-loader";
import TotalEarningsCard from "@/components/admin/TotalEarningsCard";
import { PlanUsageMinimal } from "@/components/patients/plans/PlanUsage";

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
  payment?: Payment | null; // Added payment property
}

interface Payment {
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
  reportLink?: string | null;
  payment?: Payment | null;

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

const PatientDetailsPage = () => {
  // State Management
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null);
  const [uploadingAppointmentId, setUploadingAppointmentId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<Plan | null>(null);

  // Hooks
  const router = useRouter();
  const { patientId } = useParams();

  // Data Fetching
  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

useEffect(() => {
  const activeSubscription = patientDetails?.subscriptions?.find(sub => sub.isActive);
  setActiveSubscription(activeSubscription || null);
  if (activeSubscription?.id) {
    console.log("Fetching plan usage for subscription ID:", activeSubscription.id);
    fetchPlanUsage(activeSubscription.id);
  }
}, [patientDetails]);

  const fetchPatientDetails = async () => {
    try {
      const response = await axios.get(`/api/admin/dashboard/patients-details?patientId=${patientId}`);
      setPatientDetails(response.data);
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
    }
  };

  const fetchPlanUsage = async (subscriptionId: number) => {
    try {
      const res = await axios.get(`/api/plans/planUsage?subscriptionId=${subscriptionId}`);
      console.log("Plan Usage Data:", res.data);
      setPlanUsage(res?.data?.data?.subscriptionTracker);
    } catch (err) {
      console.error("Failed to fetch plan usage:", err);
    }
  };

  // File Upload Handlers
  const handleFileUpload = async (
    file: File,
    id: number,
    type: 'prescription' | 'labReport' | 'dietPlan'
  ) => {
    if (!file || !id) return;

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileName = `${patientDetails?.name.replace(/\s+/g, "-")}-${type}-${id}-${file.name}`;

      const { url } = await put(fileName, arrayBuffer, {
        access: "public",
        token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
      });

      const endpoint = type === 'labReport'
        ? `/api/admin/dashboard/patients-details`
        : `/api/admin/dashboard/appointments`;

      const payload = type === 'labReport'
        ? { labBookingId: id, link: url, status: "COMPLETED" }
        : { appointmentId: id, link: url, status: "COMPLETED" };

      await axios.put(endpoint, payload);

      // Refresh data
      await fetchPatientDetails();

      setUploadSuccess(true);
      toast.success(`${type === 'prescription' ? 'Prescription' : type === 'dietPlan' ? 'Diet Plan' : 'Lab Report'} uploaded successfully.`);

      setTimeout(() => {
        setUploadingAppointmentId(null);
        setUploadSuccess(false);
      }, 10000);
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Multiple Files Upload Handler
  const handleMultipleFilesUpload = async (
    files: FileList,
    id: number,
    type: 'labReport'
  ) => {
    if (!files || !id) return;

    setUploading(true);
    try {
      const uploadedLinks: string[] = [];

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const fileName = `${patientDetails?.name.replace(/\s+/g, "-")}-${type}-${id}-${file.name}`;

        const { url } = await put(fileName, arrayBuffer, {
          access: "public",
          token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
        });

        uploadedLinks.push(url);
      }

      await axios.put(`/api/admin/dashboard/patients-details`, {
        labBookingId: id,
        links: uploadedLinks,
        status: "COMPLETED"
      });

      // Refresh data
      await fetchPatientDetails();

      setUploadSuccess(true);
      toast.success("Lab reports uploaded successfully.");

      setTimeout(() => {
        setUploadingAppointmentId(null);
        setUploadSuccess(false);
      }, 1500);
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // UI Components
  const UploadDropZone = ({ type }: { type: 'prescription' | 'labReport' | 'dietPlan' }) => (
    <div
      className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition"
      onDrop={async (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && uploadingAppointmentId) {
          await handleFileUpload(file, uploadingAppointmentId, type);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4m0 0l-2 2m2-2l2 2m6 4H6a2 2 0 01-2-2V7a2 2 0 012-2h3.586a1 1 0 01.707.293l1.414 1.414A1 1 0 0012 7h8a2 2 0 012 2v7a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm text-gray-600">Drag & drop a PDF here or click below</p>
        <label className="cursor-pointer bg-muted px-3 py-1 text-sm rounded border border-gray-300 mt-2 hover:bg-primary hover:text-white transition">
          Browse files
          <input
            type="file"
            accept="application/pdf"
            multiple={type === 'labReport'}
            hidden
            onChange={async (e) => {
              if (type === 'labReport' && uploadingAppointmentId && e.target.files) {
                await handleMultipleFilesUpload(e.target.files, uploadingAppointmentId, type);
              } else if (uploadingAppointmentId && e.target.files?.[0]) {
                await handleFileUpload(e.target.files[0], uploadingAppointmentId, type);
              }
            }}
          />
        </label>
      </div>
    </div>
  );

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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setUploadingAppointmentId(labBooking.id)}>
                      Upload Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Upload Lab Report PDF</DialogTitle>
                    <UploadDropZone type="labReport" />
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setUploadingAppointmentId(appointment.id)}>
                      Upload Prescription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Upload Prescription PDF</DialogTitle>
                    <UploadDropZone type="prescription" />
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
    </Card>
  );

  const DietPlansSection = () => (
    <Card className="rounded-lg p-4 bg-slate-50">
      <h3 className="font-semibold text-xl mb-4">Diet Plans</h3>
      <div className="flex flex-wrap gap-4">
        {patientDetails?.dieticianAppointments.map(appointment => (
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
                    <UploadDropZone type="dietPlan" />
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
    </Card>
  );

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
            {patientDetails?.doctorAppointments.map(appointment => (
              appointment.payment ? (
                <tr key={`appointment-${appointment.id}`} className="border-b">
                  <td className="px-4 py-2">Appointment</td>
                  <td className="px-4 py-2">{appointment.doctorName}</td>
                  <td className="px-4 py-2">{appointment.payment.currency} {(appointment.payment.amount / 100)}</td>
                  <td className="px-4 py-2">{appointment.payment.paymentStatus}</td>
                  <td className="px-4 py-2">{appointment.payment.razorpayPaymentId ? "Online" : "Offline"}</td>
                  <td className="px-4 py-2">{new Date(appointment.payment.createdAt).toLocaleDateString()}</td>
                </tr>
              ) : null
            ))}

            {/* Lab Bookings Payments */}
            {patientDetails?.labBookings.map(labBooking => (
              labBooking.payment ? (
                <tr key={`lab-${labBooking.id}`} className="border-b">
                  <td className="px-4 py-2">Lab Booking</td>
                  <td className="px-4 py-2">{labBooking.labPackageName}</td>
                  <td className="px-4 py-2">{labBooking.payment?.currency ?? 'INR'} {(labBooking.payment?.amount ?? 0) / 100}</td>
                  <td className="px-4 py-2">{labBooking.payment.paymentStatus}</td>
                  <td className="px-4 py-2">{labBooking.payment.razorpayPaymentId ? "Online" : "Offline"}</td>
                  <td className="px-4 py-2">{new Date(labBooking.date).toLocaleDateString()}</td>
                </tr>
              ) : null
            ))}

            {/* Subscription Payments */}
            {patientDetails?.subscriptions.map(plan => (
              <tr key={`plan-${plan.id}`} className="border-b">
                <td className="px-4 py-2">Subscription</td>
                <td className="px-4 py-2">{plan.planName}</td>
                <td className="px-4 py-2">{plan.payment?.currency ?? 'INR'} {(plan.payment?.amount ?? 0) / 100}</td>
                <td className="px-4 py-2">Active</td>
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
              doctorAppointments: patientDetails.doctorAppointments.map(a => ({
                payment: a.payment ? { amount: a.payment.amount } : undefined,
              })),
              plans: patientDetails.subscriptions.map(p => ({
                amount: p.payment?.amount,
              })),
              labBookings: patientDetails.labBookings.map(lb => ({
                payment: lb.payment ? { amount: lb.payment.amount } : undefined,
              })),
            }}
          />

          {/* Appointment Dates */}
          <AppointmentDatesSection />

          {/* Lab Reports */}
          <LabReportsSection />

          {/* Appointment Prescriptions */}
          <AppointmentPrescriptionsSection />

          {/* Diet Plans */}
          <DietPlansSection />

          {/* Payment History */}
          <PaymentHistorySection />
        </div>
      </div>
    </>
  );
};

export default PatientDetailsPage;