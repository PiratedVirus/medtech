"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Calendar, TestTube, Droplets, FileText, Clock, MapPin } from "lucide-react";
import { useParams } from "next/navigation";

interface Patient {
  id: number;
  name: string;
  patientId: string;
  gender: string;
  mobile: string;
  address: string;
  lastVisit: string;
  plan: string;
}

interface LabAssignment {
  id: number;
  status: string;
  assignedDate: string;
  assignedTime: string;
  estimatedDelivery: string;
  phlebotomist: {
    user: {
      name: string;
    };
  };
}

interface TimelineStep {
  id: number;
  title: string;
  status: "completed" | "in-progress" | "pending";
  icon: React.ReactNode;
  description: string;
}

export default function PatientDetailsPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [labAssignment, setLabAssignment] = useState<LabAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      const response = await fetch(`/api/pathology/patients/${patientId}`);
      const data = await response.json();
      setPatient(data.patient);
      setLabAssignment(data.labAssignment);
    } catch (error) {
      console.error("Error fetching patient details:", error);
    } finally {
      setLoading(false);
    }
  };

  const timelineSteps: TimelineStep[] = [
    {
      id: 1,
      title: "Phlebotomist Status",
      status: "completed",
      icon: <Droplets className="h-5 w-5 text-green-600" />,
      description: "Phlebotomist Left"
    },
    {
      id: 2,
      title: "Sample Status",
      status: "completed",
      icon: <TestTube className="h-5 w-5 text-green-600" />,
      description: "Sample Collected"
    },
    {
      id: 3,
      title: "Analyze by Lab",
      status: "in-progress",
      icon: <FileText className="h-5 w-5 text-orange-600" />,
      description: "In Progress.."
    },
    {
      id: 4,
      title: "Reported",
      status: "pending",
      icon: <FileText className="h-5 w-5 text-red-600" />,
      description: "Pending"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
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

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Patient Info</h1>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString("en-GB")} | {new Date().toLocaleTimeString("en-US", { hour12: true })} <Calendar className="inline ml-1 h-4 w-4" />
        </div>
      </div>

      {/* Patient Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Details */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                <p className="text-sm text-green-600">Patient ID: {patient.patientId}</p>
                <p className="text-sm text-green-600">Gender: {patient.gender}</p>
                <p className="text-sm text-green-600">Mobile: {patient.mobile}</p>
                <p className="text-sm text-green-600">Address: {patient.address}</p>
                <p className="text-sm text-green-600">Last Visit: {patient.lastVisit}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Plan */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Patient Plan: <span className="text-orange-600">{patient.plan}</span> Package
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TestTube className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">HBA1C</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Droplets className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-sm text-gray-700">FBS</span>
              </div>
            </div>
            <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white">
              Lab Report
            </Button>
          </CardContent>
        </Card>

        {/* Assigned Phlebotomist */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Assigned Phlebotomist</h3>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center">
                <User className="h-8 w-8 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{labAssignment?.phlebotomist.user.name || "Phlebotomist Name"}</p>
                <p className="text-sm text-gray-600">Medical Director Senior Consultant & Head (Respiratory Medicine)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Timeline</h2>
          <div className="text-sm text-gray-600">
            Estimated Delivery: {labAssignment?.estimatedDelivery || "25-12-2024"}
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="relative mb-8">
          <div className="flex items-center justify-between">
            {timelineSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === "completed" ? "bg-green-500" :
                  step.status === "in-progress" ? "bg-orange-500" : "bg-gray-300"
                }`}>
                  {step.icon}
                </div>
                {index < timelineSteps.length - 1 && (
                  <div className={`w-16 h-1 mt-2 ${
                    step.status === "completed" ? "bg-green-500" : "bg-gray-300"
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {timelineSteps.map((step) => (
            <Card key={step.id} className="bg-white border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  {step.icon}
                  <h3 className="font-semibold text-gray-800">{step.title}</h3>
                </div>
                <Badge 
                  variant={
                    step.status === "completed" ? "default" :
                    step.status === "in-progress" ? "secondary" : "destructive"
                  }
                  className={
                    step.status === "completed" ? "bg-green-100 text-green-800" :
                    step.status === "in-progress" ? "bg-orange-100 text-orange-800" :
                    "bg-red-100 text-red-800"
                  }
                >
                  {step.description}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 