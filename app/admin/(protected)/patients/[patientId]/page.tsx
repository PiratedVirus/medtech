import { Suspense } from 'react';
import CdLoader from "@/components/ui/custom/cd-loader";
import PatientDetailsClient from './PatientDetailsClient';

export default async function PatientDetailsPage({ params }: any) {
  const { patientId } = await params;
  
  return (
    <Suspense fallback={<CdLoader />}>
      <PatientDetailsClient patientId={patientId} />
    </Suspense>
  );
}