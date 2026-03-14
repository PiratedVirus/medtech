'use client';

import UnifiedReportUploadModal from '@/components/common/UnifiedReportUploadModal';

interface ConsolidatedUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  patientName: string;
  onUploadComplete: () => void;
}

export default function ConsolidatedUploadModal({
  isOpen,
  onClose,
  booking,
  patientName,
  onUploadComplete,
}: ConsolidatedUploadModalProps) {
  return (
    <UnifiedReportUploadModal
      mode="lab-booking"
      isOpen={isOpen}
      onClose={onClose}
      booking={booking}
      patientName={patientName}
      onUploadComplete={onUploadComplete}
    />
  );
}
