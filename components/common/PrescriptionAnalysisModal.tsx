'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, FileText, Calendar, User, RefreshCw, Trash2 } from 'lucide-react';
import PatientAISummaryRow from '@/components/doctors/patients/PatientAISummaryRow';

interface PrescriptionAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: any;
  onRegenerate?: (prescriptionId: number) => void;
  onDelete?: (prescriptionId: number) => void;
  loading?: boolean;
}

export default function PrescriptionAnalysisModal({
  isOpen,
  onClose,
  prescription,
  onRegenerate,
  onDelete,
  loading = false
}: PrescriptionAnalysisModalProps) {

  if (!prescription) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prescription Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prescription Summary - Using the exact same component from doctors side */}
          <div className="grid grid-cols-1">
            <PatientAISummaryRow patientId={prescription.id} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {onRegenerate && (
              <Button
                onClick={() => onRegenerate(prescription.id)}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(prescription.id)}
                disabled={loading}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
