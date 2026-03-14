'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnifiedReportUploadModal from '@/components/common/UnifiedReportUploadModal';

interface ReportUploadButtonProps {
  patientId: number;
  patientName?: string;
  onUploadSuccess?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export default function ReportUploadButton({
  patientId,
  patientName,
  onUploadSuccess,
  variant = 'outline',
  size = 'sm',
  className = '',
  children,
}: ReportUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setIsOpen(true)} className={className}>
        {children || (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload Lab Report
          </>
        )}
      </Button>

      <UnifiedReportUploadModal
        mode="standalone"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        patientId={patientId}
        patientName={patientName}
        onUploadSuccess={onUploadSuccess}
      />
    </>
  );
}
