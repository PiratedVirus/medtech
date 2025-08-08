'use client'
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface PatientAISummaryRowProps {
  summary: string;
}

export default function PatientAISummaryRow({ summary }: PatientAISummaryRowProps) {
  return (
    <Card className="col-span-full relative overflow-hidden rounded-xl bg-gray-50/80 p-4 shadow-sm border border-gray-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/30 rounded-xl" />
      
      <div className="relative z-10">
        {/* Header with AI Icon */}

        
        {/* AI Summary Content */}
        <div className="bg-white/80 border border-gray-200/50 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-700 leading-relaxed">
            {summary}
          </p>
        </div>
        
        {/* AI Disclaimer */}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <Sparkles className="h-2 w-2 text-white" />
          </div>
          <p className="text-xs text-gray-500 italic">
            This summary is AI-generated and should be reviewed by healthcare professionals
          </p>
        </div>
      </div>
    </Card>
  );
} 