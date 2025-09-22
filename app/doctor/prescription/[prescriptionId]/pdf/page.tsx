"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, Download, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
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

export default function PrescriptionPDFPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const prescriptionId = params.prescriptionId as string;
  
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [patientInfo, setPatientInfo] = useState({
    name: "Mr. Mani Krishna",
    patientId: "81243",
    prescriptionId: "8541302",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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
    fetchPrescription();
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    try {
      const response = await fetch(`/api/doctor/prescription?prescriptionId=${prescriptionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch prescription");
      }
      
      const result = await response.json();
      setPrescriptionData(result.data);
    } catch (error) {
      console.error("Error fetching prescription:", error);
      toast({
        title: "Error",
        description: "Failed to load prescription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!prescriptionData || !patientInfo) {
        toast({ title: "Error", description: "Missing prescription data", variant: "destructive" });
        return;
      }

      // Mock doctor and clinic info for this page
      const doctorInfo = {
        name: "Dr. Smith",
        id: "DOC001"
      };

      const clinicInfo = {
        name: "Care Diabetics Hospital",
        subtitle: "AIIMS (NEW DELHI) ALUMNI INITIATIVE",
        address: "123 Medical Center, City",
        timings: "Mon - Sat (9:00 AM to 5:00 PM)"
      };

      // Generate PDF using frontend
      const result = await generateAndDownloadPDF(
        prescriptionData,
        patientInfo,
        doctorInfo,
        clinicInfo,
        prescriptionId,
        visibleSections
      );

      if (result.success) {
        toast({ title: "Success", description: "PDF downloaded successfully", variant: "success" });
      } else {
        throw new Error((result as any).error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const toggleSection = (section: string) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (!prescriptionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Prescription not found</p>
          <Link href="/doctor/appointments">
            <Button className="mt-4">Back to Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b min-h-screen border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/doctor/appointments">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Appointments
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Prescription PDF</h1>
                <p className="text-sm text-gray-500">Prescription #{prescriptionId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Done" : "Edit"}
              </Button>
              <Button onClick={handleDownloadPDF} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Side - Section Controls (when editing) */}
          {isEditing && (
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8">
                <h3 className="text-lg font-semibold mb-4">Section Visibility</h3>
                <div className="space-y-3">
                  {Object.entries(visibleSections).map(([section, visible]) => (
                    <div key={section} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {section.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection(section)}
                        className="h-8 w-8 p-0"
                      >
                        {visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Right Side - PDF Preview */}
          <div className={isEditing ? "lg:col-span-3" : "lg:col-span-4"}>
            <Card className="p-6">
              <PrescriptionPreview
                prescriptionData={prescriptionData}
                patientInfo={patientInfo}
                visibleSections={visibleSections}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 