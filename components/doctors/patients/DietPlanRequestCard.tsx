'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface DietPlanRequestCardProps {
  patient: {
    id: number;
    name: string;
  };
}

export default function DietPlanRequestCard({ patient }: DietPlanRequestCardProps) {
  // Mock diet plan request data
  const dietPlanRequest = {
    requestCount: 3,
    status: 'pending' as 'pending' | 'completed',
    requestDate: '2024-01-15',
    description: 'Patient requesting personalized diet plan for diabetes management with low-carb focus.'
  };

  return (
    <Card className="col-span-2 relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
      
      <div className="relative z-10">
        {/* Header - Compact */}
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-bold text-gray-900">Diet Plan Request</h3>
        </div>
        
        {/* Request Info - New Layout */}
        <div className="group relative overflow-hidden bg-white/80 rounded-xl border border-gray-200/50 p-3 shadow-sm hover:shadow-md transition-all duration-300">
          {/* Card Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 space-y-3">
            {/* First Row: Request Count and Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Request #{dietPlanRequest.requestCount}</span>
              <Badge className={`text-xs font-medium ${
                dietPlanRequest.status === 'pending' 
                  ? 'bg-orange-100 text-orange-700 border-orange-200' 
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                {dietPlanRequest.status === 'pending' ? 'Pending' : 'Completed'}
              </Badge>
            </div>

            {/* Request Date */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-600">Requested on</span>
              <span className="text-xs font-medium text-gray-700">
                {new Date(dietPlanRequest.requestDate).toLocaleDateString('en-GB')}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 italic leading-relaxed">
              {dietPlanRequest.description}
            </p>

            {/* Process Button */}
            <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-2 shadow-sm hover:shadow-md transition-all duration-300 group text-xs">
              <span className="font-semibold">
                Create Plan
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 