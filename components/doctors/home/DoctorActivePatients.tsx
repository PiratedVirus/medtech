'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDecryptedProfile } from '@/hooks/use-profile';

interface Appointment {
  patient: { name: string };
  doctorAvailability: { startTime: string; endTime: string };
}

function getDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

export default function DoctorActivePatients() {
  const { profile } = useDecryptedProfile();
  const [selectedDate, setSelectedDate] = useState(() => getDateString(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!profile?.id) return;
      
      try {
        setIsLoading(true);
        const res = await axios.get(`/api/doctor/appointments/active?date=${selectedDate}`);
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
  }, [selectedDate, profile?.id]);

  const handlePrev = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(getDateString(prev));
  };
  const handleNext = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(getDateString(next));
  };

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
    <div className="bg-gradient-to-br from-[#56A67C] to-[#134F30] rounded-3xl p-6 shadow-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-white">Active Patients</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedDate(getDateString(new Date()))} className="bg-white text-green-700 px-2 py-1 rounded-lg font-medium text-sm">Today</button>
          <button
            onClick={() => {
              const tom = new Date();
              tom.setDate(tom.getDate() + 1);
              setSelectedDate(getDateString(tom));
            }}
            className="bg-white text-green-700 px-2 py-1 rounded-lg font-medium text-sm"
          >
            Tomorrow
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white text-green-700 border border-white px-2 py-1 rounded-lg font-medium text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center text-white">
            <p>Loading appointments...</p>
          </div>
        ) : appointments.length > 0 ? (
          appointments.map((appt, idx) => (
            <div key={idx} className="rounded-lg px-4 py-3 flex flex-col bg-white shadow-sm">
              <span className="text-xs text-gray-500 font-medium">{appt.doctorAvailability.startTime}</span>
              <span className="font-semibold text-gray-800">{appt.patient.name}</span>
              <span className="text-xs text-gray-500">{`${appt.doctorAvailability.startTime}-${appt.doctorAvailability.endTime}`}</span>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-white">
            <p>No appointments for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
}
