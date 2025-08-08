'use client'
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, CalendarDays, Clock3 } from "lucide-react";

interface UpcomingAppointmentCardProps {
  appointments: Array<{
    id: number;
    doctorName: string;
    date: string;
    type: string;
    status: string;
  }>;
}

export default function UpcomingAppointmentCard({ appointments }: UpcomingAppointmentCardProps) {
  const upcomingAppointments = appointments?.filter(apt => 
    apt.status === "SCHEDULED" || apt.status === "PENDING"
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  return (
    <Card className="col-span-2 relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
      
      <div className="relative z-10">
        {/* Header - Compact */}
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-bold text-gray-900">Upcoming Appointment</h3>
        </div>
        
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.slice(0, 1).map(appointment => (
              <div key={appointment.id} className="group relative overflow-hidden bg-white/80 rounded-xl border border-gray-200/50 p-3 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Appointment Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="flex items-start gap-3">
                    {/* Doctor Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    
                    {/* Appointment Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                        Dr. {appointment.doctorName}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2 capitalize">
                        {appointment.type.toLowerCase()} Consultation
                      </p>
                      
                      {/* Time and Date */}
                      <div className="flex items-center gap-4 text-xs text-gray-600">
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
                    
                    {/* Status Badge */}
                    <Badge className={`text-xs font-medium ${
                      appointment.status === 'SCHEDULED' 
                        ? 'bg-primary/10 text-primary border-primary/20' 
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    }`}>
                      {appointment.status === 'SCHEDULED' ? 'Scheduled' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-gray-600 mb-3">No upcoming appointments</p>
            <button className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary/90 transition-colors">
              Schedule Appointment
            </button>
          </div>
        )}
      </div>
    </Card>
  );
} 