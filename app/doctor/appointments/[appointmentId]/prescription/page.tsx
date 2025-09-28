"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Edit, Eye, EyeOff, Share2, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PrescriptionPreview from "@/components/prescription/PrescriptionPreview";
import { generateAndDownloadPDF } from "@/components/prescription/PrescriptionPDF";

interface PrescriptionData {
  id: string;
  complaints: Array<{
    id?: string;
    text: string;
    severity: "PERFECT" | "GOOD" | "MODERATE" | "RISK" | "CRITICAL";
    daysSince?: number;
    isFlagged?: boolean;
  }>;
  vitals: {
    bloodPressure: string;
    pulse: string;
    height: string;
    weight: string;
  };
  history: {
    allergies: string;
    personalHistory: string;
    pastMedicalHistory: string;
    familyHistory: string;
  };
  systemicExamination: {
    general: string;
    cvs: string;
    rs: string;
    cns: string;
  };
  medicines: Array<{
    id?: string;
    name: string;
    frequency: string;
    medicineTime: string;
    duration: string;
    quantity: string;
    instructions?: string;
  }>;
  advice: string;
  testsRequested: string;
  nextVisit: {
    type: "days" | "weeks" | "months";
    value: number;
    date?: Date;
  };
}

export default function AppointmentPrescriptionPage() {
  const params = useParams();
  const { toast } = useToast();

  const appointmentId = params.appointmentId as string;

  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    patientId: "",
    prescriptionId: "",
    appointmentId: "",
  });
  const [doctorInfo, setDoctorInfo] = useState({
    name: "",
    id: "",
  });
  const [clinicInfo, setClinicInfo] = useState({
    name: "",
    logo: "",
    address: "",
    timings: "",
    subtitle: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'PENDING' | 'COMPLETED' | 'FAILED' | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Default visible sections
  const [visibleSections, setVisibleSections] = useState({
    complaints: true,
    vitals: true,
    history: true,
    systemicExamination: true,
    medicines: true,
    advice: true,
    testsRequested: true,
    nextVisit: true,
  });

  // Handle scroll to pin/unpin sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsPinned(window.scrollY > 64); // Pin after global header scrolls away
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchPrescription();
  }, [appointmentId]);

  useEffect(() => {
    checkProcessingStatus();
  }, [appointmentId]);

  // Scroll to the top of the pdf preview when data is loaded
  useEffect(() => {
    if (!isLoading && pdfRef.current) {
      pdfRef.current.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, [isLoading, visibleSections]); // Added visibleSections dependency

  const fetchPrescription = async () => {
    try {
      // First fetch appointment data to get patient info
      const appointmentRes = await fetch(`/api/doctor/appointments/all`);
      if (!appointmentRes.ok) throw new Error("Failed to fetch appointment data");
      const appointmentData = await appointmentRes.json();

      const appointment =
        appointmentData.upcoming.find((apt: any) => apt.id.toString() === appointmentId) ||
        appointmentData.past.find((apt: any) => apt.id.toString() === appointmentId);

      if (!appointment) throw new Error("Appointment not found");

      // Set patient info from appointment data
      setPatientInfo({
        name: appointment.patientName,
        patientId: appointment.patientId.toString(),
        prescriptionId:
          appointment.prescriptionNumber ||
          `PRES-${appointment.patientName.split(" ").map((n: string) => n[0]).join("" ).toUpperCase()}-${appointmentId}`,
        appointmentId: appointmentId,
      });

      // Set doctor info from appointment data - use the actual doctor conducting the appointment
      setDoctorInfo({
        name: appointment.doctorName || "Unknown Doctor",
        id: appointment.doctorId?.toString() || "",
      });

      // Fetch clinic information from the database using doctor's clinic ID
      try {
        const clinicRes = await fetch(`/api/doctor/clinic-info`);
        if (clinicRes.ok) {
          const clinicData = await clinicRes.json();
          if (clinicData.success && clinicData.clinic) {
            setClinicInfo({
              name: clinicData.clinic.name || "Care Diabetics Hospital",
              logo: clinicData.clinic.logo || "",
              address: clinicData.clinic.address || "Care Diabetics Hospital, 123 Well Ave, Springfield, IL 62704",
              timings: clinicData.clinic.timings || "Mon - Sat ( 9:00 AM to 5:00 PM )",
              subtitle: clinicData.clinic.subtitle || "AIIMS (NEW DELHI) ALUMNI INITIATIVE",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching clinic info:", error);
        // Use default clinic info
        setClinicInfo({
          name: "Care Diabetics Hospital",
          logo: "",
          address: "Care Diabetics Hospital, 123 Well Ave, Springfield, IL 62704",
          timings: "Mon - Sat ( 9:00 AM to 5:00 PM )",
          subtitle: "AIIMS (NEW DELHI) ALUMNI INITIATIVE",
        });
      }

      // Then fetch prescription data
      const prescriptionRes = await fetch(`/api/doctor/prescription?appointmentId=${appointmentId}`);
      if (!prescriptionRes.ok) throw new Error("Failed to fetch prescription");
      const prescriptionResult = await prescriptionRes.json();

      if (!prescriptionResult?.data) throw new Error("Prescription not found");

      // Transform prescription data to match expected format
      const prescription = prescriptionResult.data;
      setPrescriptionData({
        id: prescription.id.toString(),
        complaints:
          prescription.complaints?.map((c: any) => ({
            id: c.id.toString(),
            text: c.complaintText,
            severity: c.severity,
            daysSince: c.daysSince,
            isFlagged: c.isFlagged || false,
          })) || [],
        vitals: prescription.vitals
          ? {
              bloodPressure: prescription.vitals.bloodPressure || "",
              pulse: prescription.vitals.pulse?.toString() || "",
              height: prescription.vitals.height?.toString() || "",
              weight: prescription.vitals.weight?.toString() || "",
            }
          : {
              bloodPressure: "",
              pulse: "",
              height: "",
              weight: "",
            },
        // Initialize from patient profile (fetched below), fallback empty for now
        history: {
          allergies: "",
          personalHistory: "",
          pastMedicalHistory: "",
          familyHistory: "",
        },
        systemicExamination: prescription.systemicExamination
          ? {
              general: prescription.systemicExamination.general || "",
              cvs: prescription.systemicExamination.cvs || "NAD",
              rs: prescription.systemicExamination.rs || "NAD",
              cns: prescription.systemicExamination.cns || "NAD",
            }
          : {
              general: "",
              cvs: "NAD",
              rs: "NAD",
              cns: "NAD",
            },
        medicines:
          prescription.medicines?.map((m: any) => ({
            id: m.id.toString(),
            name: m.medicineName,
            frequency: m.frequency,
            medicineTime: m.medicineTime,
            duration: m.duration,
            quantity: m.quantity?.toString() || "",
            instructions: m.instructions || "",
          })) || [],
        advice: prescription.advice || "",
        testsRequested: prescription.testsRequested || "",
        nextVisit: {
          type: prescription.nextVisitType || "days",
          value: prescription.nextVisitValue || 7,
          date: prescription.nextVisitDate ? new Date(prescription.nextVisitDate) : undefined,
        },
      });

      // Prefill longitudinal history from patient profile
      try {
        const profRes = await fetch(`/api/profile?userId=${appointment.patientId}`);
        if (profRes.ok) {
          const profJson = await profRes.json();
          const pp = profJson?.data?.patientProfile;
          if (pp) {
            setPrescriptionData(prev => ({
              ...prev!,
              history: {
                allergies: pp.allergies || "",
                personalHistory: pp.personalHistory || "",
                pastMedicalHistory: pp.pastMedicalHistory || "",
                familyHistory: pp.familyHistory || "",
              }
            }));
          }
        }
      } catch (e) {
        console.warn('History prefill skipped:', e);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load prescription", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (!prescriptionData || !patientInfo || !doctorInfo || !clinicInfo) {
        toast({ title: "Error", description: "Missing prescription data", variant: "destructive" });
        return;
      }

      // Generate PDF using frontend
      const result = await generateAndDownloadPDF(
        prescriptionData,
        patientInfo,
        doctorInfo,
        clinicInfo,
        appointmentId,
        visibleSections
      );

      if (result.success) {
        toast({ title: "Success", description: "PDF downloaded successfully", variant: "success" });
      } else {
        throw new Error('error' in result ? result.error : 'Failed to generate PDF');
      }
    } catch (error) {
      console.error("PDF download error", error);
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    }
  };

  const checkProcessingStatus = async () => {
    try {
      // Get appointment details to find the prescription ID
      const appointmentRes = await fetch(`/api/doctor/appointments/all`);
      if (!appointmentRes.ok) return;
      const appointmentData = await appointmentRes.json();

      const appointment =
        appointmentData.upcoming.find((apt: any) => apt.id.toString() === appointmentId) ||
        appointmentData.past.find((apt: any) => apt.id.toString() === appointmentId);

      if (!appointment?.prescriptionId) return;

      // Check processing status from the database
      const statusRes = await fetch(`/api/prescription/status?prescriptionId=${appointment.prescriptionId}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.success) {
          setProcessingStatus(statusData.data.processingStatus);
        }
      }
    } catch (error) {
      console.error("Error checking processing status:", error);
    }
  };

  const handleProcessPrescription = async () => {
    try {
      setIsProcessing(true);
      
      // Get appointment details to find the patient id
      const appointmentRes = await fetch(`/api/doctor/appointments/all`);
      if (!appointmentRes.ok) throw new Error("Failed to fetch appointment data");
      const appointmentData = await appointmentRes.json();

      const appointment =
        appointmentData.upcoming.find((apt: any) => apt.id.toString() === appointmentId) ||
        appointmentData.past.find((apt: any) => apt.id.toString() === appointmentId);

      if (!appointment) throw new Error("Appointment not found");

      // Trigger processing for ALL prescriptions for this patient
      const processRes = await fetch(`/api/prescription/process-all/${appointment.patientId}`, {
        method: 'POST',
      });

      if (!processRes.ok) {
        const errorData = await processRes.json();
        throw new Error(errorData.error || 'Failed to process prescription');
      }

      const result = await processRes.json();
      if (result.success) {
        toast({
          title: 'Success',
          description: `Processed ${result.totals.completed}/${result.totals.total} prescriptions. Summary updated with ${result.summary?.count || 0} texts.`,
          variant: 'success',
        });
        // We can set status to completed for this appointment if its PDF existed and processed.
        setProcessingStatus('COMPLETED');
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error("Prescription processing error:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to process prescription", 
        variant: "destructive" 
      });
      setProcessingStatus('FAILED');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }
  if (!prescriptionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Prescription not found</p>
          <Link href="/doctor/appointments">
            <Button className="mt-4">Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted flex flex-col items-center">
      <div className="container w-full bg-mutedbg">
        <div className="mt-2">
          {/* Sticky Header - Shows when scrolled */}
          <div
            className={`fixed ${isPinned ? "top-0" : "top-16"} left-0 right-0 z-50 bg-white shadow-md border-b transition-[top] ease-in-out duration-200`}
          >
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-4">
                <Link href={`/doctor/appointments/${appointmentId}`}>
                  <Button variant="ghost" size="icon" className="mr-2 p-2">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">#APT0{appointmentId}</span>
                  <span className="text-lg font-semibold text-gray-900">{patientInfo.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing((v) => !v)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? "Done" : "Edit"}
                </Button>
                <Button onClick={handleDownload} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content: PDF Preview & Side Panel */}
          <div className="flex flex-col lg:flex-row gap-6 mt-24">
            {/* PDF Preview */}
            <div className="flex-1" ref={pdfRef}>
              <Card className="p-6">
                <PrescriptionPreview
                  prescriptionData={prescriptionData}
                  patientInfo={patientInfo}
                  doctorInfo={doctorInfo}
                  clinicInfo={clinicInfo}
                  visibleSections={visibleSections}
                />
              </Card>
            </div>

            {/* Side Panel */}
            <div className="w-80 shrink-0 sticky top-24 self-start max-h-[calc(100vh-6rem)] overflow-y-auto bg-white border border-gray-200 rounded-lg">
              <div className="p-6">
                {/* Share Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Share Prescription</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-12"
                      onClick={() => {
                        // TODO: Implement WhatsApp sharing
                        toast({ title: "Success", description: "Sharing via WhatsApp...", variant: "success" });
                      }}
                    >
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <span>Share via WhatsApp</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-12"
                      onClick={() => {
                        // TODO: Implement email sharing
                        toast({ title: "Success", description: "Sharing via Email...", variant: "success" });
                      }}
                    >
                      <Mail className="h-5 w-5 text-primary" />
                      <span>Share via Email</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-12"
                      onClick={() => {
                        // TODO: Implement general sharing
                        toast({ title: "Success", description: "Sharing prescription...", variant: "success" });
                      }}
                    >
                      <Share2 className="h-5 w-5 text-primary" />
                      <span>Share Prescription</span>
                    </Button>
                  </div>
                </div>

                {/* AI Processing Section */}
                <div className="mb-8 border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">AI Processing</h3>
                    {processingStatus === 'COMPLETED' && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {processingStatus !== 'COMPLETED' && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-12"
                        onClick={handleProcessPrescription}
                        disabled={isProcessing}
                      >
                        <div className="h-5 w-5 text-primary">
                          {isProcessing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          ) : processingStatus === 'FAILED' ? (
                            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          )}
                        </div>
                        <span>
                          {isProcessing ? "Processing..." : 
                           processingStatus === 'FAILED' ? "Retry Processing" : 
                           "Process with AI"}
                        </span>
                      </Button>
                    )}
                    
                    {processingStatus === 'FAILED' && (
                      <div className="text-xs">
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Status: FAILED
                        </div>
                        <p className="text-red-600 mt-1">✗ Processing failed. Click to retry.</p>
                      </div>
                    )}
                    

                  </div>
                </div>

                {/* Edit Section */}
                {isEditing && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Edit Prescription</h3>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Section Visibility</label>
                      <div className="space-y-3">
                        {Object.entries(visibleSections).map(([section, visible]) => (
                          <div
                            key={section}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm font-medium capitalize text-gray-700">
                              {section.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setVisibleSections((prev) => ({
                                  ...prev,
                                  [section]: !prev[section as keyof typeof prev],
                                }));
                                // Force re-render of PDF preview
                                setTimeout(() => {
                                  if (pdfRef.current) {
                                    pdfRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }
                                }, 100);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              {visible ? (
                                <Eye className="h-4 w-4 text-primary" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-primary/40" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}