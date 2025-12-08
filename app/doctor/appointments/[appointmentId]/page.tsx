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
  historyOfCurrentIllness: string;
  medicalHistory: {
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
  recommendedLinks: string[];
  nextVisit: {
    type: "days" | "weeks" | "months";
    value: number;
    date?: Date;
  };
  investigationValues: any[];
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
    historyOfCurrentIllness: "",
    medicalHistory: {
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
    recommendedLinks: [],
    nextVisit: {
      type: "days",
      value: 7,
      date: new Date(new Date().setDate(new Date().getDate() + 7)),
    },
    investigationValues: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true); // Track initial data loading
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
    allergies: "",
    personalHistory: "",
    pastMedicalHistory: "",
    familyHistory: "",
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

    // Consolidated data loading function - eliminates duplicate API calls and race conditions
    const loadAllData = async () => {
      if (!appointmentId) return;

      setIsLoadingData(true);
      
      try {
        // Step 1: Fetch appointment data first (need patientId for subsequent calls)
        const appointmentRes = await fetch(`/api/doctor/appointments/all`);
        if (!appointmentRes.ok) {
          throw new Error("Failed to fetch appointment data");
        }

        const appointmentJson = await appointmentRes.json();
        const appointment = appointmentJson.upcoming.find((apt: any) => apt.id.toString() === appointmentId) ||
          appointmentJson.past.find((apt: any) => apt.id.toString() === appointmentId);

        if (!appointment) {
          throw new Error("Appointment not found");
        }

        const patientId = appointment.patientId;

        // Step 2: Parallel fetch - Patient profile, Prescription exists check, Clinic info
        const [profileRes, prescriptionExistsRes, clinicRes] = await Promise.all([
          fetch(`/api/profile?userId=${patientId}`).catch(() => null),
          fetch(`/api/doctor/prescription/exists?appointmentId=${appointmentId}`).catch(() => null),
          fetch(`/api/doctor/clinic-info`).catch(() => null),
        ]);

        // Parse patient profile (SINGLE FETCH - no duplication!)
        let patientProfileData = {
          allergies: "",
          personalHistory: "",
          pastMedicalHistory: "",
          familyHistory: "",
        };

        if (profileRes?.ok) {
          const profileJson = await profileRes.json();
          const pp = profileJson?.data?.patientProfile;
          if (pp) {
            patientProfileData = {
              allergies: pp.allergies || "",
              personalHistory: pp.personalHistory || "",
              pastMedicalHistory: pp.pastMedicalHistory || "",
              familyHistory: pp.familyHistory || "",
            };
          }
        }

        // Parse clinic info
        if (clinicRes?.ok) {
          const clinicData = await clinicRes.json();
          if (clinicData.success && clinicData.clinic) {
            setClinicInfo({
              name: clinicData.clinic.name,
              logo: clinicData.clinic.logo,
              address: clinicData.clinic.address,
              timings: clinicData.clinic.timings,
              subtitle: clinicData.clinic.subtitle,
            });
          }
        }

        // Set appointment-related info
        const prescriptionId = `PRES-${appointment.patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}-${appointmentId}`;
        setPatientInfo({
          name: appointment.patientName,
          patientId: patientId.toString(),
          appointmentId: appointmentId,
          prescriptionId: prescriptionId,
          allergies: patientProfileData.allergies,
          personalHistory: patientProfileData.personalHistory,
          pastMedicalHistory: patientProfileData.pastMedicalHistory,
          familyHistory: patientProfileData.familyHistory,
        });

        setDoctorInfo({
          name: appointment.doctorName || "Unknown Doctor",
          id: appointment.doctorId?.toString() || "",
        });

        setMeetingRoomLink(appointment.meetingRoomLink);
        setOwnerToken(appointment.ownerToken1);
        setAppointmentData(appointment);

        // Step 3: Check if prescription exists for this appointment
        const existsJson = prescriptionExistsRes?.ok ? await prescriptionExistsRes.json() : { exists: false };
        
        if (existsJson?.exists && existsJson.id) {
          // Step 4a: Load existing prescription
          const prescriptionRes = await fetch(`/api/doctor/prescription?prescriptionId=${existsJson.id}`);
          if (prescriptionRes.ok) {
            const prescriptionData = await prescriptionRes.json();
            if (prescriptionData.success && prescriptionData.data) {
              const prescription = prescriptionData.data;
              setExistingPrescriptionId(String(prescription.id));

              // Set prescription data with medical history from patient profile
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
                historyOfCurrentIllness: prescription.historyOfCurrentIllness || "",
                medicalHistory: patientProfileData, // Use profile data fetched once
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
                recommendedLinks: prescription.recommendedLinks ? prescription.recommendedLinks.split(',').filter((link: string) => link.trim() !== '') : [],
                nextVisit: {
                  type: prescription.nextVisitType || "days",
                  value: prescription.nextVisitValue || 7,
                  date: prescription.nextVisitDate ? new Date(prescription.nextVisitDate) : undefined,
                },
        investigationValues: prescription.investigationValues || [],
              });

              // If no historyOfCurrentIllness, try to load from previous prescription
              if (!prescription.historyOfCurrentIllness) {
                try {
                  const prevRes = await fetch(`/api/doctor/prescription/previous?patientId=${patientId}&latest=true`);
                  if (prevRes.ok) {
                    const prevJson = await prevRes.json();
                    const prevHist = prevJson?.data?.history;
                    if (prevHist?.historyOfCurrentIllness) {
                      setPrescriptionData(prev => ({
                        ...prev,
                        historyOfCurrentIllness: prevHist.historyOfCurrentIllness,
                      }));
                    }
                  }
                } catch {
                  // Ignore errors
                }
              }
            }
          }
        } else {
          // Step 4b: No existing prescription - set initial data with medical history
          setPrescriptionData(prev => ({
            ...prev,
            medicalHistory: patientProfileData, // Set medical history from profile
          }));

          // Try to load historyOfCurrentIllness from previous prescription
          try {
            const prevRes = await fetch(`/api/doctor/prescription/previous?patientId=${patientId}&latest=true`);
            if (prevRes.ok) {
              const prevJson = await prevRes.json();
              const prevHist = prevJson?.data?.history;
              if (prevHist?.historyOfCurrentIllness) {
                setPrescriptionData(prev => ({
                  ...prev,
                  historyOfCurrentIllness: prevHist.historyOfCurrentIllness,
                }));
              }
            }
          } catch {
            // Ignore errors
          }
        }

        scrollToVitals(); // Auto-scroll to vitals
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load appointment data",
          variant: "destructive",
        });
      } finally {
        // All data loaded - enable AI Mic
        setIsLoadingData(false);
      }
    };

    loadAllData();
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
            historyOfCurrentIllness: prescriptionData.historyOfCurrentIllness,
            medicalHistory: prescriptionData.medicalHistory,
            systemicExamination: prescriptionData.systemicExamination,
            medicines: prescriptionData.medicines,
            advice: prescriptionData.advice,
            testsRequested: prescriptionData.testsRequested,
            recommendedLinks: prescriptionData.recommendedLinks || [],
            nextVisitDate: prescriptionData.nextVisit.date || calculateNextVisitDate(prescriptionData.nextVisit.type, prescriptionData.nextVisit.value),
            nextVisitType: prescriptionData.nextVisit.type,
            nextVisitValue: prescriptionData.nextVisit.value,
            investigationValues: prescriptionData.investigationValues || [],
          }
        : {
            appointmentId: parseInt(appointmentId),
            patientId: parseInt(patientInfo.patientId),
            doctorId: parseInt(doctorInfo.id) || 1, // Use actual doctor ID from appointment
            complaints: prescriptionData.complaints,
            vitals: prescriptionData.vitals,
            historyOfCurrentIllness: prescriptionData.historyOfCurrentIllness,
            medicalHistory: prescriptionData.medicalHistory,
            systemicExamination: prescriptionData.systemicExamination,
            medicines: prescriptionData.medicines,
            advice: prescriptionData.advice,
            testsRequested: prescriptionData.testsRequested,
            recommendedLinks: prescriptionData.recommendedLinks || [],
            nextVisitDate: prescriptionData.nextVisit.date || calculateNextVisitDate(prescriptionData.nextVisit.type, prescriptionData.nextVisit.value),
            nextVisitType: prescriptionData.nextVisit.type,
            nextVisitValue: prescriptionData.nextVisit.value,
            investigationValues: prescriptionData.investigationValues || [],
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

      toast({
        title: "Success",
        description: existingPrescriptionId ? "Prescription updated successfully!" : "Prescription saved successfully!",
      });

      // Navigate to prescription preview page
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
                  isLoadingData={isLoadingData}
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
                            historyOfCurrentIllness: prescription.historyOfCurrentIllness || "",
                            medicalHistory: {
                              allergies: patientInfo.allergies || "",
                              personalHistory: patientInfo.personalHistory || "",
                              pastMedicalHistory: patientInfo.pastMedicalHistory || "",
                              familyHistory: patientInfo.familyHistory || "",
                            },
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
                            recommendedLinks: prescription.recommendedLinks ? prescription.recommendedLinks.split(',').filter((link: string) => link.trim() !== '') : [],
                            nextVisit: {
                              type: prescription.nextVisitType || "days",
                              value: prescription.nextVisitValue || 7,
                              date: prescription.nextVisitDate ? new Date(prescription.nextVisitDate) : undefined,
                            },
                            investigationValues: prescription.investigationValues || [],
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
            isLoadingData={isLoadingData}
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
                      historyOfCurrentIllness: prescription.historyOfCurrentIllness || "",
                      medicalHistory: {
                        allergies: patientInfo.allergies || "",
                        personalHistory: patientInfo.personalHistory || "",
                        pastMedicalHistory: patientInfo.pastMedicalHistory || "",
                        familyHistory: patientInfo.familyHistory || "",
                      },
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
                      recommendedLinks: prescription.recommendedLinks ? prescription.recommendedLinks.split(',').filter((link: string) => link.trim() !== '') : [],
                      nextVisit: {
                        type: prescription.nextVisitType || "days",
                        value: prescription.nextVisitValue || 7,
                        date: prescription.nextVisitDate ? new Date(prescription.nextVisitDate) : undefined,
                      },
                      investigationValues: prescription.investigationValues || [],
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