'use client'
import React, { useState } from 'react';

// Placeholder for appointments fetching
const mockAppointments = [
  { time: '08:00 am', patient: { name: 'Cooper Franci', time: '08:00-08:30 am', color: 'bg-[#F9E3E3]' } },
  { time: '08:30 am', patient: { name: 'Alfonso Gouse', time: '08:30-09:00 am', color: 'bg-[#E3F9E7]' } },
  { time: '09:00 am', patient: { name: 'Giana Bator', time: '09:00-09:30 am', color: 'bg-[#E3F9F7]' } },
  { time: '09:30 am', break: true },
  { time: '10:00 am', patient: { name: 'Emerson Dor', time: '10:00-10:30 am', color: 'bg-[#E3F0F9]' } },
  { time: '10:30 am', patient: { name: 'Kaylynn Botosh', time: '10:30-11:00 am', color: 'bg-[#F9E3F3]' } },
  { time: '11:00 am', patient: { name: 'Kaiya Workman', time: '11:00-11:30 am', color: 'bg-[#E3F9E7]' } },
  { time: '11:30 am', patient: { name: 'Kaiya Bator', time: '11:30-12:00 pm', color: 'bg-[#E3F9F7]' } },
  { time: '12:00 pm', break: true },
  { time: '02:00 pm', patient: { name: 'Zaire Lubin', time: '02:00-02:30 pm', color: 'bg-[#E3F0F9]' } },
  { time: '02:30 pm', patient: { name: 'Talan Mango', time: '02:30-03:00 pm', color: 'bg-[#F9E3E3]' } },
  { time: '03:00 pm', patient: { name: 'Skylar Culhane', time: '03:00-03:30 pm', color: 'bg-[#E3F9E7]' } },
  { time: '03:30 pm', patient: { name: 'Alfredo', time: '03:30-04:00 pm', color: 'bg-[#E3F9F7]' } },
  { time: '04:00 pm', patient: { name: 'Carter George', time: '04:00-04:30 pm', color: 'bg-[#E3F0F9]' } },
  { time: '04:30 pm', patient: { name: 'Jocelyn Work', time: '04:30-05:00 pm', color: 'bg-[#E3F9F7]' } },
];

function getDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

export default function DoctorActivePatients() {
  const [selectedDate, setSelectedDate] = useState(() => getDateString(new Date()));

  // TODO: Replace with real API fetch for appointments by date
  const appointments = mockAppointments;

  // Date navigation
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

  // For now, use a single column for full width
  return (
    <div className="bg-gradient-to-br from-[#56A67C] to-[#134F30] rounded-3xl p-6 shadow-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-white">Active Patients</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(getDateString(new Date()))}
            className="bg-white text-green-700 px-2 py-1 rounded-lg font-medium text-sm"
          >
            Today
          </button>
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
        {appointments.map((slot, idx) => (
          slot.break ? (
            <div key={idx} className="bg-[#1B6B46] text-white text-center rounded-lg py-2 font-semibold">Break Time</div>
          ) : slot.patient ? (
            <div key={idx} className={`rounded-lg px-4 py-3 flex flex-col ${slot.patient.color} shadow-sm`}>
              <span className="text-xs text-gray-500 font-medium">{slot.time}</span>
              <span className="font-semibold text-gray-800">{slot.patient.name}</span>
              <span className="text-xs text-gray-500">{slot.patient.time}</span>
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
} 