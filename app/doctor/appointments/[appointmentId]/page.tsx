"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PrescriptionForm from "@/components/prescription/PrescriptionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePDFBase64 } from "@/components/prescription/PrescriptionPDF";
import DailyIframe, { DailyCall } from '@daily-co/daily-js';

interface PrescriptionData {
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

export default function PrescriptionPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({
    complaints: [],
    vitals: {
      bloodPressure: "",
      pulse: "",
      height: "",
      weight: "",
    },
    history: {
      allergies: "",
      personalHistory: "",
      pastMedicalHistory: "",
      familyHistory: "",
    },
    systemicExamination: {
      general: "",
      cvs: "NAD",
      rs: "NAD",
      cns: "NAD",
    },
    medicines: [],
    advice: "",
    testsRequested: "",
    nextVisit: {
      type: "days",
      value: 7,
      date: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [existingPrescriptionId, setExistingPrescriptionId] = useState<string | null>(null);
  const [activeCallFrame, setActiveCallFrame] = useState<DailyCall | null>(null);
  const [meetingRoomLink, setMeetingRoomLink] = useState<string | null>(null);
  const [ownerToken, setOwnerToken] = useState<string | null>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    patientId: "",
    appointmentId: appointmentId,
    prescriptionId: `PRES-XX-${appointmentId}`,
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

  useEffect(() => {
    // Auto-scroll to vitals section after a short delay
    const scrollToVitals = () => {
      setTimeout(() => {
        const vitalsSection = document.querySelector('[data-section="vitals"]');
        if (vitalsSection) {
          vitalsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    };

    const fetchExistingPrescription = async () => {
      try {
        // Check existence first to avoid 404s
        const existsRes = await fetch(`/api/doctor/prescription/exists?appointmentId=${appointmentId}`);
        const existsJson = existsRes.ok ? await existsRes.json() : { exists: false };

        if (existsJson?.exists && existsJson.id) {
          const response = await fetch(`/api/doctor/prescription?prescriptionId=${existsJson.id}`);
          if (!response.ok) return;
          const data = await response.json();
          if (!data.success || !data.data) return;

          // Existing prescription → prefill
          const prescription = data.data;
          setExistingPrescriptionId(String(prescription.id));
          setPatientInfo(prev => ({
            ...prev,
            prescriptionId: prescription.prescriptionNumber || `PRES-${prescription.id}`,
          }));
          setPrescriptionData({
            complaints: (prescription.complaints || []).map((c: any) => ({
              id: String(c.id),
              text: c.complaintText,
              severity: c.severity,
              daysSince: c.daysSince,
              isFlagged: c.isFlagged || false,
            })),
            vitals: prescription.vitals ? {
              bloodPressure: prescription.vitals.bloodPressure || "",
              pulse: prescription.vitals.pulse?.toString() || "",
              height: prescription.vitals.height?.toString() || "",
              weight: prescription.vitals.weight?.toString() || "",
            } : { bloodPressure: "", pulse: "", height: "", weight: "" },
            history: { allergies: "", personalHistory: "", pastMedicalHistory: "", familyHistory: "" },
            systemicExamination: prescription.systemicExamination ? {
              general: prescription.systemicExamination.general || "",
              cvs: prescription.systemicExamination.cvs || "NAD",
              rs: prescription.systemicExamination.rs || "NAD",
              cns: prescription.systemicExamination.cns || "NAD",
            } : { general: "", cvs: "NAD", rs: "NAD", cns: "NAD" },
            medicines: (prescription.medicines || []).map((m: any) => ({
              id: String(m.id),
              name: m.medicineName,
              frequency: m.frequency,
              medicineTime: m.medicineTime,
              duration: m.duration,
              quantity: m.quantity?.toString() || "",
              instructions: m.instructions || "",
            })),
            advice: prescription.advice || "",
            testsRequested: prescription.testsRequested || "",
            nextVisit: {
              type: prescription.nextVisitType || "days",
              value: prescription.nextVisitValue || 7,
              date: prescription.nextVisitDate ? new Date(prescription.nextVisitDate) : undefined,
            },
          });

          // History prefill from previous only if no history on current
          try {
            const hasHistory = Boolean(prescription.history && (
              prescription.history.allergies || prescription.history.personalHistory || prescription.history.pastMedicalHistory || prescription.history.familyHistory
            ));
            if (!hasHistory) {
              const prevRes = await fetch(`/api/doctor/prescription/previous?patientId=${prescription.patientId}&latest=true`);
              if (prevRes.ok) {
                const prevJson = await prevRes.json();
                const prevHist = prevJson?.data?.history;
                if (prevHist && (prevHist.allergies || prevHist.personalHistory || prevHist.pastMedicalHistory || prevHist.familyHistory)) {
                  setPrescriptionData(prev => ({
                    ...prev,
                    history: {
                      allergies: prevHist.allergies || "",
                      personalHistory: prevHist.personalHistory || "",
                      pastMedicalHistory: prevHist.pastMedicalHistory || "",
                      familyHistory: prevHist.familyHistory || "",
                    },
                  }));
                }
              }
            }
          } catch {
            // ignore
          }
        } else {
          // No existing prescription; try latest previous for history
          try {
            const aptRes = await fetch(`/api/doctor/appointments/all`);
            if (!aptRes.ok) return;
            const aptJson = await aptRes.json();
            const apt = aptJson.upcoming.find((a: any) => a.id.toString() === appointmentId) || aptJson.past.find((a: any) => a.id.toString() === appointmentId);
            if (!apt?.patientId) return;
            const prevRes = await fetch(`/api/doctor/prescription/previous?patientId=${apt.patientId}&latest=true`);
            if (prevRes.ok) {
              const prevJson = await prevRes.json();
              const prevHist = prevJson?.data?.history;
              if (prevHist && (prevHist.allergies || prevHist.personalHistory || prevHist.pastMedicalHistory || prevHist.familyHistory)) {
                setPrescriptionData(prev => ({
                  ...prev,
                  history: {
                    allergies: prevHist.allergies || "",
                    personalHistory: prevHist.personalHistory || "",
                    pastMedicalHistory: prevHist.pastMedicalHistory || "",
                    familyHistory: prevHist.familyHistory || "",
                  },
                }));
              }
            }
          } catch {
            // ignore
          }
        }
      } catch (error) {
        console.error("Error fetching existing prescription:", error);
      }
    };

    const fetchAppointmentData = async () => {
      try {
        const response = await fetch(`/api/doctor/appointments/all`);
        if (!response.ok) {
          throw new Error("Failed to fetch appointment data");
        }

        const data = await response.json();
        const appointment = data.upcoming.find((apt: any) => apt.id.toString() === appointmentId) ||
          data.past.find((apt: any) => apt.id.toString() === appointmentId);

        if (appointment) {
          const prescriptionId = `PRES-${appointment.patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}-${appointmentId}`;
          setPatientInfo(prev => ({
            ...prev,
            name: appointment.patientName,
            patientId: appointment.patientId.toString(),
            appointmentId: appointmentId,
            prescriptionId: prescriptionId,
          }));

          // Set doctor info from appointment data
          setDoctorInfo({
            name: appointment.doctorName || "Unknown Doctor",
            id: appointment.doctorId?.toString() || "",
          });

          // Set meeting room link, owner token, and appointment data for video consultation
          setMeetingRoomLink(appointment.meetingRoomLink);
          setOwnerToken(appointment.ownerToken1);
          setAppointmentData(appointment);

          // Fetch patient profile to prefill longitudinal history
          try {
            const profRes = await fetch(`/api/profile?userId=${appointment.patientId}`);
            if (profRes.ok) {
              const profJson = await profRes.json();
              const pp = profJson?.data?.patientProfile;
              if (pp) {
                setPrescriptionData(prev => ({
                  ...prev,
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
            console.warn('Patient profile fetch failed for history prefill');
          }

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
        }
      } catch (error) {
        console.error("Error fetching appointment data:", error);
        toast({
          title: "Error",
          description: "Failed to load appointment data",
          variant: "destructive",
        });
      }
    };

    if (appointmentId) {
      fetchAppointmentData();
      fetchExistingPrescription();
      scrollToVitals(); // Auto-scroll to vitals
    }
  }, [appointmentId, toast]);

  const joinVideoCall = async () => {
    if (!meetingRoomLink) {
      toast({
        title: "Error",
        description: "No meeting room link available",
        variant: "destructive",
      });
      return;
    }

    try {
      // Destroy existing call frame if present
      if (activeCallFrame) {
        await activeCallFrame.destroy();
        setActiveCallFrame(null);
      }

      // Create new call frame for split screen
      const callContainer = document.getElementById('daily-call-container');
      if (!callContainer) {
        throw new Error('Call container not found');
      }

      const newCallFrame = DailyIframe.createFrame(callContainer, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px',
        },
        showLeaveButton: true,
        showFullscreenButton: false, // Disable fullscreen for split screen
      });

      // Add event listeners
      newCallFrame.on('left-meeting', () => {
        console.log('Left meeting, destroying frame');
        newCallFrame.destroy();
        setActiveCallFrame(null);
      });

      newCallFrame.on('error', (error) => {
        console.error('Daily call error:', error);
        toast({
          title: "Video Call Error",
          description: error?.errorMsg || 'Unknown error occurred',
          variant: "destructive",
        });
        newCallFrame.destroy();
        setActiveCallFrame(null);
      });

      // Store the new frame
      setActiveCallFrame(newCallFrame);

      // Join the call with owner token for privileged access
      const joinOptions: any = { url: meetingRoomLink };
      if (ownerToken) {
        joinOptions.token = ownerToken;
      }
      await newCallFrame.join(joinOptions);
      
      toast({
        title: "Success",
        description: "Joined video call successfully",
      });
    } catch (error) {
      console.error("Failed to join video call:", error);
      toast({
        title: "Error",
        description: "Failed to join video call",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Auto-join video call if it's a video consultation
    if (appointmentData?.consultationType?.toUpperCase() === "VIDEO" && meetingRoomLink && !activeCallFrame) {
      joinVideoCall();
    }
  }, [appointmentData, meetingRoomLink, ownerToken]);

  // Cleanup call frame on component unmount
  useEffect(() => {
    return () => {
      if (activeCallFrame) {
        console.log('Component unmounting, destroying call frame');
        activeCallFrame.destroy();
      }
    };
  }, [activeCallFrame]);

  const calculateNextVisitDate = (type: string, value: number) => {
    const today = new Date();
    let nextDate = new Date(today);

    switch (type) {
      case "days":
        nextDate.setDate(today.getDate() + value);
        break;
      case "weeks":
        nextDate.setDate(today.getDate() + (value * 7));
        break;
      case "months":
        nextDate.setMonth(today.getMonth() + value);
        break;
    }

    return nextDate;
  };

  const handleBack = () => {
    router.push('/doctor/appointments');
  };

  const handleGeneratePrescription = async () => {
    setIsLoading(true);
    try {
      // Only use PUT if existingPrescriptionId is a non-empty string
      const isUpdate = existingPrescriptionId && existingPrescriptionId.trim() !== "";
      const method = isUpdate ? "PUT" : "POST";
      const url = "/api/doctor/prescription";
      const body = isUpdate
        ? {
            prescriptionId: existingPrescriptionId,
            complaints: prescriptionData.complaints,
            vitals: prescriptionData.vitals,
            history: prescriptionData.history,
            systemicExamination: prescriptionData.systemicExamination,
            medicines: prescriptionData.medicines,
            advice: prescriptionData.advice,
            testsRequested: prescriptionData.testsRequested,
            nextVisitDate: prescriptionData.nextVisit.date || calculateNextVisitDate(prescriptionData.nextVisit.type, prescriptionData.nextVisit.value),
            nextVisitType: prescriptionData.nextVisit.type,
            nextVisitValue: prescriptionData.nextVisit.value,
          }
        : {
            appointmentId: parseInt(appointmentId),
            patientId: parseInt(patientInfo.patientId),
            doctorId: parseInt(doctorInfo.id) || 1, // Use actual doctor ID from appointment
            complaints: prescriptionData.complaints,
            vitals: prescriptionData.vitals,
            history: prescriptionData.history,
            systemicExamination: prescriptionData.systemicExamination,
            medicines: prescriptionData.medicines,
            advice: prescriptionData.advice,
            testsRequested: prescriptionData.testsRequested,
            nextVisitDate: prescriptionData.nextVisit.date || calculateNextVisitDate(prescriptionData.nextVisit.type, prescriptionData.nextVisit.value),
            nextVisitType: prescriptionData.nextVisit.type,
            nextVisitValue: prescriptionData.nextVisit.value,
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save prescription");
      }

      const result = await response.json();
      const prescriptionId = existingPrescriptionId || result.data.id;

      // Generate PDF and upload to blob storage
      try {
        const pdfResult = await generatePDFBase64(
          prescriptionData,
          patientInfo,
          doctorInfo,
          clinicInfo,
          appointmentId,
          visibleSections
        );
        
        if (pdfResult.success) {
          console.log('PDF generated successfully');
          
          // Upload PDF to blob storage and update prescription link
          const uploadResponse = await fetch('/api/doctor/prescription/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              appointmentId: appointmentId,
              pdf: pdfResult.pdfBase64
            }),
          });

          if (uploadResponse.ok) {
            console.log('PDF uploaded successfully');
          }
        }
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        // Don't fail the entire operation if PDF generation fails
      }

      // Update appointment status to COMPLETED
      try {
        await fetch(`/api/doctor/appointments/${appointmentId}/mark-completed`, {
          method: 'PUT',
        });
        console.log('Appointment marked as completed');
      } catch (statusError) {
        console.error('Failed to update appointment status:', statusError);
      }

      toast({
        title: "Success",
        description: existingPrescriptionId ? "Prescription updated successfully!" : "Prescription saved successfully!",
      });

      // Navigate to PDF view page
      router.push(`/doctor/appointments/${appointmentId}/prescription`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate prescription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-muted">
      {appointmentData?.consultationType?.toLowerCase() === "video" ? (
        // Split Screen Layout for Video Consultations
        <div className="h-screen flex flex-col lg:flex-row">
          {/* Left Side - Video Player */}
          <div className="lg:w-1/3 w-full h-64 lg:h-full bg-black flex items-center justify-center relative order-1 lg:order-1">
            <div className="w-full h-full" id="daily-call-container">
              {!activeCallFrame && (
                <div className="flex flex-col items-center justify-center text-white p-4 lg:p-8 h-full">
                  <div className="text-base lg:text-lg mb-4 text-center">Video Consultation</div>
                  <Button 
                    onClick={joinVideoCall}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 lg:px-6 lg:py-2 text-sm lg:text-base"
                  >
                    Join Video Call
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Prescription Form */}
          <div className="lg:w-2/3 w-full flex-1 lg:h-full overflow-y-auto order-2 lg:order-2">
            <div className="bg-mutedbg h-full min-h-screen lg:min-h-full">
              <div className="px-2 lg:px-4">
                <PrescriptionForm
                  prescriptionData={prescriptionData}
                  setPrescriptionData={setPrescriptionData}
                  patientInfo={patientInfo}
                  onGeneratePrescription={handleGeneratePrescription}
                  isGenerating={isLoading}
                  onBack={handleBack}
                  existingPrescriptionId={existingPrescriptionId}
                  onLoadPrevious={async () => {
                    try {
                      const response = await fetch(`/api/doctor/prescription/previous?patientId=${patientInfo.patientId}&latest=true`);
                      if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data) {
                          const prescription = data.data;
                          setPrescriptionData({
                            complaints: prescription.complaints.map((c: any) => ({
                              id: c.id.toString(),
                              text: c.complaintText,
                              severity: c.severity,
                              daysSince: c.daysSince,
                              isFlagged: c.isFlagged || false,
                            })),
                            vitals: prescription.vitals ? {
                              bloodPressure: prescription.vitals.bloodPressure || "",
                              pulse: prescription.vitals.pulse?.toString() || "",
                              height: prescription.vitals.height?.toString() || "",
                              weight: prescription.vitals.weight?.toString() || "",
                            } : prescriptionData.vitals,
                            history: prescription.history ? {
                              allergies: prescription.history.allergies || "",
                              personalHistory: prescription.history.personalHistory || "",
                              pastMedicalHistory: prescription.history.pastMedicalHistory || "",
                              familyHistory: prescription.history.familyHistory || "",
                            } : prescriptionData.history,
                            systemicExamination: prescription.systemicExamination ? {
                              general: prescription.systemicExamination.general || "",
                              cvs: prescription.systemicExamination.cvs || "NAD",
                              rs: prescription.systemicExamination.rs || "NAD",
                              cns: prescription.systemicExamination.cns || "NAD",
                            } : prescriptionData.systemicExamination,
                            medicines: prescription.medicines.map((m: any) => ({
                              id: m.id.toString(),
                              name: m.medicineName,
                              frequency: m.frequency,
                              medicineTime: m.medicineTime,
                              duration: m.duration,
                              quantity: m.quantity?.toString() || "",
                              instructions: m.instructions || "",
                            })),
                            advice: prescription.advice || "",
                            testsRequested: prescription.testsRequested || "",
                            nextVisit: {
                              type: prescription.nextVisitType || "days",
                              value: prescription.nextVisitValue || 7,
                              date: prescription.nextVisitDate ? new Date(prescription.nextVisitDate) : undefined,
                            },
                          });

                          toast({
                            title: "Previous Prescription Loaded",
                            description: "Data from the last prescription has been loaded",
                          });
                        }
                      }
                    } catch (error) {
                      console.error("Error loading previous prescription:", error);
                      toast({
                        title: "Error",
                        description: "Failed to load previous prescription",
                        variant: "destructive",
                      });
                    }
                  }}
                  doctorInfo={doctorInfo}
                  clinicInfo={clinicInfo}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Full Screen Layout for Physical Consultations
        <div className="flex flex-col items-center">
      <div className="container w-full bg-mutedbg">
        <div className="mt-2">
          <PrescriptionForm
            prescriptionData={prescriptionData}
            setPrescriptionData={setPrescriptionData}
            patientInfo={patientInfo}
            onGeneratePrescription={handleGeneratePrescription}
            isGenerating={isLoading}
            onBack={handleBack}
            existingPrescriptionId={existingPrescriptionId}
            onLoadPrevious={async () => {
              try {
                const response = await fetch(`/api/doctor/prescription/previous?patientId=${patientInfo.patientId}&latest=true`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.data) {
                    const prescription = data.data;
                    setPrescriptionData({
                      complaints: prescription.complaints.map((c: any) => ({
                        id: c.id.toString(),
                        text: c.complaintText,
                        severity: c.severity,
                        daysSince: c.daysSince,
                        isFlagged: c.isFlagged || false,
                      })),
                      vitals: prescription.vitals ? {
                        bloodPressure: prescription.vitals.bloodPressure || "",
                        pulse: prescription.vitals.pulse?.toString() || "",
                        height: prescription.vitals.height?.toString() || "",
                        weight: prescription.vitals.weight?.toString() || "",
                      } : prescriptionData.vitals,
                      history: prescription.history ? {
                        allergies: prescription.history.allergies || "",
                        personalHistory: prescription.history.personalHistory || "",
                        pastMedicalHistory: prescription.history.pastMedicalHistory || "",
                        familyHistory: prescription.history.familyHistory || "",
                      } : prescriptionData.history,
                      systemicExamination: prescription.systemicExamination ? {
                        general: prescription.systemicExamination.general || "",
                        cvs: prescription.systemicExamination.cvs || "NAD",
                        rs: prescription.systemicExamination.rs || "NAD",
                        cns: prescription.systemicExamination.cns || "NAD",
                      } : prescriptionData.systemicExamination,
                      medicines: prescription.medicines.map((m: any) => ({
                        id: m.id.toString(),
                        name: m.medicineName,
                        frequency: m.frequency,
                        medicineTime: m.medicineTime,
                        duration: m.duration,
                        quantity: m.quantity?.toString() || "",
                        instructions: m.instructions || "",
                      })),
                      advice: prescription.advice || "",
                      testsRequested: prescription.testsRequested || "",
                      nextVisit: {
                        type: prescription.nextVisitType || "days",
                        value: prescription.nextVisitValue || 7,
                        date: prescription.nextVisitDate ? new Date(prescription.nextVisitDate) : undefined,
                      },
                    });

                    toast({
                      title: "Previous Prescription Loaded",
                      description: "Data from the last prescription has been loaded",
                    });
                  }
                }
              } catch (error) {
                console.error("Error loading previous prescription:", error);
                toast({
                  title: "Error",
                  description: "Failed to load previous prescription",
                  variant: "destructive",
                });
              }
            }}
            doctorInfo={doctorInfo}
            clinicInfo={clinicInfo}
          />
        </div>
      </div>
        </div>
      )}
    </div>
  );
} 