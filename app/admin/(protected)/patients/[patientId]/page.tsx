import { Suspense } from 'react';
import CdLoader from "@/components/ui/custom/cd-loader";
import PatientDetailsClient from './PatientDetailsClient';

interface PageProps {
  params: {
    patientId: string;
  };
}

export default function PatientDetailsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<CdLoader />}>
      <PatientDetailsClient patientId={params.patientId} />
    </Suspense>
  );
}