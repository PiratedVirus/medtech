"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/router";

export function NewPatientsCards() {
  const [newPatients, setNewPatients] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchNewPatients = async () => {
      try {
        const response = await axios.get("/api/admin-dashboard/new-patients");
        setNewPatients(response.data);
      } catch (error) {
        console.error("Failed to fetch new patients:", error);
      }
    };

    fetchNewPatients();
  }, []);

  const handleCardClick = (patientId) => {
    router.push(`/admin/patient-details/${patientId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {newPatients.map((patient) => (
        <Card key={patient.id} onClick={() => handleCardClick(patient.id)} className="cursor-pointer">
          <CardHeader>
            <CardTitle>{patient.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Email: {patient.email}</p>
            <p>Joined On: {new Date(patient.joinedOn).toLocaleDateString()}</p>
            <p>Plan: {patient.plan}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
