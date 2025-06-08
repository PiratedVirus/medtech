import { Suspense } from 'react';
import CdLoader from "@/components/ui/custom/cd-loader";
import PatientDetailsClient from './PatientDetailsClient';

export default function PatientDetailsPage({ params }: any) {
  return (
    <Suspense fallback={<CdLoader />}>
      <PatientDetailsClient patientId={params.patientId} />
    </Suspense>
  );
}