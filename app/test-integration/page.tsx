"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateAndDownloadPDF } from "@/components/prescription/PrescriptionPDF";
import { useState } from "react";

export default function IntegrationTestPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestWithRealData = async () => {
    setIsLoading(true);
    try {
      // Simulate real prescription data structure
      const prescriptionData = {
        id: "PRES-001",
        complaints: [
          { id: "1", text: "Headache", severity: "MODERATE", daysSince: 3 },
          { id: "2", text: "Fever", severity: "GOOD", daysSince: 1 }
        ],
        vitals: {
          bloodPressure: "120/80",
          pulse: "72",
          height: "175",
          weight: "70"
        },
        history: {
          allergies: "None",
          personalHistory: "No significant history",
          pastMedicalHistory: "Hypertension",
          familyHistory: "Diabetes in family"
        },
        systemicExamination: {
          general: "Conscious, oriented",
          cvs: "NAD",
          rs: "NAD",
          cns: "NAD"
        },
        medicines: [
          {
            id: "1",
            name: "Paracetamol 500mg",
            frequency: "3 times daily",
            medicineTime: "After meals",
            duration: "5 days",
            quantity: "15 tablets",
            instructions: "Take with water"
          },
          {
            id: "2",
            name: "Ibuprofen 400mg",
            frequency: "2 times daily",
            medicineTime: "Before meals",
            duration: "3 days",
            quantity: "6 tablets",
            instructions: "Take with food"
          }
        ],
        advice: "Take rest and drink plenty of water\nAvoid spicy food\nFollow up in 7 days",
        testsRequested: "Complete Blood Count, Blood Sugar",
        nextVisit: {
          type: "days",
          value: 7,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        diagnosis: "Viral fever with headache"
      };

      const patientInfo = {
        name: "John Doe",
        patientId: "PAT-001",
        prescriptionId: "PRES-001",
        phone: "1234567890"
      };

      const doctorInfo = {
        name: "Dr. Sarah Johnson",
        id: "DOC-001"
      };

      const clinicInfo = {
        name: "Care Diabetics Hospital",
        subtitle: "AIIMS (NEW DELHI) ALUMNI INITIATIVE",
        address: "123 Medical Center, Springfield, IL 62704",
        timings: "Mon - Sat (9:00 AM to 5:00 PM)"
      };

      const appointmentId = "APT-001";

      // Generate PDF using frontend
      const result = await generateAndDownloadPDF(
        prescriptionData,
        patientInfo,
        doctorInfo,
        clinicInfo,
        appointmentId
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "Integration test PDF generated successfully!",
          variant: "success",
        });
      } else {
        throw new Error((result as any).error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error("Integration test error:", error);
      toast({
        title: "Error",
        description: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Integration Test</h1>
        <p className="text-gray-600 mb-6">
          This tests PDF generation with realistic prescription data structure.
        </p>
        <Button 
          onClick={handleTestWithRealData} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Generating PDF..." : "Test Integration"}
        </Button>
        <div className="mt-4 text-center">
          <a href="/test-pdf" className="text-blue-600 hover:underline text-sm">
            Back to PDF Tests
          </a>
        </div>
      </div>
    </div>
  );
} 