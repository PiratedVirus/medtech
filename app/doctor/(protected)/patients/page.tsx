import { DoctorPatientsCard } from "@/components/doctors/patients/DoctorPatientsCard";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function DoctorPatientsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Patients</CardTitle>
        <CardDescription>Patients who have appointments with you</CardDescription>
      </CardHeader>
      <CardContent>
        <DoctorPatientsCard />
      </CardContent>
    </Card>
  );
} 