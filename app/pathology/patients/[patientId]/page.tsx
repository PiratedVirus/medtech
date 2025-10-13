"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ConsolidatedUploadModal from "@/components/pathology/ConsolidatedUploadModal";
import ViewReportsModal from "@/components/pathology/ViewReportsModal";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, Calendar, TestTube, Droplets, FileText, Clock, MapPin, 
  Phone, Heart, Activity, Ruler, Scale, Home, Upload, CheckCircle,
  AlertCircle, PlayCircle, ArrowRight, X
} from "lucide-react";
import { useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CdLoader from "@/components/ui/custom/cd-loader";
import { getStatusDisplay, getStatusColor } from "@/lib/utils/statusMapping";

interface Patient {
  id: number;
  name: string;
  patientId: string;
  gender: string;
  mobile: string;
  address: string;
  lastVisit: string;
  plan: string;
  email: string;
  joinedOn: string;
  profile: {
    age: number;
    weight: number;
    height: number;
    allergies?: string;
    medicalHistory?: string;
    emergencyContact: string;
    dateOfBirth?: string;
  };
  subscriptions: Array<{
    id: number;
    planName: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>;
}

interface LabBooking {
  id: number;
  labPackageName: string;
  date: string;
  status: string; // Single status
  reportLink?: string[] | null;
  labResult?: string[] | null;
  phlebotomist?: string;
  labAssignmentId?: number;
}

interface TimelineStep {
  id: number;
  title: string;
  status: "completed" | "active" | "pending";
  time: string;
}

export default function PatientDetailsPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [labBookings, setLabBookings] = useState<LabBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState<LabBooking | null>(null);
  const [viewReportsModalOpen, setViewReportsModalOpen] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buttonClicked, setButtonClicked] = useState<number | null>(null);

  useEffect(() => {
    fetchPatientDetails();
    fetchLabBookings();
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      const response = await fetch(`/api/pathology/patients/${patientId}`);
      const data = await response.json();
      setPatient(data.patient);
    } catch (error) {
      console.error("Error fetching patient details:", error);
      toast.error("Failed to fetch patient details");
    } finally {
      setLoading(false);
    }
  };

  const fetchLabBookings = async () => {
    try {
      console.log("Fetching lab bookings for patient:", patientId);
      const response = await fetch(`/api/labs?patientId=${patientId}`);
      const data = await response.json();
      console.log("Lab bookings data:", data);
      
      if (data.scheduled || data.completed) {
        // Transform the data to match our interface
        const transformedScheduled = (data.scheduled || []).map((booking: any) => ({
          id: booking.id,
          labPackageName: booking.resultName.split(' - ')[1] || 'Lab Package',
          date: booking.resultDate,
          status: booking.status, // Single status
          reportLink: booking.reports?.map((r: any) => r.pdfUrl) || null,
          labResult: null, // Don't duplicate the reports
          phlebotomist: booking.phlebotomist,
          labAssignmentId: booking.labAssignmentId,
        }));
        
        const transformedCompleted = (data.completed || []).map((booking: any) => ({
          id: booking.id,
          labPackageName: booking.resultName.split(' - ')[1] || 'Lab Package',
          date: booking.resultDate,
          status: booking.status, // Single status
          reportLink: booking.reports?.map((r: any) => r.pdfUrl) || null,
          labResult: null, // Don't duplicate the reports
          phlebotomist: booking.phlebotomist,
          labAssignmentId: booking.labAssignmentId,
        }));
        
        const allBookings = [...transformedScheduled, ...transformedCompleted];
        console.log("Transformed bookings:", allBookings);
        setLabBookings(allBookings);
      }
    } catch (error) {
      console.error("Error fetching lab bookings:", error);
    }
  };

  const getTimelineSteps = (booking: LabBooking): TimelineStep[] => [
    {
      id: 1,
      title: "Scheduled",
      status: "completed",
      time: "09:00 AM",
    },
    {
      id: 2,
      title: "Sample Collected",
      status: ["SAMPLE_COLLECTED", "IN_LAB", "ANALYZING", "COMPLETED"].includes(booking.status) ? "completed" : "pending",
      time: "09:15 AM",
    },
    {
      id: 3,
      title: "Lab Processing",
      status: ["IN_LAB", "ANALYZING", "COMPLETED"].includes(booking.status) ? "active" : booking.status === "COMPLETED" ? "completed" : "pending",
      time: "10:30 AM",
    },
    {
      id: 4,
      title: "Results Ready",
      status: booking.status === "COMPLETED" ? "completed" : "pending",
      time: "2:00 PM",
    },
  ];

  const handleStatusUpdate = async (bookingId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/pathology/lab-assignments/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Status updated successfully");
        fetchLabBookings(); // Refresh data
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleUploadComplete = async () => {
    console.log("Upload completed, refreshing data...");
    // Refresh lab bookings to get updated reports
    await fetchLabBookings();
    // Close the modal
    setUploadModalOpen(false);
    setActiveBooking(null);
    console.log("Modal closed and data refreshed");
  };

  const openReportsModal = (reports: string[]) => {
    setSelectedReports(reports);
    setViewReportsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReports([]);
  };

  const openUploadModal = (booking: LabBooking) => {
    setActiveBooking(booking);
    setUploadModalOpen(true);
  };

  if (loading) {
    return <CdLoader />;
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600">Patient not found</h2>
          <p className="text-gray-600 mt-2">The patient you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const activeSubscription = patient.subscriptions?.find(sub => sub.isActive);

  return (
    <>
      <ToastContainer />
      <div className="mx-20 px-4 py-6 space-y-6">
        {/* Patient Information Card */}
        <Card className="col-span-full relative overflow-hidden rounded-lg bg-custom-mutedgreen text-gray-700 p-6">
          {/* Background icon */}
          <div className="absolute -right-10 -top-6 opacity-10">
            <User size={200} />
          </div>
          
          {/* Content */}
          <div className="relative space-y-4">
            <div className="flex justify-between items-center my-4">
              <div>
                <h2 className="text-3xl text-secondary font-bold">{patient.name}</h2>
                <p className="text-gray-600">
                  Member since <b>{new Date(patient.joinedOn || '').toLocaleDateString()}</b>
                </p>
              </div>
              {activeSubscription && (
                <div className="text-lg px-3 py-1 mr-14">
                  Subscribed to <span className="text-secondary"><strong>{activeSubscription.planName}</strong></span> till{" "}
                  {new Date(activeSubscription.endDate).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { icon: <Calendar className="h-4 w-4 flex-shrink-0" />, label: "Age", value: `${patient.profile?.age || 'N/A'} yrs` },
                { icon: <Scale className="h-4 w-4 flex-shrink-0" />, label: "Weight", value: `${patient.profile?.weight || 'N/A'} kg` },
                { icon: <Ruler className="h-4 w-4 flex-shrink-0" />, label: "Height", value: `${patient.profile?.height || 'N/A'} cm` },
                { icon: <Activity className="h-4 w-4 flex-shrink-0" />, label: "Gender", value: patient.gender },
                { icon: <Home className="h-4 w-4 flex-shrink-0" />, label: "Address", value: patient.address },
                { icon: <Calendar className="h-4 w-4 flex-shrink-0" />, label: "Date of Birth", value: patient.profile?.dateOfBirth ? new Date(patient.profile.dateOfBirth).toLocaleDateString() : 'N/A' },
                { icon: <Phone className="h-4 w-4 flex-shrink-0" />, label: "Mobile", value: patient.mobile },
                { icon: <Droplets className="h-4 w-4 flex-shrink-0" />, label: "Allergies", value: patient.profile?.allergies || 'None' },
                { icon: <Heart className="h-4 w-4 flex-shrink-0" />, label: "Medical History", value: patient.profile?.medicalHistory || 'N/A' },
                { icon: <Phone className="h-4 w-4 flex-shrink-0" />, label: "Emergency Contact", value: patient.profile?.emergencyContact || 'N/A' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-2 text-sm">
                  {item.icon}
                  <span className="text-xs">{item.label}:</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Bookings/Appointments Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Booked Tests</h2>
          
          {labBookings.length === 0 ? (
            <Card className="bg-custom-mutedgreen p-6">
              <div className="text-center">
                <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">No lab bookings found</h3>
                <p className="text-gray-500">This patient hasn't made any lab bookings yet.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3 bg-gray-50/30 min-h-screen">
              {labBookings.map((booking) => {
                const timelineSteps = getTimelineSteps(booking);
                // Use only reportLink to avoid duplicates
                const reports = Array.isArray(booking.reportLink) ? booking.reportLink : [];
                console.log(`Booking ${booking.id} reports:`, reports);
                console.log(`Booking ${booking.id} reportLink:`, booking.reportLink);
                console.log(`Booking ${booking.id} labResult:`, booking.labResult);

                return (
                  <Card
                    key={booking.id}
                    className="w-full bg-custom-mutedgreen border-1 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row items-center justify-between gap-2">
                        {/* Left Section - Test Information */}
                        <div className="flex-1 min-w-0 max-w-xs">
                          <div className="space-y-2">
                            <div>
                              {/* Booking ID Badge */}
                              <div className="flex items-center justify-between mb-2">
                                <Badge className="bg-blue-100 text-blue-800 text-xs font-medium">
                                  #{booking.id}
                                </Badge>
                                {booking.labAssignmentId && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs font-medium">
                                    Assignment #{booking.labAssignmentId}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-primary leading-tight truncate">{booking.labPackageName}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {new Date(booking.date).toLocaleDateString("en-GB")}
                                </div>
                                {booking.phlebotomist && (
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    <span className="truncate">{booking.phlebotomist}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge - Centered between left section and timeline */}
                        <div className="flex justify-center px-2">
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(booking.status as any)} font-normal text-xs px-2.5 py-1`}
                          >
                            {getStatusDisplay(booking.status as any, 'patient')}
                          </Badge>
                        </div>

                        {/* Center Section - Timeline */}
                        <div className="flex-1 max-w-sm w-full">
                          <div className="relative">
                            {/* Timeline Container */}
                            <div className="flex items-center justify-between relative px-2">
                              {/* Background Progress Line - Only between dots, not extending from last */}
                              <div className="absolute top-3 h-px bg-gray-200" style={{ left: '24px', right: '24px' }}></div>

                              {/* Active Progress Line - Only between completed dots, stops at last completed */}
                              {(() => {
                                const completedCount = timelineSteps.filter((step) => step.status === "completed").length;
                                const progressWidth = completedCount / timelineSteps.length;
                                return (
                                  <div
                                    className="absolute top-3 h-px bg-custom-orange transition-all duration-500"
                                    style={{
                                      left: '24px',
                                      width: `calc((100% - 48px) * ${Math.max(0, Math.min(1, progressWidth))})`,
                                    }}
                                  ></div>
                                );
                              })()}

                              {timelineSteps.map((step, index) => {
                                const isCompleted = step.status === "completed"
                                const isActive = step.status === "active"

                                return (
                                  <div key={step.id} className="relative flex flex-col items-center group">
                                    {/* Timeline Dot */}
                                    <div
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative z-10 ${
                                        isCompleted
                                          ? "bg-custom-green border-custom-green"
                                          : isActive
                                            ? "bg-white border-custom-orange shadow-sm"
                                            : "bg-white border-gray-300"
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      ) : isActive ? (
                                        <div className="w-2 h-2 bg-custom-orange rounded-full animate-pulse"></div>
                                      ) : (
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                      )}
                                    </div>

                                    {/* Step Info - Shows on Hover */}
                                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                        <div className="font-medium">{step.title}</div>
                                        <div className="text-gray-300 flex items-center gap-1 mt-0.5">
                                          <Clock className="h-2.5 w-2.5" />
                                          {step.time}
                                        </div>
                                      </div>
                                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute -top-1 left-1/2 -translate-x-1/2"></div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Timeline Labels */}
                            <div className="flex items-center justify-between mt-3 px-2">
                              {timelineSteps.map((step) => (
                                <div key={step.id} className="text-center">
                                  <p className="text-xs text-gray-500 font-medium">{step.title}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Section - Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-[180px] min-w-[180px] flex-wrap px-4 justify-end">
                          {["SAMPLE_COLLECTED", "IN_LAB", "ANALYZING"].includes(booking.status) && (
                            <Button
                              onClick={() => handleStatusUpdate(booking.labAssignmentId || booking.id, "COMPLETED")}
                              size="sm"
                              className="bg-custom-green hover:bg-custom-darkgreen text-white text-xs px-3 py-1.5 h-auto rounded-md whitespace-nowrap"
                            >
                              <CheckCircle className="h-3 w-3 mr-1.5" />
                              Complete
                            </Button>
                          )}

                          {/* Always show upload button - centered when no reports */}
                          {reports.length === 0 ? (
                            <div className="flex justify-center w-full">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`text-xs px-3 py-1.5 h-auto whitespace-nowrap ${
                                  buttonClicked === booking.id 
                                    ? "bg-blue-100 text-blue-700" 
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                } cursor-pointer`}
                                onClick={() => {
                                  console.log("Upload button clicked for booking:", booking.id);
                                  setButtonClicked(booking.id);
                                  setTimeout(() => setButtonClicked(null), 1000);
                                  setActiveBooking(booking);
                                  setUploadModalOpen(true);
                                }}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Upload
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col justify-center items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`text-xs px-3 py-1.5 h-auto whitespace-nowrap ${
                                    buttonClicked === booking.id 
                                      ? "bg-blue-100 text-blue-700" 
                                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                  } cursor-pointer`}
                                  onClick={() => {
                                    console.log("Upload more button clicked for booking:", booking.id);
                                    setButtonClicked(booking.id);
                                    setTimeout(() => setButtonClicked(null), 1000);
                                    setActiveBooking(booking);
                                    setUploadModalOpen(true);
                                  }}
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  Upload More
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary/80 hover:bg-primary/10 text-xs px-3 py-1.5 h-auto whitespace-nowrap"
                                  onClick={() => {
                                    setActiveBooking(booking);
                                    setViewReportsModalOpen(true);
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1.5" />
                                  View Reports ({reports.length})
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Consolidated Upload Modal */}
      <ConsolidatedUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        booking={activeBooking}
        patientName={patient?.name || 'Patient'}
        onUploadComplete={handleUploadComplete}
      />

      {/* View Reports Modal */}
      <ViewReportsModal
        isOpen={viewReportsModalOpen}
        onClose={() => setViewReportsModalOpen(false)}
        booking={activeBooking}
        patientName={patient?.name || 'Patient'}
        existingReports={activeBooking?.reportLink || activeBooking?.labResult || []}
      />
    </>
  );
} 