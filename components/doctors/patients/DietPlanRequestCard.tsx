'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { normalizeStatus } from "@/lib/utils/status";

interface DietPlanRequestCardProps {
  patient: {
    id: number;
    name: string;
  };
}

export default function DietPlanRequestCard({ patient }: DietPlanRequestCardProps) {
  const dietPlanRequest = {
    requestCount: 3,
    status: 'pending' as 'pending' | 'completed',
    requestDate: '2024-01-15',
    description: 'Patient requesting personalized diet plan for diabetes management with low-carb focus.'
  };

  return (
    <Card className="relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100 h-[296px]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
      
      <div className="relative z-10 h-full flex flex-col overflow-y-auto">
        {/* Header - Compact */}
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-bold text-gray-900">Diet Plan Request</h3>
        </div>
        
        {/* Content grows to fill space */}
        <div className="group relative overflow-hidden bg-white/80 rounded-xl border border-gray-200/50 p-3 shadow-sm hover:shadow-md transition-all duration-300 flex-1">
          {/* Card Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Request #{dietPlanRequest.requestCount}</span>
                <Badge className={`text-xs font-medium ${
                  normalizeStatus(dietPlanRequest.status) === 'PENDING' 
                    ? 'bg-orange-100 text-orange-700 border-orange-200' 
                    : 'bg-secondary/10 text-secondary border-secondary/20'
                }`}>
                  {normalizeStatus(dietPlanRequest.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-600">Requested on</span>
                <span className="text-xs font-medium text-gray-700">{new Date(dietPlanRequest.requestDate).toLocaleDateString('en-GB')}</span>
              </div>
              <p className="text-xs text-gray-500 italic leading-relaxed">{dietPlanRequest.description}</p>
            </div>
            <Button className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-white rounded-lg py-2 shadow-sm hover:shadow-md transition-all duration-300 group text-xs">
              <span className="font-semibold">Create Plan</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 