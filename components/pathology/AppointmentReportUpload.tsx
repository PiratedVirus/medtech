"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, CheckCircle } from "lucide-react";

interface Report {
  id: number;
  name: string;
  url: string;
  uploadedAt: string;
}

interface AppointmentReportUploadProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  patientName: string;
  existingReports?: Report[];
  onUploadComplete: (newReports: Report[]) => void;
}

export default function AppointmentReportUpload({
  isOpen,
  onClose,
  appointmentId,
  patientName,
  existingReports = [],
  onUploadComplete,
}: AppointmentReportUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file to upload");
      return;
    }

    setUploading(true);
    try {
      const uploadedReports: Report[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("appointmentId", appointmentId.toString());
        formData.append("patientName", patientName);

        const response = await fetch("/api/pathology/upload-appointment-report", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedReports.push({
            id: data.reportId,
            name: file.name,
            url: data.fileUrl,
            uploadedAt: new Date().toISOString(),
          });
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      const allReports = [...existingReports, ...uploadedReports];
      onUploadComplete(allReports);
      setUploadSuccess(true);
      setSelectedFiles([]);

      setTimeout(() => {
        setUploadSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error uploading reports:", error);
      alert("Error uploading reports. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setUploadSuccess(false);
    onClose();
  };

  if (uploadSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Reports Uploaded Successfully!
              </h3>
              <p className="text-gray-600">
                {selectedFiles.length} report(s) have been uploaded for {patientName}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            Upload Lab Reports for {patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Reports */}
          {existingReports.length > 0 && (
            <div>
              <Label className="text-base font-medium mb-3 block">Existing Reports</Label>
              <div className="grid grid-cols-1 gap-2">
                {existingReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm text-green-800">{report.name}</p>
                        <p className="text-xs text-green-600">
                          Uploaded: {new Date(report.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(report.url, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Upload New Reports</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your lab report files here, or click to browse
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" className="mt-2">
                  Choose Files
                </Button>
              </Label>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Files ({selectedFiles.length})</Label>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploading ? "Uploading..." : `Upload ${selectedFiles.length} File(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}