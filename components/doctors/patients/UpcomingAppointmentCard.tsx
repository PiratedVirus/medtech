'use client'
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, CalendarDays, Clock3, Play } from "lucide-react";

interface UpcomingAppointmentCardProps {
  appointments: Array<{
    id: number;
    doctorName: string;
    date: string;
    type: string;
    status: string;
  }>;
  patientName: string;
  className?: string;
}

export default function UpcomingAppointmentCard({ appointments, patientName, className }: UpcomingAppointmentCardProps) {
  const upcomingAppointments = appointments?.filter(apt => {
    const isScheduledLike = ["SCHEDULED", "PENDING", "CONFIRMED", "Scheduled", "Pending", "Confirmed"].includes(apt.status);
    const isFuture = new Date(apt.date).getTime() >= new Date().setHours(0,0,0,0);
    return isScheduledLike && isFuture;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  const pastAppointments = (appointments || [])
    .filter(a => {
      const isPast = new Date(a.date).getTime() < Date.now();
      return isPast || a.status === 'COMPLETED';
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
        
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3 h-full flex flex-col">
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
                            <span>{new Date(appointment.date).toLocaleDateString('en-GB')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            <span>{new Date(appointment.date).toLocaleTimeString('en-GB', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button + Upcoming pill */}
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium border-white/20 bg-white/25 p-2 backdrop-blur-sm text-emerald-50 border">Upcoming</span>
                        <Button
                          size="sm"
                          className="bg-green-100 hover:bg-green-100 text-green-900"
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
            
            {/* Past Appointments - Now positioned at bottom */}
            <div className="mt-auto pt-4">
              <h6 className="text-xs font-medium text-emerald-700 mb-3 uppercase tracking-wide">Past Appointments</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(pastAppointments.length > 0 ? pastAppointments.slice(0, 2) : [null, null]).map((apt, idx) => (
                  <div key={idx} className={`relative rounded-xl border ${apt ? 'border-emerald-200' : 'border-emerald-100'} bg-emerald-50/40 p-3 ${apt ? '' : 'opacity-60'}`}>
                    {/* Top-right Completed pill */}
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${apt ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>Completed</span>

                    <div className="pr-20">
                      {/* ID pill above name */}
                      <div className="mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${apt ? 'border-emerald-300 text-emerald-800' : 'border-gray-300 text-gray-500'}`}>{apt ? `ID: ${apt.id}` : 'ID: —'}</span>
                      </div>

                      <h5 className={`text-sm font-semibold ${apt ? 'text-emerald-900' : 'text-emerald-900/50'}`}>{apt ? patientName : 'No past appointment'}</h5>

                      {/* Date line */}
                      <div className="mt-1 text-xs text-emerald-800/80">
                        {apt ? `${new Date(apt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | ${new Date(apt.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : '—'}
                      </div>
                    </div>

                    {/* View button removed from past appointments */}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="text-center text-gray-500 py-8">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">No upcoming appointments</p>
              <p className="text-xs text-gray-500 mt-1">All clear for now!</p>
            </div>
            
            {/* Past Appointments - Also positioned at bottom when no upcoming */}
            <div className="mt-auto pt-4">
              <h6 className="text-xs font-medium text-emerald-700 mb-3 uppercase tracking-wide">Past Appointments</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[0,1].map(i => (
                  <div key={`empty-past-${i}`} className="relative rounded-xl border border-gray-200 bg-gray-100/70 p-3">
                    {/* <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 text-gray-600">Completed</span> */}
                    <div className="pr-20">
                      <div className="mb-1">
                        {/* <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-gray-300 text-gray-500">ID</span> */}
                      </div>
                      <h5 className="text-sm font-semibold text-gray-700">No past appointment</h5>
                      <div className="mt-1 text-xs text-gray-600">Past appointments will appear here with their details.</div>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      {/* <button className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-500 cursor-not-allowed">View</button> */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
    </div>
  );
}