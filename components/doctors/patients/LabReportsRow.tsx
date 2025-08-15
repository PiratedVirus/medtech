'use client'
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Maximize2 } from "lucide-react";
import LabReportAnalysisModal from "./LabReportAnalysisModal";

interface LabReportsRowProps {
  labBookings: Array<{
    id: number;
    labPackageName: string;
    date: string;
    status: string;
    reportLink?: string[] | null;
    labResult?: string[] | null;
  }>;
  patientId: string;
}

export default function LabReportsRow({ labBookings, patientId }: LabReportsRowProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const recentReports = labBookings.slice(0, 3);

  return (
    <Card className="col-span-6 relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100 h-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
      
      {/* Expand Icon - Top Right Corner */}
      {labBookings.length > 0 && (
        <div className="absolute top-2 right-2 z-30 translate-x-1 md:translate-x-0">
          <div className="group relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-500 hover:text-secondary hover:bg-secondary/10 rounded"
              title="AI Analysis"
              onClick={() => setModalOpen(true)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="relative z-10 flex items-center justify-between h-full pr-12">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">Past Appointments</h3>
        </div>
        
        {/* Report Name Buttons - Slightly Left from Edge */}
        <div className="flex gap-2 mr-12 md:mr-8">
          {recentReports.map((labBooking) => {
            // Use labResult if available, otherwise fall back to reportLink
            const results = labBooking.labResult || labBooking.reportLink || [];
            
            if (results.length === 0) {
              return (
                <Button
                  key={labBooking.id}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 h-auto cursor-not-allowed"
                  disabled
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {labBooking.labPackageName}
                </Button>
              );
            }

            // If there's only one result, show it normally
            if (results.length === 1) {
              return (
                <Button
                  key={labBooking.id}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-secondary hover:bg-secondary/20 hover:text-secondary bg-secondary/10 border border-secondary/10 rounded-lg px-3 py-2 h-auto"
                  onClick={() => window.open(results[0], '_blank')}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  {labBooking.labPackageName}
                </Button>
              );
            }

            // If there are multiple results, show them as separate buttons
            return results.map((result: string, index: number) => (
              <Button
                key={`${labBooking.id}-${index}`}
                variant="ghost"
                size="sm"
                className="text-xs text-secondary hover:bg-secondary/20 hover:text-secondary bg-secondary/10 border border-secondary/10 rounded-lg px-3 py-2 h-auto"
                onClick={() => window.open(result, '_blank')}
              >
                <FileText className="h-3 w-3 mr-1" />
                {labBooking.labPackageName}-{index + 1}
              </Button>
            ));
          })}
          
          {/* Empty state if no reports */}
          {recentReports.length === 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-500">No lab reports available</p>
            </div>
          )}
        </div>
      </div>
      
      <LabReportAnalysisModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        patientId={patientId}
        labReports={labBookings}
      />
    </Card>
  );
} 