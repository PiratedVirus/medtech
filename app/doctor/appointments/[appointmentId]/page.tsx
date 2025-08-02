"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PrescriptionForm from "@/components/prescription/PrescriptionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePDFBase64 } from "@/components/prescription/PrescriptionPDF";

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
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const appointmentId = params.appointmentId as string;

  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({
    complaints: [],
    vitals: {
      bloodPressure: "120/80",
      pulse: "72",
      height: "182",
      weight: "95",
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
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [existingPrescriptionId, setExistingPrescriptionId] = useState<string | null>(null);
  
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
        const response = await fetch(`/api/doctor/prescription?appointmentId=${appointmentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Set existing prescription ID
            setExistingPrescriptionId(data.data.id.toString());
            
            // Update patientInfo with the existing prescription ID
            setPatientInfo(prev => ({
              ...prev,
              prescriptionId: data.data.prescriptionNumber || `PRES-${data.data.id}`,
            }));

            // Prefill the form with existing prescription data
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
              } : {
                bloodPressure: "120/80",
                pulse: "72",
                height: "182",
                weight: "95",
              },
              history: prescription.history ? {
                allergies: prescription.history.allergies || "",
                personalHistory: prescription.history.personalHistory || "",
                pastMedicalHistory: prescription.history.pastMedicalHistory || "",
                familyHistory: prescription.history.familyHistory || "",
              } : {
                allergies: "",
                personalHistory: "",
                pastMedicalHistory: "",
                familyHistory: "",
              },
              systemicExamination: prescription.systemicExamination ? {
                general: prescription.systemicExamination.general || "",
                cvs: prescription.systemicExamination.cvs || "NAD",
                rs: prescription.systemicExamination.rs || "NAD",
                cns: prescription.systemicExamination.cns || "NAD",
              } : {
                general: "",
                cvs: "NAD",
                rs: "NAD",
                cns: "NAD",
              },
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

          // Fetch clinic information from the database
          try {
            const clinicRes = await fetch(`/api/admin/clinics/clinics-list`);
            if (clinicRes.ok) {
              const clinicData = await clinicRes.json();
              if (clinicData.success && clinicData.clinics.length > 0) {
                // Find the clinic associated with the doctor or use the first clinic
                const doctorClinic = clinicData.clinics.find((clinic: any) => 
                  clinic.id === appointment.doctorClinicId
                ) || clinicData.clinics[0];
                
                setClinicInfo({
                  name: doctorClinic.name || "Care Diabetics Hospital",
                  logo: doctorClinic.logo || "",
                  address: doctorClinic.address || "Care Diabetics Hospital, 123 Well Ave, Springfield, IL 62704",
                  timings: doctorClinic.timings || "Mon - Sat ( 9:00 AM to 5:00 PM )",
                  subtitle: doctorClinic.subtitle || "AIIMS (NEW DELHI) ALUMNI INITIATIVE",
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
          appointmentId
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
    <div className="bg-muted flex flex-col items-center">
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
  );
} 