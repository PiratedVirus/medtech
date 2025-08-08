'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, ExternalLink, Eye } from "lucide-react";

interface PrescriptionsSectionProps {
  appointments: Array<{
    id: number;
    date: string;
    prescriptionLink?: string | null;
    doctorName?: string;
  }>;
  patientName: string;
}

export default function PrescriptionsSection({ appointments, patientName }: PrescriptionsSectionProps) {
  // Filter appointments that have prescriptions
  const prescriptions = appointments?.filter(apt => apt.prescriptionLink) || [];

  return (
    <Card className="col-span-6 relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
      
      <div className="relative z-10">
        {/* Header - Compact with View More Button */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Prescriptions</h3>
          <Button variant="outline" size="sm" className="text-primary border-primary/30 hover:bg-primary/10 rounded-lg text-xs">
            <Eye className="h-3 w-3 mr-1" />
            View More
          </Button>
        </div>
        
        {/* Prescriptions Grid - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {prescriptions.slice(0, 3).map((prescription) => (
            <div key={prescription.id} className="group relative overflow-hidden bg-white/80 rounded-xl border border-gray-200/50 p-3 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Background Pill Icon */}
              <div className="absolute -right-2 -bottom-2 w-16 h-16 opacity-5">
                <Pill className="w-full h-full text-primary" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-primary/10 text-primary text-xs font-medium">
                    {new Date(prescription.date).toLocaleDateString('en-GB')}
                  </Badge>
                </div>
                
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {prescription.doctorName || 'Dr. Smith'}
                </h4>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 p-0 h-auto text-xs"
                  onClick={() => {
                    if (prescription.prescriptionLink) {
                      window.open(prescription.prescriptionLink, '_blank');
                    }
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Prescription
                </Button>
              </div>
            </div>
          ))}
          
          {/* Empty state cards if less than 3 prescriptions */}
          {Array.from({ length: Math.max(0, 3 - prescriptions.length) }).map((_, index) => (
            <div key={`empty-${index}`} className="group relative overflow-hidden bg-white/60 rounded-xl border border-gray-200/30 p-3 shadow-sm">
              <div className="absolute -right-2 -bottom-2 w-16 h-16 opacity-5">
                <Pill className="w-full h-full text-gray-400" />
              </div>
              
              <div className="relative z-10 text-center py-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Pill className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">No prescription</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Action Button */}
        <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-2 shadow-lg hover:shadow-xl transition-all duration-300 group text-sm">
          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-semibold">Create New Prescription</span>
        </Button>
      </div>
    </Card>
  );
} 