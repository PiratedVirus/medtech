"use client";

import { AllPatientsCard } from "@/components/pathology/AllPatientsCard";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function PatientsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Patients</CardTitle>
        <CardDescription>Patients who have registered for pathology services</CardDescription>
      </CardHeader>
      <CardContent>
        <AllPatientsCard />
      </CardContent>
    </Card>
  );
} 