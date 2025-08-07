'use client'
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface PatientInfoCardProps {
  patient: {
    id: number;
    name: string;
    profile: {
      age: number;
      gender: string;
      weight: number;
      height: number;
      allergies?: string;
    };
    doctorAppointments?: Array<{
      date: string;
    }>;
    subscriptions?: Array<{
      planName: string;
      isActive: boolean;
      endDate: string;
    }>;
  };
}

export default function PatientInfoCard({ patient }: PatientInfoCardProps) {
  const lastVisit = patient.doctorAppointments?.[0]?.date 
    ? new Date(patient.doctorAppointments[0].date).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
    : 'N/A';

  const activeSubscription = patient.subscriptions?.find(sub => sub.isActive);

  return (
    <Card className="col-span-2 relative overflow-hidden rounded-xl bg-gray-50/80 text-gray-700 p-4 shadow-sm border border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
      
      <div className="relative z-10">
        {/* Header Section - Centered with Corner Pills */}
        <div className="relative mb-4">
          {/* Corner Pills */}
          <div className="absolute top-0 left-0 z-20">
            <Badge className="bg-gray-600 text-white text-xs font-medium">
              ID: {patient.id}
            </Badge>
          </div>
          {activeSubscription && (
            <div className="absolute top-0 right-0 z-20">
              <Badge className="bg-green-600 text-white text-xs font-medium">
                {activeSubscription.planName}
              </Badge>
            </div>
          )}
          
          {/* Centered User Icon and Name */}
          <div className="flex flex-col items-center pt-6">
            <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center shadow-lg mb-3">
              <User className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center">{patient.name}</h3>
          </div>
        </div>
        
        {/* Patient Details - Below Name */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg border border-gray-200/50">
              <span className="text-xs text-gray-600">Gender</span>
              <span className="text-xs font-semibold text-secondary">{patient.profile.gender}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg border border-gray-200/50">
              <span className="text-xs text-gray-600">Age</span>
              <span className="text-xs font-semibold text-secondary">{patient.profile.age} yrs</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg border border-gray-200/50">
              <span className="text-xs text-gray-600">Weight</span>
              <span className="text-xs font-semibold text-secondary">{patient.profile.weight} kg</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg border border-gray-200/50">
              <span className="text-xs text-gray-600">Height</span>
              <span className="text-xs font-semibold text-secondary">{patient.profile.height} cm</span>
            </div>
          </div>

          {/* Last Visit */}
          <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg border border-gray-200/50">
            <span className="text-xs text-gray-600">Last Visit</span>
            <span className="text-xs font-semibold text-secondary">{lastVisit}</span>
          </div>
        </div>
      </div>
    </Card>
  );
} 