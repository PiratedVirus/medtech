'use client'
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, HeartPulse, Stethoscope } from "lucide-react";

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
  className?: string;
}

function initials(name: string) {
  return (name || '')
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export default function PatientInfoCard({ patient, className }: PatientInfoCardProps) {
  const lastVisit = patient.doctorAppointments?.[0]?.date 
    ? new Date(patient.doctorAppointments[0].date).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
    : 'N/A';

  const activeSubscription = patient.subscriptions?.find(sub => sub.isActive);

  return (
    <Card className={`relative overflow-hidden rounded-xl border border-emerald-400/40 bg-emerald-600 p-4 shadow-lg h-[296px] ${className ?? ''}`}>
      <div className="absolute inset-0 bg-gradient-to-b to-[#1e5636] from-[#2e8b57]" />
      <div className="relative z-10 h-full flex flex-col overflow-y-auto">
        {/* Top: Identity row */}
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-emerald-50/90">ID: {patient.id}</div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-white truncate">{patient.name}</h3>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {activeSubscription && <Badge className="bg-slate-200 text-emerald-900">{activeSubscription.planName}</Badge>}
            </div>
          </div>
        </div>

        {/* Bottom: Info section */}
        <div className="space-y-2 mt-auto pt-6 md:pt-8">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between rounded-md border border-white/20 bg-white/15 p-2 backdrop-blur-sm">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-50">Gender</span>
              <span className="text-xs font-semibold text-white">{patient.profile.gender}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/20 bg-white/15 p-2 backdrop-blur-sm">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-50">Age</span>
              <span className="text-xs font-semibold text-white">{patient.profile.age} yrs</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/20 bg-white/15 p-2 backdrop-blur-sm">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-50">Weight</span>
              <span className="text-xs font-semibold text-white">{patient.profile.weight} kg</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/20 bg-white/15 p-2 backdrop-blur-sm">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-50">Height</span>
              <span className="text-xs font-semibold text-white">{patient.profile.height} cm</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-white/20 bg-white/15 p-2 backdrop-blur-sm">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-50">
              <Stethoscope className="h-3.5 w-3.5 text-lime-300" />
              Last Visit
            </span>
            <span className="text-xs font-semibold text-white">{lastVisit}</span>
          </div>
        </div>
      </div>
    </Card>
  );
} 