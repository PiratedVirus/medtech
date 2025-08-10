'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";

interface LabReportsSectionProps {
  labBookings: Array<{
    id: number;
    labPackageName: string;
    date: string;
    status: string;
    reportLink?: string[] | null;
  }>;
  patientId?: string;
  onViewMore?: () => void;
}

export default function LabReportsSection({ labBookings, onViewMore }: LabReportsSectionProps) {
  const recentReports = labBookings.slice(0, 3);

  return (
    <div className="relative h-full">
      <div aria-hidden="true" className="absolute -inset-0.5 rounded-[14px] bg-[conic-gradient(at_70%_20%,#84cc16_0deg,#10b981_120deg,#065f46_240deg,#84cc16_360deg)] opacity-80 blur" />
      <Card className="relative overflow-hidden rounded-xl border border-emerald-300 bg-white p-4 shadow-md h-full min-h-[220px]">
        <div className="absolute inset-0 -skew-y-2 bg-gradient-to-tr from-emerald-100 via-emerald-50 to-lime-100 opacity-60" />

        <div className="relative z-10 h-full flex flex-col">
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

          {/* Lab Reports - condensed single-row items */}
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
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-white text-sm truncate flex-1">
                      {labBooking.labPackageName}
                    </h4>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">{new Date(labBooking.date).toLocaleDateString('en-GB')}</span>
                    <div className="ml-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-1 h-auto text-xs ${labBooking.reportLink && labBooking.reportLink.length > 0 ? 'text-green-50 hover:text-white' : 'text-green-200 cursor-not-allowed'}`}
                        onClick={() => {
                          if (labBooking.reportLink && labBooking.reportLink.length > 0) {
                            window.open(labBooking.reportLink[0] as string, '_blank');
                          }
                        }}
                        aria-disabled={!labBooking.reportLink || labBooking.reportLink.length === 0}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Placeholders when no reports available */}
            {recentReports.length < 3 && Array(3 - recentReports.length).fill(null).map((_, i) => (
              <div key={`lr-ph-${i}`} className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Lab reports will appear here after they are uploaded.</span>
                  {/* <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Pending</span> */}
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
        </div>
      </Card>
    </div>
  );
}