"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, X, Eye } from "lucide-react";

interface ViewReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  patientName: string;
  existingReports: string[];
}

interface ReportFile {
  id: string;
  name: string;
  url: string;
}

export default function ViewReportsModal({
  isOpen,
  onClose,
  booking,
  patientName,
  existingReports,
}: ViewReportsModalProps) {
  const [reportFiles, setReportFiles] = useState<ReportFile[]>([]);

  // Initialize report files from existing reports
  useEffect(() => {
    if (existingReports.length > 0) {
      const initialFiles: ReportFile[] = existingReports.map((url, index) => ({
        id: `report-${index}`,
        name: url.split('/').pop() || `Report ${index + 1}`,
        url,
      }));
      setReportFiles(initialFiles);
    } else {
      setReportFiles([]);
    }
  }, [existingReports]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center justify-between">
            <span>Lab Reports</span>
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

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="font-medium text-gray-800 mb-3">Uploaded Reports ({reportFiles.length})</h4>
          
          {reportFiles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reports uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportFiles.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 bg-white"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Report {index + 1}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                    className="text-primary border-primary/20 hover:bg-primary/10 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 