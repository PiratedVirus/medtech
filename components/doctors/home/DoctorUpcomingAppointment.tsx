import UpcomingAppointment from '@/components/patients/appointments/view/UpcomingACardAView';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDecryptedProfile } from '@/hooks/use-profile';

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
          setUpcomingAppointment(res.data.appointments[0]); // Get the first upcoming appointment
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
          <div className="text-gray-600">Loading upcoming appointments...</div>
        ) : upcomingAppointment ? (
          <UpcomingAppointment appointment={upcomingAppointment} mode="doctor" />
        ) : (
          <div className="text-gray-600">No upcoming appointments</div>
        )}
      </div>
    </div>
  );
} 