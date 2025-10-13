"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, FileText, CheckCircle, X, Edit2, Eye, Download, 
  Trash2, Save, X as CloseIcon, Plus
} from "lucide-react";
import { toast } from "react-toastify";
import { put } from "@vercel/blob";
import axios from "axios";
import { format } from "date-fns";

interface ConsolidatedUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  patientName: string;
  onUploadComplete: () => void;
}

interface ReportFile {
  id: string;
  originalName: string;
  displayName: string;
  url: string;
  isEditing: boolean;
  isNew?: boolean;
}

export default function ConsolidatedUploadModal({
  isOpen,
  onClose,
  booking,
  patientName,
  onUploadComplete,
}: ConsolidatedUploadModalProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [reportFiles, setReportFiles] = useState<ReportFile[]>([]);
  const [editingFileName, setEditingFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing reports when modal opens
  useEffect(() => {
    if (isOpen && booking?.labBooking?.labResult) {
      const existingFiles: ReportFile[] = booking.labBooking.labResult.map((url: string, index: number) => ({
        id: `existing-${index}`,
        originalName: url.split('/').pop() || `Report ${index + 1}`,
        displayName: url.split('/').pop() || `Report ${index + 1}`,
        url,
        isEditing: false,
      }));
      setReportFiles(existingFiles);
    }
  }, [isOpen, booking]);

  const generateUniqueFileName = (originalName: string): string => {
    const timestamp = format(new Date(), "yyyyMMdd-HHmmss");
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const cleanPatientName = patientName?.replace(/[^a-zA-Z0-9]/g, "-") || "patient";
    const testName = booking?.labPackageName?.replace(/[^a-zA-Z0-9]/g, "-") || "test";
    
    return `${cleanPatientName}-${testName}-${nameWithoutExt}-${timestamp}.${extension}`;
  };

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
        const newFileName = generateUniqueFileName(file.name);
        
        console.log(`Uploading file ${i + 1}/${totalFiles}: ${newFileName}`);
        
        const arrayBuffer = await file.arrayBuffer();
        const { url } = await put(newFileName, arrayBuffer, {
          access: "public",
          token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
        });

        uploadedLinks.push(url);
        setUploadedFiles(prev => [...prev, newFileName]);
        
        // Add new file to the list
        setReportFiles(prev => [...prev, {
          id: `new-${Date.now()}-${i}`,
          originalName: file.name,
          displayName: newFileName,
          url,
          isEditing: false,
          isNew: true,
        }]);
        
        // Update progress
        const progress = ((i + 1) / totalFiles) * 100;
        setUploadProgress(progress);
      }

      // Update lab booking with uploaded reports
      const response = await axios.put(`/api/admin/optimized/dashboard/patients-details`, {
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

  const startEditing = (fileId: string, currentName: string) => {
    setReportFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, isEditing: true }
          : { ...file, isEditing: false }
      )
    );
    setEditingFileName(currentName);
  };

  const saveFileName = (fileId: string) => {
    if (editingFileName.trim()) {
      setReportFiles(prev => 
        prev.map(file => 
          file.id === fileId 
            ? { ...file, displayName: editingFileName.trim(), isEditing: false }
            : file
        )
      );
      toast.success("File name updated successfully!");
    } else {
      toast.warning("File name cannot be empty");
    }
  };

  const cancelEditing = (fileId: string) => {
    setReportFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, isEditing: false }
          : file
      )
    );
  };

  const deleteFile = async (fileId: string, fileUrl: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      try {
        // Remove from local state
        setReportFiles(prev => prev.filter(file => file.id !== fileId));
        
        // Update the lab booking to remove this file
        const updatedUrls = reportFiles
          .filter(file => file.id !== fileId)
          .map(file => file.url);
        
        const response = await axios.put(`/api/admin/optimized/dashboard/patients-details`, {
          labBookingId: booking?.id,
          links: updatedUrls,
          status: "COMPLETED"
        });

        if (response.status === 200) {
          toast.success("Report deleted successfully!");
          onUploadComplete();
        }
      } catch (error) {
        console.error("Delete failed", error);
        toast.error("Failed to delete report");
      }
    }
  };

  const handleClose = () => {
    setFiles(null);
    setUploading(false);
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadedFiles([]);
    setEditingFileName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center justify-between">
            <span>Upload Lab Reports</span>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                #{booking?.id || 'N/A'}
              </Badge>
              {booking?.labAssignmentId && (
                <Badge className="bg-purple-100 text-purple-800 text-xs">
                  Assignment #{booking.labAssignmentId}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Booking Information */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Booking Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Patient:</span>
              <span className="ml-2 font-medium">{patientName}</span>
            </div>
            <div>
              <span className="text-gray-600">Test:</span>
              <span className="ml-2 font-medium">{booking?.labPackageName || 'Lab Test'}</span>
            </div>
            <div>
              <span className="text-gray-600">Date:</span>
              <span className="ml-2 font-medium">{booking?.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Reports:</span>
              <span className="ml-2 font-medium">{reportFiles.length}</span>
            </div>
          </div>
        </div>

        {!uploadSuccess ? (
          <div className="space-y-6">
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
                  id={`consolidated-upload-files-${booking?.id || 'default'}`}
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
                    const fileInput = document.getElementById(`consolidated-upload-files-${booking?.id || 'default'}`);
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
                        <span className="text-blue-600">{generateUniqueFileName(file.name)}</span>
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

            {/* Existing Reports Management */}
            {reportFiles.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Manage Existing Reports ({reportFiles.length})</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {reportFiles.map((file, index) => (
                    <div
                      key={file.id}
                      className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                        file.isNew ? 'bg-green-50 border-green-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        
                        {file.isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingFileName}
                              onChange={(e) => setEditingFileName(e.target.value)}
                              className="flex-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => saveFileName(file.id)}
                              className="h-8 px-2"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelEditing(file.id)}
                              className="h-8 px-2"
                            >
                              <CloseIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate">
                                {file.displayName}
                              </p>
                              {file.isNew && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Original: {file.originalName}
                            </p>
                          </div>
                        )}
                      </div>

                      {!file.isEditing && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                            className="h-8 px-2 text-blue-600 hover:text-blue-700"
                            title="View Report"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = file.url;
                              link.download = file.displayName;
                              link.click();
                            }}
                            className="h-8 px-2 text-green-600 hover:text-green-700"
                            title="Download Report"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(file.id, file.displayName)}
                            className="h-8 px-2 text-orange-600 hover:text-orange-700"
                            title="Edit File Name"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFile(file.id, file.url)}
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                            title="Delete Report"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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