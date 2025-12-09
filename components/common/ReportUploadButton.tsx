'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Microscope, Pill, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import axios from 'axios';

interface ReportUploadButtonProps {
  patientId: number;
  onUploadSuccess?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

interface ProcessingStage {
  stage: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  timestamp: Date;
}

interface ProcessingNotification {
  id: string;
  fileName: string;
  reportType: string;
  stages: ProcessingStage[];
  overallStatus: 'processing' | 'completed' | 'failed';
  reportId?: number;
}

const REPORT_TYPES = [
  { value: 'lab_report', label: 'Lab Report', icon: Microscope },
  { value: 'prescription', label: 'Prescription', icon: Pill },
  { value: 'medical_document', label: 'Medical Document', icon: FileText },
];

export default function ReportUploadButton({
  patientId,
  onUploadSuccess,
  variant = 'outline',
  size = 'sm',
  className = '',
  children
}: ReportUploadButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processingNotifications, setProcessingNotifications] = useState<ProcessingNotification[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll for processing updates
  useEffect(() => {
    if (processingNotifications.length === 0) return;

    const interval = setInterval(async () => {
      const activeNotifications = processingNotifications.filter(n => n.overallStatus === 'processing');
      
      for (const notification of activeNotifications) {
        if (notification.reportId) {
          try {
            const response = await fetch(`/api/reports/upload?patientId=${patientId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.reports) {
                const report = data.reports.find((r: any) => r.id === notification.reportId);
                if (report && report.reportAnalyses.length > 0) {
                  const analysis = report.reportAnalyses[0];
                  updateProcessingStatus(notification.id, analysis);
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch processing status:', error);
          }
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [processingNotifications, patientId]);

  const updateProcessingStatus = (notificationId: string, analysis: any) => {
    setProcessingNotifications(prev => prev.map(notification => {
      if (notification.id !== notificationId) return notification;

      const stages: ProcessingStage[] = [];
      let overallStatus: 'processing' | 'completed' | 'failed' = 'processing';

      // Determine stages based on processingError and status
      if (analysis.processingStatus === 'COMPLETED') {
        stages.push(
          { stage: 'Text Extraction', status: 'completed', message: 'Text extracted successfully', timestamp: new Date() },
          { stage: 'Summary Generation', status: 'completed', message: 'Summary generated successfully', timestamp: new Date() },
          { stage: 'Value Extraction', status: 'completed', message: 'Lab values extracted successfully', timestamp: new Date() }
        );
        overallStatus = 'completed';
      } else if (analysis.processingStatus === 'FAILED') {
        stages.push(
          { stage: 'Text Extraction', status: 'failed', message: analysis.processingError || 'Failed', timestamp: new Date() }
        );
        overallStatus = 'failed';
      } else if (analysis.processingStatus === 'PROCESSING') {
        // Parse the processing error to determine current stage
        const errorMsg = analysis.processingError || '';
        if (errorMsg.includes('Stage 1')) {
          stages.push(
            { stage: 'Text Extraction', status: 'processing', message: 'Extracting text from file...', timestamp: new Date() }
          );
        } else if (errorMsg.includes('Stage 2')) {
          stages.push(
            { stage: 'Text Extraction', status: 'completed', message: 'Text extracted successfully', timestamp: new Date() },
            { stage: 'Summary Generation', status: 'processing', message: 'Generating summary...', timestamp: new Date() }
          );
        } else if (errorMsg.includes('Stage 3')) {
          stages.push(
            { stage: 'Text Extraction', status: 'completed', message: 'Text extracted successfully', timestamp: new Date() },
            { stage: 'Summary Generation', status: 'completed', message: 'Summary generated successfully', timestamp: new Date() },
            { stage: 'Value Extraction', status: 'processing', message: 'Extracting lab values...', timestamp: new Date() }
          );
        }
      }

      return { ...notification, stages, overallStatus };
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Only PDF and image files are allowed.'
        });
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Maximum file size is 10MB.'
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!reportType || !file) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select a report type and file.'
      });
      return;
    }

    setUploading(true);
    
    // Create processing notification
    const notificationId = `notification-${Date.now()}`;
    const notification: ProcessingNotification = {
      id: notificationId,
      fileName: file.name,
      reportType,
      stages: [
        { stage: 'Upload', status: 'processing', message: 'Uploading file...', timestamp: new Date() }
      ],
      overallStatus: 'processing'
    };
    
    setProcessingNotifications(prev => [...prev, notification]);

    try {
      const formData = new FormData();
      formData.append('patientId', patientId.toString());
      formData.append('reportType', reportType);
      formData.append('file', file);

      const response = await axios.post('/api/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update notification with upload success
        setProcessingNotifications(prev => prev.map(n => 
          n.id === notificationId 
            ? { 
                ...n, 
                reportId: response.data.report.id,
                stages: [
                  { stage: 'Upload', status: 'completed', message: 'File uploaded successfully', timestamp: new Date() },
                  { stage: 'Text Extraction', status: 'pending', message: 'Waiting to start...', timestamp: new Date() }
                ]
              }
            : n
        ));

        toast({
          variant: 'success',
          title: 'Report uploaded successfully',
          description: 'Processing will begin shortly. Check the notification for progress updates.'
        });
        
        setIsOpen(false);
        setReportType('');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error: any) {
      // Update notification with failure
      setProcessingNotifications(prev => prev.map(n => 
        n.id === notificationId 
          ? { 
              ...n, 
              overallStatus: 'failed',
              stages: [
                { stage: 'Upload', status: 'failed', message: error?.message || 'Upload failed', timestamp: new Date() }
              ]
            }
          : n
      ));

      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error?.message || 'An error occurred while uploading the report.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    setReportType('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getReportTypeIcon = (type: string) => {
    const reportType = REPORT_TYPES.find(rt => rt.value === type);
    if (reportType) {
      const Icon = reportType.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const removeNotification = (id: string) => {
    setProcessingNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenDialog}
        className={className}
      >
        {children || (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload Report
          </>
        )}
      </Button>

      {/* Processing Notifications */}
      {processingNotifications.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
          {processingNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-lg border p-4 ${
                notification.overallStatus === 'completed' ? 'border-green-200' :
                notification.overallStatus === 'failed' ? 'border-red-200' :
                'border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getReportTypeIcon(notification.reportType)}
                  <div>
                    <h4 className="font-medium text-sm">{notification.fileName}</h4>
                    <p className="text-xs text-gray-500 capitalize">{notification.reportType.replace('_', ' ')}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNotification(notification.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {notification.stages.map((stage, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {getStageIcon(stage.status)}
                    <span className={`flex-1 ${
                      stage.status === 'completed' ? 'text-green-700' :
                      stage.status === 'failed' ? 'text-red-700' :
                      stage.status === 'processing' ? 'text-blue-700' :
                      'text-gray-500'
                    }`}>
                      {stage.stage}
                    </span>
                    <span className="text-xs text-gray-400">
                      {stage.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>

              {notification.overallStatus === 'completed' && (
                <div className="mt-3 pt-2 border-t border-green-200">
                  <p className="text-sm text-green-700 font-medium">✅ Processing completed successfully!</p>
                </div>
              )}

              {notification.overallStatus === 'failed' && (
                <div className="mt-3 pt-2 border-t border-red-200">
                  <p className="text-sm text-red-700 font-medium">❌ Processing failed. Please try again.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Medical Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {getReportTypeIcon(type.value)}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, JPG, PNG. Max size: 10MB
              </p>
            </div>

            {file && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="bg-white text-gray-900 border-gray-200 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={handleUpload}
                disabled={!reportType || !file || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
