import { AllPatientsCard } from "@/components/admin/AllPatientsCard";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function PatientCardsPage() {
  return (
    <Card>
    <CardHeader>
      <CardTitle>All Patients</CardTitle>
      <CardDescription>Patients who registered till now</CardDescription>
    </CardHeader>
    <CardContent>
      <AllPatientsCard />
    </CardContent>
  </Card>
  );
}