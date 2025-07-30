"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PrescriptionForm from "@/components/prescription/PrescriptionForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionData {
  complaints: Array<{
    id?: string;
    text: string;
    severity: "PERFECT" | "GOOD" | "MODERATE" | "RISK" | "CRITICAL";
    daysSince?: number;
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

  useEffect(() => {
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
          setPatientInfo({
            name: appointment.patientName,
            patientId: appointment.patientId.toString(),
            prescriptionId: `PRES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          });
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

    const fetchExistingPrescription = async () => {
      try {
        const response = await fetch(`/api/doctor/prescription?appointmentId=${appointmentId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Set existing prescription ID
            setExistingPrescriptionId(data.data.id.toString());

            // Prefill the form with existing prescription data
            const prescription = data.data;
            setPrescriptionData({
              complaints: prescription.complaints.map((c: any) => ({
                id: c.id.toString(),
                text: c.complaintText,
                severity: c.severity,
                daysSince: c.daysSince,
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

            toast({
              title: "Prescription Loaded",
              description: "Existing prescription data has been loaded",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching existing prescription:", error);
      }
    };

    if (appointmentId) {
      fetchAppointmentData();
      fetchExistingPrescription();
    }
  }, [appointmentId, toast]);

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
    prescriptionId: `PRES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  });

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

  const handleGeneratePrescription = async () => {
    setIsLoading(true);
    try {
      const method = existingPrescriptionId ? "PUT" : "POST";
      const url = "/api/doctor/prescription";

      const body = existingPrescriptionId
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
          doctorId: 1, // TODO: Get from auth context
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
        console.log(response);
        throw new Error("Failed to save prescription");
      }

      const result = await response.json();
      const prescriptionId = existingPrescriptionId || result.data.id;

      toast({
        title: "Success",
        description: existingPrescriptionId ? "Prescription updated successfully!" : "Prescription saved successfully!",
      });

      // Navigate to PDF view page
      router.push(`/doctor/prescription/${prescriptionId}/pdf`);

    } catch (error) {
      console.error("Error generating prescription:", error);
      toast({
        title: "Error",
        description: "Failed to generate prescription. Please try again.",
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
          />

          {/* Generate Prescription Button */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleGeneratePrescription}
              disabled={isLoading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 text-lg"
              size="lg"
            >
              {isLoading
                ? "Generating..."
                : existingPrescriptionId
                  ? "Update Prescription"
                  : "Generate Prescription"
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 