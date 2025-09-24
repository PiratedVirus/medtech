'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Upload, BarChart3 } from "lucide-react";
import ReportUploadButton from "@/components/common/ReportUploadButton";
import ParameterTrendsModal from "@/components/patients/labs/ParameterTrendsModal";
import { useState } from "react";

interface LabReportsSectionProps {
  labBookings: Array<{
    id: number;
    labPackageName: string;
    date: string;
    status: string;
    reportLink?: string[] | null;
    labResult?: string[] | null;
  }>;
  patientId?: string;
  onViewMore?: () => void;
  onUploadSuccess?: () => void;
}

export default function LabReportsSection({ labBookings, patientId, onViewMore, onUploadSuccess }: LabReportsSectionProps) {
  const [parameterTrendsOpen, setParameterTrendsOpen] = useState(false);
  const recentReports = labBookings.slice(0, 3);

  // Function to render individual lab results for a package
  const renderLabResults = (labBooking: any) => {
    // Use labResult if available, otherwise fall back to reportLink
    const results = labBooking.labResult || labBooking.reportLink || [];
    
    if (results.length === 0) {
      return (
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-white text-sm truncate flex-1">
            {labBooking.labPackageName}
          </h4>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
            {new Date(labBooking.date).toLocaleDateString('en-GB')}
          </span>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-xs text-green-200 cursor-not-allowed"
              disabled
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    // If there's only one result, show it normally
    if (results.length === 1) {
      return (
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-white text-sm truncate flex-1">
            {labBooking.labPackageName}
          </h4>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
            {new Date(labBooking.date).toLocaleDateString('en-GB')}
          </span>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-xs text-green-50 hover:text-white"
              onClick={() => window.open(results[0], '_blank')}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    // If there are multiple results, show them as separate items
    return results.map((result: string, index: number) => (
      <div key={`${labBooking.id}-${index}`} className="flex items-center gap-3 mb-2 last:mb-0">
        <h4 className="font-semibold text-white text-sm truncate flex-1">
          {labBooking.labPackageName}-{index + 1}
        </h4>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
          {new Date(labBooking.date).toLocaleDateString('en-GB')}
        </span>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-xs text-green-50 hover:text-white"
            onClick={() => window.open(result, '_blank')}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ));
  };

  return (
    <div className="relative h-full">
      <div aria-hidden="true" className="absolute -inset-0.5 rounded-[14px] bg-[conic-gradient(at_70%_20%,#84cc16_0deg,#10b981_120deg,#065f46_240deg,#84cc16_360deg)] opacity-80 blur" />
      <Card className="relative overflow-hidden rounded-xl border border-emerald-300 bg-white p-4 shadow-md h-[296px]">
        <div className="absolute inset-0 -skew-y-2 bg-gradient-to-tr from-emerald-100 via-emerald-50 to-lime-100 opacity-60" />

        <div className="relative z-10 h-full flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Lab Reports</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-secondary border-secondary/30 hover:bg-secondary/10 rounded-lg text-xs"
              onClick={onViewMore}
            >
              <Eye className="h-3 w-3 mr-1" />
              View More
            </Button>
          </div>

          {/* Lab Reports - show individual results for each package */}
          <div className="space-y-2 mb-3 flex-1">
            {recentReports.map((labBooking) => (
              <div key={labBooking.id} className="group relative overflow-hidden rounded-lg border border-emerald-200/60 p-3 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Appointment Card Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-b to-[#1e5636] from-[#2e8b57] rounded-lg opacity-90" />

                {/* Background File Icon */}
                <div className="absolute -right-2 -bottom-2 w-12 h-12 opacity-10">
                  <FileText className="w-full h-full text-green-50" />
                </div>
                
                <div className="relative z-10">
                  {renderLabResults(labBooking)}
                </div>
              </div>
            ))}

            {/* Placeholders when no reports available */}
            {recentReports.length < 3 && Array(3 - recentReports.length).fill(null).map((_, i) => (
              <div key={`lr-ph-${i}`} className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Lab reports will appear here after they are uploaded.</span>
                </div>
              </div>
            ))}

            {/* Empty state if no lab reports */}
            {recentReports.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-6 w-6 text-green-400" />
                </div>
                <p className="text-sm text-gray-500">No lab reports available</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {patientId && (
            <div className="border-t pt-3 mt-auto space-y-2">
              <Button
                onClick={() => window.open(`/dashboard/parameter-trends?patientId=${patientId}`, '_blank')}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Parameter Trends
              </Button>
              <ReportUploadButton
                patientId={Number(patientId)}
                onUploadSuccess={onUploadSuccess}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Report
              </ReportUploadButton>
            </div>
          )}
        </div>
      </Card>

      {/* Parameter Trends Modal */}
      {patientId && (
        <ParameterTrendsModal
          isOpen={parameterTrendsOpen}
          onClose={() => setParameterTrendsOpen(false)}
          patientId={Number(patientId)}
        />
      )}
    </div>
  );
}