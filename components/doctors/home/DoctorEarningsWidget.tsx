'use client'
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

const data = [
  { month: 'Jan', earnings: 12000 },
  { month: 'Feb', earnings: 15000 },
  { month: 'Mar', earnings: 18000 },
  { month: 'Apr', earnings: 14000 },
  { month: 'May', earnings: 20000 },
  { month: 'Jun', earnings: 22000 },
];

export default function DoctorEarningsWidget() {
  const total = 15069;
  const period = 'Monthly';

  return (
    <div className="relative col-span-3 rounded-[2.5rem] min-h-[320px] flex flex-col justify-between px-8 py-7 bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] overflow-hidden shadow-none">
      {/* Glow effect */}
      <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-white text-3xl font-semibold leading-tight">Total Earnings</div>
            <div className="text-[#e6ffe6] text-xl font-medium mt-2">Rs.{total.toLocaleString()}</div>
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