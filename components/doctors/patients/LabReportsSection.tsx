'use client'
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Microscope, FileText, Activity, ExternalLink, Eye } from "lucide-react";

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
  const [showAllLabReports, setShowAllLabReports] = useState(false);
  const recentReports = labBookings.slice(0, 3);

  const icons = [
    <Microscope key="microscope" className="h-5 w-5 text-secondary" />,
    <FileText key="filetext" className="h-5 w-5 text-secondary" />,
    <Activity key="activity" className="h-5 w-5 text-secondary" />
  ];

  return (
    <div className="col-span-full">
      <Card className="relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
        
        <div className="relative z-10">
          {/* Header - Compact */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Lab Tests</h3>
            
            {labBookings.length > 3 && (
              <Dialog open={showAllLabReports} onOpenChange={setShowAllLabReports}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-secondary border-secondary/30 hover:bg-secondary/10 rounded-lg text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    View All ({labBookings.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogTitle className="text-xl font-semibold text-gray-800">All Lab Reports</DialogTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {labBookings.map(labBooking => (
                      <Card key={labBooking.id} className="p-4 border border-gray-200 bg-white shadow-sm rounded-xl">
                        <h4 className="font-medium mb-2">{labBooking.labPackageName}</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {new Date(labBooking.date).toLocaleDateString()}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {labBooking.status}
                          </Badge>
                          {Array.isArray(labBooking.reportLink) && labBooking.reportLink.length > 0 ? (
                            <div className="flex gap-1">
                              {labBooking.reportLink.map((url, index) => {
                                const fileName = decodeURIComponent(url.split("/").pop() || `Report-${index + 1}`);
                                return (
                                  <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="text-xs text-secondary border-secondary/30 hover:bg-secondary/10">
                                      {fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName}
                                    </Button>
                                  </a>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">No reports</span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Lab Tests Grid - Compact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentReports.map((labBooking, index) => (
              <Card key={labBooking.id} className="group relative overflow-hidden bg-white/80 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl p-3">
                {/* Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-lg flex items-center justify-center shadow-md">
                      {icons[index % icons.length]}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-xs mb-1">{labBooking.labPackageName}</h4>
                      <p className="text-xs text-gray-600">
                        {new Date(labBooking.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-medium">
                      {labBooking.status}
                    </Badge>
                    {Array.isArray(labBooking.reportLink) && labBooking.reportLink.length > 0 ? (
                      <a href={labBooking.reportLink[0]} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="text-xs text-secondary border-secondary/30 hover:bg-secondary/10 group/link">
                          <ExternalLink className="h-3 w-3 mr-1 group-hover/link:scale-110 transition-transform duration-200" />
                          View
                        </Button>
                      </a>
                    ) : (
                      <span className="text-gray-500 text-xs px-2 py-1 bg-gray-100/50 rounded-lg">
                        No report
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            
            {/* Empty State Cards */}
            {recentReports.length < 3 && Array.from({ length: 3 - recentReports.length }).map((_, index) => (
              <Card key={`empty-lab-${index}`} className="group relative overflow-hidden bg-white/60 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl p-3">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/20 to-gray-100/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 text-center">
                  <div className="w-8 h-8 bg-gray-200/60 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Microscope className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">No lab test</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
} 