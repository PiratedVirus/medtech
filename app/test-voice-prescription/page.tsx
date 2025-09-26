"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// VoiceInput component removed - voice functionality is built into PrescriptionForm

interface PrescriptionData {
  complaints: any[];
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
  medicines: any[];
  advice: string;
  testsRequested: string;
  nextVisit: {
    type: string;
    value: number;
  };
}

export default function TestVoicePrescriptionPage() {
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({
    complaints: [],
    vitals: { bloodPressure: "", pulse: "", height: "", weight: "" },
    history: { allergies: "", personalHistory: "", pastMedicalHistory: "", familyHistory: "" },
    systemicExamination: { general: "", cvs: "NAD", rs: "NAD", cns: "NAD" },
    medicines: [],
    advice: "",
    testsRequested: "",
    nextVisit: { type: "days", value: 7 }
  });
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  const handleVoiceTranscriptionComplete = (voiceData: any) => {
    setPrescriptionData(prev => ({
      ...prev,
      complaints: [...prev.complaints, ...(voiceData.complaints || [])],
      vitals: { ...prev.vitals, ...(voiceData.vitals || {}) },
      history: { ...prev.history, ...(voiceData.history || {}) },
      systemicExamination: { ...prev.systemicExamination, ...(voiceData.systemicExamination || {}) },
      medicines: [...prev.medicines, ...(voiceData.medicines || [])],
      advice: voiceData.advice || prev.advice,
      testsRequested: voiceData.testsRequested || prev.testsRequested,
      nextVisit: voiceData.nextVisit || prev.nextVisit,
    }));
  };

  const clearData = () => {
    setPrescriptionData({
      complaints: [],
      vitals: { bloodPressure: "", pulse: "", height: "", weight: "" },
      history: { allergies: "", personalHistory: "", pastMedicalHistory: "", familyHistory: "" },
      systemicExamination: { general: "", cvs: "NAD", rs: "NAD", cns: "NAD" },
      medicines: [],
      advice: "",
      testsRequested: "",
      nextVisit: { type: "days", value: 7 }
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Voice Prescription Input Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Voice input functionality is integrated into the PrescriptionForm component.
            </p>
            <p className="text-sm text-gray-500">
              To test voice input, use the prescription form in the doctor dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Extracted Prescription Data
            <Button onClick={clearData} variant="outline" size="sm">
              Clear All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Complaints */}
            {prescriptionData.complaints.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Complaints:</h4>
                <div className="space-y-1">
                  {prescriptionData.complaints.map((complaint: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                      <strong>{complaint.text}</strong> - {complaint.severity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vitals */}
            {(prescriptionData.vitals.bloodPressure || prescriptionData.vitals.pulse || prescriptionData.vitals.height || prescriptionData.vitals.weight) && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Vitals:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {prescriptionData.vitals.bloodPressure && (
                    <div>BP: {prescriptionData.vitals.bloodPressure}</div>
                  )}
                  {prescriptionData.vitals.pulse && (
                    <div>Pulse: {prescriptionData.vitals.pulse}</div>
                  )}
                  {prescriptionData.vitals.height && (
                    <div>Height: {prescriptionData.vitals.height}</div>
                  )}
                  {prescriptionData.vitals.weight && (
                    <div>Weight: {prescriptionData.vitals.weight}</div>
                  )}
                </div>
              </div>
            )}

            {/* Medicines */}
            {prescriptionData.medicines.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Medicines:</h4>
                <div className="space-y-1">
                  {prescriptionData.medicines.map((medicine: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                      <strong>{medicine.name}</strong> - {medicine.frequency} - {medicine.medicineTime} - {medicine.duration}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advice */}
            {prescriptionData.advice && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Advice:</h4>
                <div className="bg-gray-50 p-2 rounded text-sm">{prescriptionData.advice}</div>
              </div>
            )}

            {/* Tests Requested */}
            {prescriptionData.testsRequested && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Tests Requested:</h4>
                <div className="bg-gray-50 p-2 rounded text-sm">{prescriptionData.testsRequested}</div>
              </div>
            )}

            {/* Raw Data */}
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Raw Data:</h4>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(prescriptionData, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Try saying:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>"Patient has fever and headache, blood pressure 120 over 80, pulse 72, prescribe paracetamol 500 milligrams twice daily for 5 days"</li>
              <li>"Patient complains of chest pain, prescribe aspirin 75 milligrams once daily, advise rest and follow up in 7 days"</li>
              <li>"Patient has diabetes, blood sugar high, prescribe metformin 500 milligrams twice daily with meals, order HbA1c test"</li>
              <li>"Patient has cough and cold, prescribe amoxicillin 250 milligrams three times daily for 7 days, advise plenty of fluids"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
