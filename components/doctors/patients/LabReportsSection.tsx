'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, ExternalLink } from "lucide-react";

interface LabReportsSectionProps {
  labBookings: Array<{
    id: number;
    labPackageName: string;
    date: string;
    status: string;
    reportLink?: string[] | null;
  }>;
}

export default function LabReportsSection({ labBookings }: LabReportsSectionProps) {
  const recentReports = labBookings.slice(0, 3);

  return (
    <Card className="col-span-3 relative overflow-hidden rounded-xl bg-green-50/80 p-4 shadow-sm border border-green-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-green-100/30 rounded-xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Lab Reports</h3>
          <Button variant="outline" size="sm" className="text-secondary border-secondary/30 hover:bg-secondary/10 rounded-lg text-xs">
            <Eye className="h-3 w-3 mr-1" />
            View More
          </Button>
        </div>
        
        {/* Lab Reports Stack - Vertical Layout */}
        <div className="space-y-2 mb-3">
          {recentReports.map((labBooking) => (
            <div key={labBooking.id} className="group relative overflow-hidden bg-white/90 rounded-lg border border-green-200/50 p-3 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Background File Icon */}
              <div className="absolute -right-2 -bottom-2 w-12 h-12 opacity-5">
                <FileText className="w-full h-full text-green-500" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-100 text-green-700 text-xs font-medium">
                    {new Date(labBooking.date).toLocaleDateString('en-GB')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {labBooking.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {labBooking.labPackageName}
                  </h4>
                  
                  {labBooking.reportLink && labBooking.reportLink.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 p-0 h-auto text-xs"
                      onClick={() => {
                        window.open(labBooking.reportLink![0], '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Report
                    </Button>
                  ) : (
                    <p className="text-xs text-gray-500">Report not available</p>
                  )}
                </div>
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
  );
} 