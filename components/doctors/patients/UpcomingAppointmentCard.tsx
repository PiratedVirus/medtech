'use client'
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, CalendarDays, Clock3, Play } from "lucide-react";

interface UpcomingAppointmentCardProps {
  appointments: Array<{
    id: number;
    doctorName: string;
    date: string | null;
    type: string;
    status: string;
    prescriptionLink?: string | null;
  }>;
  patientName: string;
  className?: string;
}

export default function UpcomingAppointmentCard({ appointments, patientName, className }: UpcomingAppointmentCardProps) {
  const upcomingAppointments = appointments?.filter(apt => {
    if (!apt.date) return false;
    const isScheduledLike = ["SCHEDULED", "PENDING", "CONFIRMED", "Scheduled", "Pending", "Confirmed"].includes(apt.status);
    const isFuture = new Date(apt.date).getTime() >= new Date().setHours(0,0,0,0);
    return isScheduledLike && isFuture;
  }).sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  }) || [];
  const pastAppointments = (appointments || [])
    .filter(a => {
      // Include if status is COMPLETED (regardless of date)
      if (a.status === 'COMPLETED') return true;
      
      // Include if appointment has a prescription link (completed appointment)
      if (a.prescriptionLink) return true;
      
      // If no date, exclude unless COMPLETED or has prescription
      if (!a.date) return false;
      
      // Check if date is in the past
      try {
        const appointmentDate = new Date(a.date);
        const now = new Date();
        // Set time to start of day for fair comparison
        appointmentDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        return appointmentDate.getTime() < now.getTime();
      } catch (e) {
        console.error('Error parsing date:', a.date, e);
        return false;
      }
    })
    .sort((a, b) => {
      // Sort by date descending (most recent first)
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (e) {
        return 0;
      }
    });

  // Debug logging
  console.log('UpcomingAppointmentCard - appointments:', appointments);
  console.log('UpcomingAppointmentCard - pastAppointments:', pastAppointments);

  return (
    <div className={`col-span-2 relative h-full ${className ?? ''}`}>
      {/* <div
        aria-hidden="true"
        className="absolute -inset-0.5 rounded-[14px] bg-[conic-gradient(at_70%_20%,#84cc16_0deg,#10b981_120deg,#065f46_240deg,#84cc16_360deg)] opacity-80 blur"
      /> */}
      <Card className="relative overflow-hidden rounded-xl border border-emerald-300 bg-white p-4 shadow-md h-[296px]">
        <div className="absolute inset-0 -skew-y-2 bg-gradient-to-tr from-emerald-100 via-emerald-50 to-lime-100 opacity-60" />
        
        <div className="relative z-10 h-full overflow-y-auto">
        {/* Header removed as requested */}
        <div className="mb-1" />
        
        <div className="space-y-3 h-full flex flex-col">
          {/* Upcoming Appointments Section */}
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 1).map(appointment => (
                <div key={appointment.id} className="group relative overflow-hidden rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300">
                  {/* Appointment Card Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-b to-[#1e5636] from-[#2e8b57] rounded-xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      {/* Doctor Avatar */}
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      
                      {/* Appointment Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm mb-1 truncate">
                          {patientName}
                        </h4>
                        <p className="text-xs text-emerald-50/90 mb-2 capitalize">
                          {appointment.type.toLowerCase()} Consultation
                        </p>
                        
                        {/* Time and Date */}
                        <div className="flex items-center gap-4 text-xs text-emerald-50">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            <span>{appointment.date ? new Date(appointment.date).toLocaleDateString('en-GB') : 'No date'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            <span>{appointment.date ? new Date(appointment.date).toLocaleTimeString('en-GB', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : 'No time'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button + Upcoming pill */}
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium border-white/20 bg-white/25 p-2 backdrop-blur-sm text-emerald-50 border">Upcoming</span>
                        <Button
                          size="sm"
                          className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-200"
                          onClick={() => {
                            window.location.href = `/doctor/appointments/${appointment.id}`;
                          }}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs font-medium text-gray-600">No upcoming appointments</p>
              <p className="text-[10px] text-gray-500 mt-1">All clear for now!</p>
            </div>
          )}
          
          {/* Past Appointments - Always shown if they exist, positioned at bottom */}
          <div className="mt-auto pt-4">
            <h6 className="text-xs font-medium text-emerald-700 mb-3 uppercase tracking-wide">Past Appointments</h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pastAppointments.length > 0 ? (
                pastAppointments.slice(0, 2).map((apt, idx) => (
                  <div key={apt.id || idx} className="relative rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                    {/* Top-right Completed pill */}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">Completed</span>

                    <div className="pr-20">
                      {/* ID pill above name */}
                      <div className="mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-300 text-emerald-800">ID: {apt.id}</span>
                      </div>

                      <h5 className="text-sm font-semibold text-emerald-900">{patientName}</h5>

                      {/* Date line */}
                      <div className="mt-1 text-xs text-emerald-800/80">
                        {apt.date ? `${new Date(apt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | ${new Date(apt.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : '—'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                [0, 1].map(i => (
                  <div key={`empty-past-${i}`} className="relative rounded-xl border border-gray-200 bg-gray-100/70 p-3">
                    <div className="pr-20">
                      <div className="mb-1">
                        {/* Empty space for ID pill */}
                      </div>
                      <h5 className="text-sm font-semibold text-gray-700">No past appointment</h5>
                      <div className="mt-1 text-xs text-gray-600">Past appointments will appear here with their details.</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
    </div>
  );
}