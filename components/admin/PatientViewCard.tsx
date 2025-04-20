"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

export function PatientViewCard() {
  const [newPatients, setNewPatients] = useState<Patient[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchNewPatients = async () => {
      try {
        const response = await axios.get("/api/admin/dashboard/patients-details");
        console.log("New Patients Data:", response.data);
        setNewPatients(response.data);
      } catch (error) {
        console.error("Failed to fetch new patients:", error);
      }
    };

    fetchNewPatients();
  }, []);

  interface Patient {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    joinedOn: string;
    plan: string;
    patientProfile?: {
      planTrackers?: Array<{
        plan?: {
          name?: string;
        };
      }>;
    };
  }

  const handleCardClick = (patientId: string): void => {
    router.push(`/admin/patients/${patientId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {newPatients.map((patient) => (
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
