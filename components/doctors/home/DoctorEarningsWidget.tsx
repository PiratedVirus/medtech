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

const filterOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'cash', label: 'Cash' },
  { value: 'online', label: 'Online' },
];
interface IDoctorEarningsWidgetProps {
  isDropdownVisible?: boolean;
  earningType?: string;
}

export default function DoctorEarningsWidget( {isDropdownVisible, earningType}: IDoctorEarningsWidgetProps ) {
  const { profile } = useDecryptedProfile();
  const [data, setData] = useState(defaultData);
  const [selectedFilter, setSelectedFilter] = useState('paid');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [widgetTitle, setWidgetTitle] = useState('Total Earnings');


  useEffect(() => {
    if(!isDropdownVisible) {
      setSelectedFilter(earningType || 'paid');
      setWidgetTitle(earningType || 'Total Earnings');
    }
  }, [earningType, isDropdownVisible]);

  useEffect(() => {
    async function fetchEarnings() {
      if (!profile?.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch chart data based on selected filter
        const chartRes = await axios.get(`/api/doctor/earnings/chart-data?filter=${selectedFilter}`);
        setData(chartRes.data.data);
      } catch (error) {
        console.error("Error fetching earnings:", error);
        setData(defaultData);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (profile?.id) {
      fetchEarnings();
    }
  }, [profile?.id, selectedFilter]);

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
  };

  const getFilterLabel = () => {
    const option = filterOptions.find(opt => opt.value === selectedFilter);
    return option ? option.label : 'Paid';
  };

  // Calculate total from chart data
  const totalEarnings = data.reduce((sum, item) => sum + item.earnings, 0);

  return (
    <div className="relative col-span-3 rounded-3xl flex flex-col justify-between px-8 py-7 bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] overflow-hidden shadow-none">
      {/* Glow effect */}
      <div className="absolute left-0 right-0 bottom-0 top-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)'}} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-white text-3xl font-semibold leading-tight capitalize">{widgetTitle}</div>
            <div className="text-[#e6ffe6] text-xl font-medium mt-2">
              {isLoading ? 'Loading...' : `Rs.${(totalEarnings / 100).toLocaleString()}`}
            </div>
          </div>
         {isDropdownVisible ? (<div className="relative">
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#6ee7b7] bg-transparent text-white text-lg font-medium hover:bg-[#134F30]/30 transition"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              {getFilterLabel()}
              <ChevronDown className={`w-5 h-5 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showFilterDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[120px]">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      selectedFilter === option.value ? 'bg-green-50 text-green-700' : 'text-gray-700'
                    }`}
                    onClick={() => handleFilterChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>) : null} 
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
              <Tooltip 
                contentStyle={{ 
                  background: '#10162F', 
                  borderRadius: 12, 
                  color: '#fff', 
                  border: 'none' 
                }} 
                labelStyle={{ color: '#fff' }} 
                formatter={(value) => [`₹${(Number(value) / 100).toFixed(2)}`, `${getFilterLabel()} Earnings`]} 
              />
              <Area type="monotone" dataKey="earnings" stroke="#fff" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 