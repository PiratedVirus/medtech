'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDecryptedProfile } from '@/hooks/use-profile';

export default function DoctorManageSlotsWidget() {
  const { profile } = useDecryptedProfile();
  const [summary, setSummary] = useState({ totalSlots: 0, bookedSlots: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      if (!profile?.id) return;
      
      try {
        setIsLoading(true);
        const res = await axios.get('/api/doctor/slots');
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load slots summary', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (profile?.id) {
      fetchSummary();
    }
  }, [profile?.id]);

  return (
    <div className="relative col-span-3 rounded-3xl flex flex-col justify-center px-8 py-7 bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] overflow-hidden shadow-none">
      {/* Glow effect */}
      <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <div className="text-white text-3xl font-semibold mb-2">Total Slots</div>
        <div className="text-white text-[4rem] font-extrabold leading-none mb-2 drop-shadow-lg">
          {isLoading ? '...' : summary.totalSlots}
        </div>
        <div className="text-[#e6ffe6] text-lg font-medium">
          Booked: <span className="font-bold">{isLoading ? '...' : summary.bookedSlots}</span>
        </div>
        <button className="mt-3 px-6 py-2 rounded-xl border border-[#6ee7b7] bg-transparent text-white text-lg font-medium hover:bg-[#134F30]/30 transition">Manage</button>
      </div>
    </div>
  );
} 