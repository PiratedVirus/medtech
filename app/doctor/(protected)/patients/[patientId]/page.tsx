import { Suspense } from 'react';
import CdLoader from "@/components/ui/custom/cd-loader";
import DoctorPatientDetailsClient from './DoctorPatientDetailsClient';

export default function DoctorPatientDetailsPage({ params }: any) {
  return (
    <Suspense fallback={<CdLoader />}>
      <DoctorPatientDetailsClient patientId={params.patientId} />
    </Suspense>
  );
} 