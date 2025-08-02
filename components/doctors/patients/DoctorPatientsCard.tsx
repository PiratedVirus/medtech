"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { useDecryptedProfile } from "@/hooks/use-profile";

export function DoctorPatientsCard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { profile } = useDecryptedProfile();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        console.log("Fetching patients for doctor");
        const response = await axios.get(`/api/doctor/patients`);
        console.log("Doctor Patients Data:", response.data);
        setPatients(response.data);
      } catch (error) {
        console.error("Failed to fetch patients:", error);
        console.error("Error details:", error.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  interface Patient {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    createdAt: string;
    patientProfile?: {
      planTrackers?: Array<{
        plan?: {
          name?: string;
        };
      }>;
    };
  }

  const handleCardClick = (patientId: string): void => {
    router.push(`/doctor/patients/${patientId}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="px-2">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have any patients yet. Patients will appear here once they book appointments with you.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {patients.map((patient) => (
        <Card
          key={patient.id}
          onClick={() => handleCardClick(patient.id)}
          className="relative overflow-hidden cursor-pointer border bg-custom-mutedgreen rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <div className="absolute -right-6 -top-6 opacity-10">
            <User size={100} />
          </div>
          <CardHeader className="relative px-2 z-10">
            <CardTitle className="text-xl font-semibold text-secondary">{patient.name}</CardTitle>
            <div className="mt-1">
              <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${patient.patientProfile?.planTrackers && patient.patientProfile.planTrackers.length > 0 && patient.patientProfile.planTrackers[0].plan?.name ? 'bg-green-700  text-white' : 'bg-gray-200 text-gray-600'}`}>
                {patient.patientProfile?.planTrackers?.length && patient.patientProfile.planTrackers[0]?.plan?.name
                  ? patient.patientProfile.planTrackers[0].plan.name
                  : "Not Subscribed"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-2 text-sm text-gray-700">
            <div className="flex items-center justify-between font-semibold">
              <span>{patient.email}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">{patient.phoneNumber}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 