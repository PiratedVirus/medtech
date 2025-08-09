'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, ExternalLink, Eye } from "lucide-react";

interface PrescriptionsSectionProps {
  appointments: Array<{
    id: number;
    appointmentDate?: string;
    date?: string;
    prescriptionLink?: string | null;
    doctorName?: string;
  }>;
  patientName: string;
}

export default function PrescriptionsSection({ appointments, patientName }: PrescriptionsSectionProps) {
  // Filter appointments that have prescriptions
  const prescriptions = appointments?.filter(apt => apt.prescriptionLink) || [];

  return (
    <Card className="col-span-3 relative overflow-hidden rounded-xl bg-orange-50/80 p-4 shadow-sm border border-orange-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-orange-100/30 rounded-xl" />
      
      <div className="relative z-10">
        {/* Header - Compact with View More Button */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Prescriptions</h3>
          <Button variant="outline" size="sm" className="text-secondary border-secondary/30 hover:bg-secondary/10 rounded-lg text-xs">
            <Eye className="h-3 w-3 mr-1" />
            View More
          </Button>
        </div>
        
        {/* Prescriptions Stack - Vertical Layout */}
        <div className="space-y-2 mb-3">
          {prescriptions.slice(0, 3).map((prescription) => (
            <div key={prescription.id} className="group relative overflow-hidden bg-white/90 rounded-lg border border-orange-200/50 p-3 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Background Pill Icon */}
              <div className="absolute -right-2 -bottom-2 w-12 h-12 opacity-5">
                <Pill className="w-full h-full text-orange-500" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-orange-100 text-orange-700 text-xs font-medium">
                    {new Date(prescription.date || prescription.appointmentDate || '').toLocaleDateString('en-GB')}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {prescription.doctorName || 'Dr. Smith'}
                  </h4>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700 p-0 h-auto text-xs"
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
            </div>
          ))}
          
          {/* Empty state if no prescriptions */}
          {prescriptions.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-2">
                <Pill className="h-6 w-6 text-orange-400" />
              </div>
              <p className="text-sm text-gray-500">No prescriptions available</p>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <Button className="w-full bg-secondary hover:bg-secondary/90 text-white rounded-xl py-2 shadow-lg hover:shadow-xl transition-all duration-300 group text-sm">
          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-semibold">Create New Prescription</span>
        </Button>
      </div>
    </Card>
  );
} 