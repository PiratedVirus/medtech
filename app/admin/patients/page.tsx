import { PatientViewCard } from "@/components/admin/PatientViewCard";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

export default function PatientCardsPage() {
  return (
    <Card>
    <CardHeader>
      <CardTitle>Your Patients </CardTitle>
      <CardDescription>Patients who registered till now</CardDescription>
    </CardHeader>
    <CardContent>
      <PatientViewCard />
    </CardContent>
  </Card>
  );
}