import { Suspense } from 'react';
import CdLoader from "@/components/ui/custom/cd-loader";
import DoctorPatientDetailsClient from './DoctorPatientDetailsClient';

export default async function DoctorPatientDetailsPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  return (
    <Suspense fallback={<CdLoader />}>
      <DoctorPatientDetailsClient patientId={patientId} />
    </Suspense>
  );
}