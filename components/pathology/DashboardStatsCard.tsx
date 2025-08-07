import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  gradient?: {
    from: string;
    to: string;
  };
}

export default function DashboardStatsCard({
  title,
  value,
  icon: Icon,
  gradient = {
    from: "#1e5636",
    to: "#2e8b57"
  }
}: DashboardStatsCardProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-tr from-[#1e5636] to-[#2e8b57] border-none shadow-lg">
      <div 
        className="absolute left-0 right-0 bottom-0 top-0 z-0" 
        style={{ background: 'radial-gradient(ellipse at 60% 70%, #56A67C55 40%, transparent 80%)' }} 
      />
      <CardContent className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">{title}</h2>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 