'use client'
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, CalendarDays, Clock3 } from "lucide-react";

interface UpcomingAppointmentCardProps {
  appointments: Array<{
    id: number;
    doctorName: string;
    date: string;
    startTime?: string;
    type: string;
  }>;
}

export default function UpcomingAppointmentCard({ appointments }: UpcomingAppointmentCardProps) {
  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.date) > new Date()
  );

  return (
    <Card className="col-span-2 relative overflow-hidden rounded-xl bg-custom-mutedgreen p-4 shadow-sm border border-gray-100">
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="flex items-start gap-3">
                    {/* Doctor Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    
                    {/* Appointment Details */}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{appointment.doctorName}</h4>
                      <p className="text-xs text-gray-600 mb-2">Clinic consultation</p>
                      
                      {/* Time and Date - Compact */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3 text-secondary" />
                          <span className="text-xs font-medium text-gray-700">
                            {appointment.startTime || '02:30pm'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-secondary" />
                          <span className="text-xs font-medium text-gray-700">
                            {new Date(appointment.date).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <Badge className="bg-green-100 text-green-700 border-green-200 font-medium text-xs">
                      Confirmed
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            {/* Empty State Icon */}
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            
            <h4 className="text-sm font-semibold text-gray-700 mb-1">No Upcoming Appointments</h4>
            <p className="text-xs text-gray-500 mb-3">Patient has no scheduled consultations</p>
            
            {/* Action Button */}
            <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors duration-200 text-xs">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">Schedule</span>
            </button>
          </div>
        )}
      </div>
    </Card>
  );
} 