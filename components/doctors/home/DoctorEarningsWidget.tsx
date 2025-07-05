'use client'
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useDecryptedProfile } from '@/hooks/use-profile';

// Default data for chart
const defaultData = [
  { month: 'Jan', earnings: 0 },
  { month: 'Feb', earnings: 0 },
  { month: 'Mar', earnings: 0 },
  { month: 'Apr', earnings: 0 },
  { month: 'May', earnings: 0 },
  { month: 'Jun', earnings: 0 },
];

export default function DoctorEarningsWidget() {
  const { profile } = useDecryptedProfile();
  const [earnings, setEarnings] = useState({ total: 0, appointment: 0 });
  const [data, setData] = useState(defaultData);
  const [period, setPeriod] = useState('Monthly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      if (!profile?.id) return;
      
      try {
        setIsLoading(true);
        const res = await axios.get(`/api/doctor/earnings`);
        setEarnings(res.data.earnings);
        
        // For now, we'll use the total earnings to populate the chart
        // In a real implementation, you'd want to fetch monthly data
        const monthlyData = defaultData.map((item, index) => ({
          ...item,
          earnings: Math.floor(res.data.earnings.total / 6) + (index * 1000) // Simple distribution
        }));
        setData(monthlyData);
      } catch (error) {
        console.error("Error fetching earnings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (profile?.id) {
      fetchEarnings();
    }
  }, [profile?.id]);

  return (
    <div className="relative col-span-3 rounded-[2.5rem] min-h-[320px] flex flex-col justify-between px-8 py-7 bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] overflow-hidden shadow-none">
      {/* Glow effect */}
      <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-white text-3xl font-semibold leading-tight">Total Earnings</div>
            <div className="text-[#e6ffe6] text-xl font-medium mt-2">
              {isLoading ? 'Loading...' : `Rs.${earnings.total.toLocaleString()}`}
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#6ee7b7] bg-transparent text-white text-lg font-medium hover:bg-[#134F30]/30 transition">
            {period}
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-end justify-center relative w-full">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={data} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fff" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#56A67C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#e6ffe6" />
              <YAxis stroke="#e6ffe6" hide />
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
              <Tooltip contentStyle={{ background: '#10162F', borderRadius: 12, color: '#fff', border: 'none' }} labelStyle={{ color: '#fff' }} formatter={(value) => [`₹${value}`, 'Earnings']} />
              <Area type="monotone" dataKey="earnings" stroke="#fff" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 