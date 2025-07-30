"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PrescriptionPreviewProps {
  prescriptionData: any;
  patientInfo: any;
  visibleSections: {
    complaints: boolean;
    vitals: boolean;
    history: boolean;
    systemicExamination: boolean;
    medicines: boolean;
    advice: boolean;
    testsRequested: boolean;
    nextVisit: boolean;
  };
}

export default function PrescriptionPreview({
  prescriptionData,
  patientInfo,
  visibleSections,
}: PrescriptionPreviewProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      PERFECT: "bg-green-100 text-green-800",
      GOOD: "bg-blue-100 text-blue-800",
      MODERATE: "bg-yellow-100 text-yellow-800",
      RISK: "bg-orange-100 text-orange-800",
      CRITICAL: "bg-red-100 text-red-800",
    };
    return colors[severity as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getSeverityLabel = (severity: string) => {
    const labels = {
      PERFECT: "Perfect",
      GOOD: "Good",
      MODERATE: "Moderate",
      RISK: "Risk",
      CRITICAL: "Critical",
    };
    return labels[severity as keyof typeof labels] || severity;
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">PRESCRIPTION</h1>
        <div className="text-sm text-gray-600">
          <p>Care Diabetics</p>
          <p>Connecting Patients with Doctors, Seamlessly</p>
        </div>
      </div>

      {/* Patient Information */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
        <div>
          <span className="font-semibold">Patient Name:</span>
          <p className="text-gray-700">{patientInfo.name}</p>
        </div>
        <div>
          <span className="font-semibold">Patient ID:</span>
          <p className="text-gray-700">{patientInfo.patientId}</p>
        </div>
        <div>
          <span className="font-semibold">Prescription ID:</span>
          <p className="text-gray-700">{patientInfo.prescriptionId}</p>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-6">
        <span className="font-semibold">Date:</span> {formatDate(new Date())}
      </div>

      {/* Complaints Section */}
      {visibleSections.complaints && prescriptionData.complaints?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b border-gray-200 pb-1">
            Complaints
          </h3>
          <div className="space-y-2">
            {prescriptionData.complaints.map((complaint: any, index: number) => (
              <div key={complaint.id || index} className="flex items-start gap-2">
                <span className="text-gray-500">•</span>
                <div className="flex-1">
                  <p className="text-gray-900">{complaint.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn("text-xs", getSeverityColor(complaint.severity))}>
                      {getSeverityLabel(complaint.severity)}
                    </Badge>
                    {complaint.daysSince && (
                      <span className="text-xs text-gray-500">
                        {complaint.daysSince} day{complaint.daysSince > 1 ? "s" : ""} ago
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vitals Section */}
      {visibleSections.vitals && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b border-gray-200 pb-1">
            Vitals
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">BP:</span> {prescriptionData.vitals?.bloodPressure || "N/A"} mm/Hg
            </div>
            <div>
              <span className="font-semibold">Pulse:</span> {prescriptionData.vitals?.pulse || "N/A"} bpm
            </div>
            <div>
              <span className="font-semibold">Height:</span> {prescriptionData.vitals?.height || "N/A"} cm
            </div>
            <div>
              <span className="font-semibold">Weight:</span> {prescriptionData.vitals?.weight || "N/A"} kg
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {visibleSections.history && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b border-gray-200 pb-1">
            History
          </h3>
          <div className="space-y-2 text-sm">
            {prescriptionData.history?.allergies && (
              <div>
                <span className="font-semibold">Allergies:</span> {prescriptionData.history.allergies}
              </div>
            )}
            {prescriptionData.history?.personalHistory && (
              <div>
                <span className="font-semibold">Personal History:</span> {prescriptionData.history.personalHistory}
              </div>
            )}
            {prescriptionData.history?.pastMedicalHistory && (
              <div>
                <span className="font-semibold">Past Medical History:</span> {prescriptionData.history.pastMedicalHistory}
              </div>
            )}
            {prescriptionData.history?.familyHistory && (
              <div>
                <span className="font-semibold">Family History:</span> {prescriptionData.history.familyHistory}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Systemic Examination Section */}
      {visibleSections.systemicExamination && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b border-gray-200 pb-1">
            Systemic Examination
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">General:</span> {prescriptionData.systemicExamination?.general || "NAD"}
            </div>
            <div>
              <span className="font-semibold">CVS:</span> {prescriptionData.systemicExamination?.cvs || "NAD"}
            </div>
            <div>
              <span className="font-semibold">RS:</span> {prescriptionData.systemicExamination?.rs || "NAD"}
            </div>
            <div>
              <span className="font-semibold">CNS:</span> {prescriptionData.systemicExamination?.cns || "NAD"}
            </div>
          </div>
        </div>
      )}

      {/* Medicine Section */}
      {visibleSections.medicines && prescriptionData.medicines?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b border-gray-200 pb-1">
            Medicine
          </h3>
          <div className="space-y-3">
            {prescriptionData.medicines.map((medicine: any, index: number) => (
              <div key={medicine.id || index} className="border border-gray-200 rounded p-3">
                <div className="font-semibold text-gray-900 mb-2">{medicine.name}</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Frequency:</span> {medicine.frequency}
                  </div>
                  <div>
                    <span className="font-semibold">Time:</span> {medicine.medicineTime}
                  </div>
                  <div>
                    <span className="font-semibold">Duration:</span> {medicine.duration}
                  </div>
                  <div>
                    <span className="font-semibold">Quantity:</span> {medicine.quantity}
                  </div>
                </div>
                {medicine.instructions && (
                  <div className="mt-2 text-sm">
                    <span className="font-semibold">Instructions:</span> {medicine.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advice Section */}
      {visibleSections.advice && prescriptionData.advice && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b border-gray-200 pb-1">
            Advice
          </h3>
          <p className="text-gray-900 whitespace-pre-wrap">{prescriptionData.advice}</p>
        </div>
      )}

      {/* Tests Requested Section */}
      {visibleSections.testsRequested && prescriptionData.testsRequested && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b border-gray-200 pb-1">
            Tests Requested
          </h3>
          <p className="text-gray-900 whitespace-pre-wrap">{prescriptionData.testsRequested}</p>
        </div>
      )}

      {/* Next Visit Section */}
      {visibleSections.nextVisit && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3 text-gray-900 border-b border-gray-200 pb-1">
            Next Visit
          </h3>
          <div className="text-sm">
            {prescriptionData.nextVisitDate ? (
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {formatDate(new Date(prescriptionData.nextVisitDate))}
              </p>
            ) : (
              <p>
                <span className="font-semibold">After:</span> {prescriptionData.nextVisitValue || prescriptionData.nextVisit?.value}{" "}
                {prescriptionData.nextVisitType || prescriptionData.nextVisit?.type}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className="text-center text-sm text-gray-600">
          <p>This prescription is generated electronically</p>
          <p className="mt-1">Care Diabetics - Your Health, Our Priority</p>
        </div>
      </div>
    </div>
  );
} 