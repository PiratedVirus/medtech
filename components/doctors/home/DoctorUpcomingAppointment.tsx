import UpcomingAppointment from '@/components/patients/appointments/view/UpcomingACardAView';
import React from 'react';

const mockAppointment = {
  doctor: { name: 'Mr. Sameer' },
  doctorAvailability: {
    startTime: '02:30pm',
    date: '2024-12-11',
  },
  consultationType: 'consultation',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DoctorUpcomingAppointment() {
  return (
    <div className="flex flex-col justify-between">
      <div className="mb-3">
        <div className="text-3xl font-bold text-[#134F30] mb-4">{getGreeting()}, Dr. Abhinav! <span className="text-2xl">👋</span></div>
        <UpcomingAppointment appointment={mockAppointment} /> 
      </div>
    </div>
  );
} 