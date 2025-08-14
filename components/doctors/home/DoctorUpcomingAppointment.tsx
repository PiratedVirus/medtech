import UpcomingAppointment from '@/components/patients/appointments/view/UpcomingACardAView';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDecryptedProfile } from '@/hooks/use-profile';
import { DoctorUpcomingSkeleton } from '@/components/ui/custom/cd-appointment-skeleton';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DoctorUpcomingAppointment() {
  const { profile } = useDecryptedProfile();
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUpcomingAppointment() {
      if (!profile?.id) return;
      
      try {
        setIsLoading(true);
        const res = await axios.get('/api/doctor/appointments/upcoming');
        if (res.data.appointments && res.data.appointments.length > 0) {
          // Defensive sort by the transformed date to avoid server/client drift
          const sorted = [...res.data.appointments].sort(
            (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setUpcomingAppointment(sorted[0]);
        }
      } catch (error) {
        console.error('Error fetching upcoming appointment:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (profile?.id) {
      fetchUpcomingAppointment();
    }
  }, [profile?.id]);

  const doctorName = profile?.name || 'Doctor';

  return (
    <div className="flex flex-col justify-between">
      <div className="mb-2">
        {isLoading ? (
          <DoctorUpcomingSkeleton />
        ) : upcomingAppointment ? (
          <UpcomingAppointment appointment={upcomingAppointment} mode="doctor" />
        ) : (
          <div className="relative rounded-3xl px-8 py-7 bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] overflow-hidden shadow-none">
            <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-white text-2xl font-semibold leading-tight">No upcoming appointments</div>
                <div className="text-[#e6ffe6] text-sm mt-2">You're all caught up. New appointments will appear here.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 