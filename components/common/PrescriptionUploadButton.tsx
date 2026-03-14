'use client';

import { useRef, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText } from 'lucide-react';
import { useReportUploadNotifications } from '@/hooks/context/ReportUploadNotificationsContext';

interface PrescriptionUploadButtonProps {
  patientId: number;
  onUploadSuccess?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export default function PrescriptionUploadButton({
  patientId,
  onUploadSuccess,
  variant = 'outline',
  size = 'sm',
  className = '',
}: PrescriptionUploadButtonProps) {
  const { toast } = useToast();
  const { createUploadNotification, markUploadSucceeded, markUploadFailed } = useReportUploadNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only PDF and image files are allowed.' });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum file size is 10MB.' });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const extension = file.name.split(".").pop();
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "report";
    const renamedFileName = `patient_${patientId}_${fileNameWithoutExt}_${datePart}.${extension}`;
    const renamedFile = new File([file], renamedFileName, { type: file.type, lastModified: file.lastModified });

    setUploading(true);
    const notificationId = createUploadNotification({
      fileName: renamedFileName,
      reportType: 'prescription',
      patientId,
      source: 'standalone',
    });

    try {
      const formData = new FormData();
      formData.append('patientId', String(patientId));
      formData.append('reportType', 'prescription');
      formData.append('file', renamedFile);

      const response = await axios.post('/api/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Upload failed');
      }

      markUploadSucceeded(notificationId, response.data.report.id);
      toast({ variant: 'success', title: 'Prescription uploaded successfully' });
      onUploadSuccess?.();
      setIsOpen(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      markUploadFailed(notificationId, error?.message || 'Upload failed');
      toast({ variant: 'destructive', title: 'Upload failed', description: error?.message || 'An error occurred while uploading the prescription.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setIsOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Upload Prescription
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Prescription</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Select prescription file</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                Choose File
              </Button>
              <p className="text-xs text-gray-500 mt-2">Supported formats: PDF/JPG/PNG. Max size: 10MB</p>
            </div>

            {file && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={uploading}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? 'Uploading...' : 'Upload Prescription'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
