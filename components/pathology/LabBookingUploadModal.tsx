"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, X } from "lucide-react";
import { toast } from "react-toastify";
import { put } from "@vercel/blob";
import axios from "axios";

interface LabBookingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  onUploadComplete: () => void;
}

export default function LabBookingUploadModal({
  isOpen,
  onClose,
  assignment,
  onUploadComplete,
}: LabBookingUploadModalProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileUpload = async () => {
    if (!files || files.length === 0) {
      toast.warning("Please select at least one file");
      return;
    }

    setUploading(true);
    try {
      const uploadedLinks: string[] = [];

      for (const file of Array.from(files)) {
        const arrayBuffer = await file.arrayBuffer();
        const fileName = `${assignment?.patient?.name?.replace(/\s+/g, "-") || "patient"}-lab-${assignment?.labBooking?.id || assignment?.id}-${file.name}`;

        const { url } = await put(fileName, arrayBuffer, {
          access: "public",
          token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
        });

        uploadedLinks.push(url);
      }

      // Update lab booking with uploaded reports
      const response = await axios.put(`/api/admin/dashboard/patients-details`, {
        labBookingId: assignment?.labBooking?.id || assignment?.id,
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
    }
  };

  const handleClose = () => {
    setFiles(null);
    setUploading(false);
    setUploadSuccess(false);
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
            {/* Assignment Information */}
            <div className="bg-custom-mutedgreen p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Assignment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <span className="ml-2 font-medium">{assignment?.patient?.name || assignment?.labBooking?.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Test:</span>
                  <span className="ml-2 font-medium">{assignment?.labBooking?.labPackage?.name || assignment?.appointment?.appointmentFor}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-medium">{assignment?.assignedDate}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className="ml-2 bg-blue-100 text-blue-800">{assignment?.status}</Badge>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Upload Lab Report Files</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop your lab report files here, or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setFiles(e.target.files)}
                  className="hidden"
                  id="lab-upload-files"
                />
                <Label htmlFor="lab-upload-files" className="cursor-pointer">
                  <Button variant="outline" className="mt-2">
                    Choose Files
                  </Button>
                </Label>
                {files && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                    {Array.from(files).map((file, index) => (
                      <div key={index} className="flex items-center justify-center space-x-2 text-sm">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleFileUpload}
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
                The lab reports for {assignment?.patient?.name || assignment?.labBooking?.fullName} have been uploaded and processed.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <span className="ml-2 font-medium">{assignment?.patient?.name || assignment?.labBooking?.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Files Uploaded:</span>
                  <span className="ml-2 font-medium">{files?.length || 0}</span>
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