'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DoctorUpcomingSkeleton } from '@/components/ui/custom/cd-appointment-skeleton';
import { useDecryptedProfile } from '@/hooks/use-profile';
import { Calendar, Clock, User } from 'lucide-react';

interface Appointment {
  id: string;
  patient: { name: string };
  doctorAvailability: { 
    date: string;
    startTime: string; 
    endTime: string; 
  };
  status: string;
}

// Soft accent colors for left border
const CARD_ACCENTS = [
  'border-l-4 border-emerald-400',
  'border-l-4 border-teal-400',
  'border-l-4 border-blue-300',
  'border-l-4 border-lime-400',
  'border-l-4 border-cyan-300',
  'border-l-4 border-yellow-300',
  'border-l-4 border-pink-300',
  'border-l-4 border-purple-300',
  'border-l-4 border-orange-300',
  'border-l-4 border-fuchsia-300',
  'border-l-4 border-rose-300',
  'border-l-4 border-green-300',
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'cancelled':
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'scheduled':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'completed':
      return 'bg-green-100 text-green-700 border border-green-200';
    case 'confirmed':
      return 'bg-green-100 text-green-700 border border-green-200';
    case 'pending':
      return 'bg-orange-100 text-orange-700 border border-orange-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
}

export default function DoctorActivePatients() {
  const { profile } = useDecryptedProfile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!profile?.id) return;
      try {
        setIsLoading(true);
        const res = await axios.get('/api/doctor/appointments/upcoming');
        setAppointments(res.data.appointments || []);
      } catch (err) {
        console.error('Failed to load appointments', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (profile?.id) {
      fetchAppointments();
    }
  }, [profile?.id]);

  // Group appointments by date
  const grouped: { [date: string]: Appointment[] } = {};
  appointments.forEach((appt) => {
    const jsDate = new Date(appt.date ?? appt.doctorAvailability?.date);
    const key = jsDate.toISOString().split('T')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(appt);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Flatten appointments with date info for column distribution
  const flatAppointments: { appointment: Appointment; date: string }[] = [];
  sortedDates.forEach(date => {
    grouped[date].forEach(appt => {
      flatAppointments.push({ appointment: appt, date });
    });
  });

  // Only show up to 12 appointments
  const limitedAppointments = flatAppointments.slice(0, 12);

  // Distribute into 3 columns, max 4 per col
  const columns: { appointment: Appointment; date: string }[][] = [[], [], []];
  limitedAppointments.forEach((item, idx) => {
    columns[idx % 3].push(item);
  });

  // Track which dates have been rendered in each column
  function renderColumn(col: { appointment: Appointment; date: string }[], colIdx: number) {
    let lastDate = '';
    return col.map((item, idx) => {
      const showDate = item.date !== lastDate;
      lastDate = item.date;
      // Pick a color for the left border (cycled for distinction)
      const accentIdx = (colIdx * 4 + idx) % CARD_ACCENTS.length;
      const accentClass = CARD_ACCENTS[accentIdx];
      return (
        <React.Fragment key={item.appointment.id}>
          {showDate && (
            <div className="flex items-center gap-2 mt-4 mb-1">
              <Calendar className="h-4 w-4 text-white/80" />
              <h3 className="text-white font-semibold text-lg">
                {formatDate(item.date)}
              </h3>
            </div>
          )}
          <div className={`relative rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow mb-4 bg-muted ${accentClass}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {formatTime(item.appointment.doctorAvailability.startTime)}
                </span>
              </div>
              <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.appointment.status)}`}>
                {item.appointment.status.charAt(0).toUpperCase() + item.appointment.status.slice(1)}
              </span>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-800 text-base">
                {item.appointment.patient.name}
              </h4>
              <p className="text-sm text-gray-600">
                {formatTime(item.appointment.doctorAvailability.startTime)} - {formatTime(item.appointment.doctorAvailability.endTime)}
              </p>
            </div>
            <div className="absolute bottom-3 right-3">
              <a href={`/doctor/appointments/${(item as any).appointment.id}`} className="inline-flex items-center gap-1 rounded-full bg-primary text-white px-3 py-1 text-xs font-semibold shadow hover:bg-primary/90">
                Start
              </a>
            </div>
          </div>
        </React.Fragment>
      );
    });
  }

  if (!profile) {
    return (
      <div className="bg-gradient-to-br from-[#56A67C] to-[#134F30] rounded-3xl p-6 shadow-md w-full">
        <div className="text-center text-white">
          <p>Please log in to view your active patients.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-tr to-[#56A67C] from-[#134F30] rounded-3xl p-6 shadow-md w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-white" />
          <h2 className="text-2xl font-semibold text-white">Active Patients</h2>
        </div>
        <div className="text-white text-sm">
          Next {limitedAppointments.length} appointments
        </div>
      </div>
      {isLoading ? (
        <DoctorUpcomingSkeleton />
      ) : limitedAppointments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((col, idx) => (
              <div key={idx}>{renderColumn(col, idx)}</div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <a href="/doctor/appointments" className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition">
              View All Appointments
            </a>
          </div>
        </>
      ) : (
        <div className="text-center text-white">
          <div className="mb-4">
            <Calendar className="h-12 w-12 mx-auto text-white/60" />
          </div>
          <p className="text-lg font-medium">No upcoming appointments</p>
          <p className="text-sm text-white/80 mt-1">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
