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

  // Get recent reports (first 3)
  const recentReports = labBookings.slice(0, 3);

  // Icons for different lab types
  const icons = [FileText, Activity, Microscope];

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
                  <Button variant="outline" size="sm" className="text-primary border-primary/30 hover:bg-primary/10 rounded-lg text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    View All ({labBookings.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogTitle>All Lab Reports</DialogTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {labBookings.map((labBooking) => {
                      const IconComponent = icons[labBooking.id % icons.length];
                      return (
                        <div key={labBooking.id} className="group relative overflow-hidden bg-white/80 rounded-xl border border-gray-200/50 p-4 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm">{labBooking.labPackageName}</h4>
                                <p className="text-xs text-gray-600">{new Date(labBooking.date).toLocaleDateString('en-GB')}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Badge className={`text-xs font-medium ${
                                labBooking.status === 'COMPLETED' 
                                  ? 'bg-primary/10 text-primary border-primary/20' 
                                  : 'bg-orange-100 text-orange-700 border-orange-200'
                              }`}>
                                {labBooking.status}
                              </Badge>
                              
                              {labBooking.reportLink && labBooking.reportLink.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary/80 p-0 h-auto text-xs"
                                  onClick={() => window.open(labBooking.reportLink![0], '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Report
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Lab Tests Grid - Compact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentReports.map((labBooking) => {
              const IconComponent = icons[labBooking.id % icons.length];
              return (
                <div key={labBooking.id} className="group relative overflow-hidden bg-white/80 rounded-xl border border-gray-200/50 p-3 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-xs truncate">{labBooking.labPackageName}</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={`text-xs font-medium ${
                        labBooking.status === 'COMPLETED' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-orange-100 text-orange-700 border-orange-200'
                      }`}>
                        {labBooking.status}
                      </Badge>
                      
                      {labBooking.reportLink && labBooking.reportLink.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 p-0 h-auto text-xs"
                          onClick={() => window.open(labBooking.reportLink![0], '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Empty state cards if less than 3 reports */}
            {Array.from({ length: Math.max(0, 3 - recentReports.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="group relative overflow-hidden bg-white/60 rounded-xl border border-gray-200/30 p-3 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-gray-100/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 text-center py-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Microscope className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">No lab tests</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
} 