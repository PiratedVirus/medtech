'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Upload, BarChart3 } from "lucide-react";
import ReportUploadButton from "@/components/common/ReportUploadButton";
import ParameterTrendsModal from "@/components/patients/labs/ParameterTrendsModal";
import UnifiedAnalysisModal from "@/components/common/UnifiedAnalysisModal";
import { useState, useEffect } from "react";

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
  const [standaloneReports, setStandaloneReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);

  // Fetch standalone reports
  useEffect(() => {
    if (patientId) {
      fetchStandaloneReports();
    }
  }, [patientId]);

  const fetchStandaloneReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/upload?patientId=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStandaloneReports(data.reports || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch standalone reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combine lab bookings and standalone reports
  const allReports = [
    ...labBookings.map(booking => ({
      id: `lab-${booking.id}`,
      type: 'lab',
      name: booking.labPackageName,
      date: booking.date,
      status: booking.status,
      reportLink: booking.reportLink,
      labResult: booking.labResult
    })),
    ...standaloneReports.map(report => ({
      id: `standalone-${report.id}`,
      type: 'standalone',
      name: report.reportName || `Report ${report.id}`,
      date: report.createdAt,
      status: 'COMPLETED',
      reportLink: [report.reportUrl],
      labResult: null
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const recentReports = allReports.slice(0, 3);

  // Function to render individual lab results for a package
  const renderLabResults = (report: any) => {
    // Use labResult if available, otherwise fall back to reportLink
    const results = report.labResult || report.reportLink || [];
    
    if (results.length === 0) {
      return (
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-white text-xs truncate flex-1">
            {report.name}
          </h4>
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
            {new Date(report.date).toLocaleDateString('en-GB')}
          </span>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-xs text-green-200 cursor-not-allowed"
              disabled
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }

    // If there's only one result, show it normally
    if (results.length === 1) {
      return (
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-white text-xs truncate flex-1">
            {report.name}
          </h4>
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            {new Date(report.date).toLocaleDateString('en-GB')}
          </span>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-xs text-green-50 hover:text-white"
              onClick={() => window.open(results[0], '_blank')}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }

    // If there are multiple results, show them as separate items
    return results.map((result: string, index: number) => (
      <div key={`${report.id}-${index}`} className="flex items-center gap-2 mb-1 last:mb-0">
        <h4 className="font-semibold text-white text-xs truncate flex-1">
          {report.name}-{index + 1}
        </h4>
        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
          {new Date(report.date).toLocaleDateString('en-GB')}
        </span>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-xs text-green-50 hover:text-white"
            onClick={() => window.open(result, '_blank')}
          >
            <Eye className="h-3 w-3" />
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

        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-gray-900">Lab Reports</h3>
            <div className="flex items-center gap-2">
              {/* View Analysis Button - Top Right */}
              {allReports.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-secondary border-secondary/30 hover:bg-secondary/10 rounded-lg text-xs"
                  onClick={() => setAnalysisModalOpen(true)}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  View Analysis
                </Button>
              )}
              {allReports.length > 3 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-secondary border-secondary/30 hover:bg-secondary/10 rounded-lg text-xs"
                  onClick={onViewMore}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View More
                </Button>
              )}
            </div>
          </div>

          {/* Lab Reports - show individual results for each package */}
          <div className="space-y-0.5 mb-1 flex-1">
            {recentReports.map((report) => (
              <div key={report.id} className="group relative overflow-hidden rounded-lg border border-emerald-200/60 p-1.5 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Appointment Card Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-b to-[#1e5636] from-[#2e8b57] rounded-lg opacity-90" />

                {/* Background File Icon */}
                <div className="absolute -right-2 -bottom-2 w-12 h-12 opacity-10">
                  <FileText className="w-full h-full text-green-50" />
                </div>
                
                <div className="relative z-10">
                  {renderLabResults(report)}
                </div>
              </div>
            ))}

            {/* Placeholders when no reports available */}
            {recentReports.length < 3 && Array(3 - recentReports.length).fill(null).map((_, i) => (
              <div key={`lr-ph-${i}`} className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Lab reports will appear here after they are uploaded.</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Pending</span>
                </div>
              </div>
            ))}

            {/* Empty state if no lab reports */}
            {recentReports.length === 0 && (
              <div className="text-center py-2">
                <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-1">
                  <FileText className="h-3 w-3 text-green-400" />
                </div>
                <p className="text-[10px] text-gray-500">No lab reports available</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {patientId && (
            <div className="border-t pt-1.5 mt-auto">
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(`/doctor/parameter-trends?patientId=${patientId}`, '_blank')}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Trends
                </Button>
                <ReportUploadButton
                  patientId={Number(patientId)}
                  onUploadSuccess={() => {
                    fetchStandaloneReports();
                    onUploadSuccess?.();
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Report
                </ReportUploadButton>
              </div>
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

      {/* Unified Analysis Modal */}
      {analysisModalOpen && (
        <UnifiedAnalysisModal
          isOpen={analysisModalOpen}
          onClose={() => setAnalysisModalOpen(false)}
          patientId={patientId || ""}
          labReports={labBookings}
          standaloneReports={standaloneReports}
          preSelectedStandaloneReportId={null}
        />
      )}
    </div>
  );
}