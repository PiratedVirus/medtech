"use client";
import { Card } from "@/components/ui/card";
import { Activity, Heart, Calculator } from "lucide-react";

interface HealthToolsRowProps {
  onOpenInsights?: () => void;
}

export default function HealthToolsRow({ onOpenInsights }: HealthToolsRowProps) {
  return (
    <div className="col-span-6 grid grid-cols-3 gap-3">
      {/* Health Insights Card */}
      <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer h-16"
            onClick={() => (onOpenInsights ? onOpenInsights() : window.open('/dashboard/insights', '_blank'))}>
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-700/10 opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
        
        <div className="relative z-10 flex items-center gap-3 h-full p-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <h4 className="text-sm font-semibold text-white">Health Insights</h4>
        </div>
      </Card>

      {/* Heart Rate Predictor Card */}
      <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer h-16"
            onClick={() => window.open('/dashboard/heart-risk', '_blank')}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-900 rounded-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-red-900/10 opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
        
        <div className="relative z-10 flex items-center gap-3 h-full p-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <h4 className="text-sm font-semibold text-white">Heart Risk Predictor</h4>
        </div>
      </Card>

      {/* FIB4 Calculator Card */}
      <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl cursor-pointer h-16"
            onClick={() => window.open('/fib4-calculator', '_blank')}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
        
        <div className="relative z-10 flex items-center gap-3 h-full p-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm">
            <Calculator className="h-4 w-4 text-white" />
          </div>
          <h4 className="text-sm font-semibold text-white">FIB4 Calculator</h4>
        </div>
      </Card>
    </div>
  );
} 