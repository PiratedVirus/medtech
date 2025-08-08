'use client'
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Plus } from "lucide-react";

interface PatientPill {
  id: string;
  key: string;
  value: string;
}

interface PatientPillsRowProps {
  pills: PatientPill[];
  onEditPill?: (pillId: string) => void;
  onAddPill?: () => void;
}

export default function PatientPillsRow({ pills, onEditPill, onAddPill }: PatientPillsRowProps) {
  return (
    <Card className="col-span-full relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
      
      <div className="relative z-10">
        {/* Header */}

        
        {/* Pills Container */}
        <div className="flex flex-wrap gap-3 items-start">
          {pills.map((pill) => (
            <div key={pill.id} className="group relative">
              {/* Edit Icon - Top Right */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-white/80 hover:bg-white text-gray-500 hover:text-primary rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                onClick={() => onEditPill?.(pill.id)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              
              {/* Pill */}
              <div className="bg-white/80 border border-gray-200/50 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{pill.key}:</span>
                  <span className="text-sm font-semibold text-primary">{pill.value}</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add New Pill Button */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4 py-2 border-dashed border-gray-300 hover:border-primary hover:text-primary transition-all duration-200 bg-white/60 hover:bg-white/80"
            onClick={onAddPill}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Add Metric</span>
          </Button>
        </div>
      </div>
    </Card>
  );
} 