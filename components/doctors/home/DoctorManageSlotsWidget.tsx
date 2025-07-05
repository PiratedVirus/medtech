'use client'
import React from 'react';

export default function DoctorManageSlotsWidget() {
  // Placeholder data
  const totalSlots = 12;
  const bookedSlots = 7;

  return (
    <div className="relative col-span-3 rounded-[2.5rem] min-h-[320px] flex flex-col justify-center px-8 py-7 bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] overflow-hidden shadow-none">
      {/* Glow effect */}
      <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <div className="text-white text-3xl font-semibold mb-2">Total Slots</div>
        <div className="text-white text-[4rem] font-extrabold leading-none mb-2 drop-shadow-lg">{totalSlots}</div>
        <div className="text-[#e6ffe6] text-lg font-medium">Booked: <span className="font-bold">{bookedSlots}</span></div>
        <button className="mt-6 px-6 py-2 rounded-xl border border-[#6ee7b7] bg-transparent text-white text-lg font-medium hover:bg-[#134F30]/30 transition">Manage</button>
      </div>
    </div>
  );
} 