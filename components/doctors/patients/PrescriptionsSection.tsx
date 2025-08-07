'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Plus, ExternalLink, Eye } from "lucide-react";

interface PrescriptionsSectionProps {
  appointments: Array<{
    id: number;
    doctorName: string;
    date: string;
    prescriptionLink?: string | null;
    status: string;
  }>;
  patientName: string;
}

export default function PrescriptionsSection({ appointments, patientName }: PrescriptionsSectionProps) {
  const prescriptions = appointments.filter(apt => 
    apt.status === "COMPLETED" || apt.prescriptionLink
  ).slice(0, 3);

  return (
    <Card className="col-span-6 relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
      
      <div className="relative z-10">
        {/* Header - Compact with View More Button */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">Prescriptions</h3>
          <Button variant="outline" size="sm" className="text-secondary border-secondary/30 hover:bg-secondary/10 rounded-lg text-xs">
            <Eye className="h-3 w-3 mr-1" />
            View More
          </Button>
        </div>
        
        {/* Prescriptions Grid - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {prescriptions.map(appointment => (
            <Card key={appointment.id}
              className="group relative overflow-hidden border border-gray-200 bg-gray-100/60 shadow-sm transition-all duration-300 rounded-xl p-3 hover:shadow-md hover:bg-gray-100/80">
              {/* Background Rx Symbol */}
              <div className="absolute -right-3 -top-3 h-16 w-16 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                <Pill className="h-full w-full text-gray-600" />
              </div>
              
              <div className="relative z-10">
                {/* Prescription Header */}
                <div className="text-center mb-3">
                  <Badge variant="outline" className="mb-1 text-gray-600 border-gray-300 bg-gray-200/50 font-medium text-xs">
                    #{appointment.id}
                  </Badge>
                  <h4 className="font-semibold text-gray-800 text-xs mb-1">{appointment.doctorName}</h4>
                  <p className="text-xs text-gray-600 mb-1">{patientName}</p>
                  <p className="text-xs text-gray-500">ID: {appointment.id}</p>
                </div>
                
                {/* Action Button */}
                <div className="flex justify-center">
                  {appointment.prescriptionLink ? (
                    <a
                      href={appointment.prescriptionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white/80 text-gray-700 rounded-lg border border-gray-300 hover:bg-white hover:shadow-sm transition-all duration-200 group/link text-xs"
                    >
                      <ExternalLink className="h-3 w-3 group-hover/link:scale-110 transition-transform duration-200" />
                      <span className="font-medium">View</span>
                    </a>
                  ) : (
                    <span className="text-gray-500 text-xs px-2 py-1 bg-gray-200/50 rounded-lg">
                      No prescription
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {/* Empty State Cards */}
          {prescriptions.length < 3 && Array.from({ length: 3 - prescriptions.length }).map((_, index) => (
            <Card key={`empty-${index}`}
              className="group relative overflow-hidden border border-gray-200 bg-gray-100/40 shadow-sm transition-all duration-300 rounded-xl p-3 hover:shadow-md hover:bg-gray-100/60">
              <div className="absolute -right-3 -top-3 h-16 w-16 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                <Pill className="h-full w-full text-gray-600" />
              </div>
              
              <div className="relative z-10 text-center">
                <div className="w-8 h-8 bg-gray-200/60 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Pill className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">No prescription</p>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Action Button */}
        <Button className="w-full bg-custom-orange hover:bg-custom-orange/90 text-white rounded-xl py-2 shadow-lg hover:shadow-xl transition-all duration-300 group text-sm">
          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-semibold">Create New Prescription</span>
        </Button>
      </div>
    </Card>
  );
} 