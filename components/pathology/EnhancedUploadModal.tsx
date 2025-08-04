"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, X, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { put } from "@vercel/blob";
import axios from "axios";
import { format } from "date-fns";

interface EnhancedUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  patientName: string;
  onUploadComplete: () => void;
}

export default function EnhancedUploadModal({
  isOpen,
  onClose,
  booking,
  patientName,
  onUploadComplete,
}: EnhancedUploadModalProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change event triggered");
    const selectedFiles = event.target.files;
    console.log("Selected files:", selectedFiles);
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles);
      console.log("Files set to state:", selectedFiles);
      console.log("Number of files:", selectedFiles.length);
      Array.from(selectedFiles).forEach((file, index) => {
        console.log(`File ${index + 1}:`, file.name, "Size:", file.size);
      });
    } else {
      console.log("No files selected");
    }
  };

  const generateFileName = (originalName: string, index: number) => {
    const date = format(new Date(), "yyyy-MM-dd");
    const testName = booking?.labPackageName || "lab-test";
    const extension = originalName.split('.').pop();
    const cleanPatientName = patientName?.replace(/[^a-zA-Z0-9]/g, "-") || "patient";
    const cleanTestName = testName?.replace(/[^a-zA-Z0-9]/g, "-") || "test";
    
    return `${cleanPatientName}-${cleanTestName}-${date}-${index + 1}.${extension}`;
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast.warning("Please select at least one file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedFiles([]);

    try {
      const uploadedLinks: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const newFileName = generateFileName(file.name, i);
        
        console.log(`Uploading file ${i + 1}/${totalFiles}: ${newFileName}`);
        
        const arrayBuffer = await file.arrayBuffer();
        const { url } = await put(newFileName, arrayBuffer, {
          access: "public",
          token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
        });

        uploadedLinks.push(url);
        setUploadedFiles(prev => [...prev, newFileName]);
        
        // Update progress
        const progress = ((i + 1) / totalFiles) * 100;
        setUploadProgress(progress);
      }

      // Update lab booking with uploaded reports
      const response = await axios.put(`/api/admin/dashboard/patients-details`, {
        labBookingId: booking?.id,
        links: uploadedLinks,
        status: "COMPLETED"
      });

      if (response.status === 200) {
        setUploadSuccess(true);
        toast.success("Lab reports uploaded successfully!");
        
        setTimeout(() => {
          setUploadSuccess(false);
          onUploadComplete();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setFiles(null);
    setUploading(false);
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadedFiles([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {uploadSuccess ? "Upload Complete" : "Upload Lab Reports"}
          </DialogTitle>
        </DialogHeader>

        {!uploadSuccess ? (
          <div className="space-y-6">
            {/* Booking Information */}
            <div className="bg-custom-mutedgreen p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Booking Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <span className="ml-2 font-medium">{patientName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Test:</span>
                  <span className="ml-2 font-medium">{booking?.labPackageName || "Lab Test"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-medium">{booking?.date ? format(new Date(booking.date), "dd-MMM-yyyy") : "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800">{booking?.status || "Pending"}</Badge>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors"
                onDrop={(e) => {
                  e.preventDefault();
                  console.log("Files dropped:", e.dataTransfer.files);
                  if (e.dataTransfer.files.length > 0) {
                    setFiles(e.dataTransfer.files);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                }}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop your lab report files here, or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id={`enhanced-upload-files-${booking?.id || 'default'}`}
                  disabled={uploading}
                  ref={(input) => {
                    if (input) {
                      input.setAttribute('data-testid', 'file-input');
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  className="mt-2" 
                  disabled={uploading}
                  onClick={() => {
                    console.log("Choose Files button clicked");
                    const fileInput = document.getElementById(`enhanced-upload-files-${booking?.id || 'default'}`);
                    console.log("File input element:", fileInput);
                    if (fileInput) {
                      fileInput.click();
                      console.log("File input clicked");
                    } else {
                      console.error("File input not found");
                    }
                  }}
                >
                  Choose Files
                </Button>
                {files && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                    {Array.from(files).map((file, index) => (
                      <div key={index} className="flex items-center justify-center space-x-2 text-sm">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{file.name}</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-blue-600">{generateFileName(file.name, index)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                {uploadedFiles.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <p>Uploaded:</p>
                    {uploadedFiles.map((fileName, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{fileName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!files || files.length === 0 || uploading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Upload className="h-4 w-4 mr-1" />
                {uploading ? "Uploading..." : "Upload Reports"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Lab Reports Uploaded Successfully!
              </h3>
              <p className="text-gray-600">
                The lab reports for {patientName} have been uploaded and processed.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <span className="ml-2 font-medium">{patientName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Files Uploaded:</span>
                  <span className="ml-2 font-medium">{uploadedFiles.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Test:</span>
                  <span className="ml-2 font-medium">{booking?.labPackageName || "Lab Test"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className="ml-2 bg-green-100 text-green-800">Completed</Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 