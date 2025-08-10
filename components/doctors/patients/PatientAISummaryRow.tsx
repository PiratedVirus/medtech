'use client'
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useMemo } from "react";

interface PatientAISummaryRowProps {
  summary: string;
}

function patternStyle(rgba: string): React.CSSProperties {
  return {
    backgroundImage: `radial-gradient(circle at 1px 1px, ${rgba} 1px, transparent 0)` ,
    backgroundSize: '18px 18px',
  };
}

export default function PatientAISummaryRow({ summary }: PatientAISummaryRowProps) {
  return (
    <div className="col-span-full mt-5">
      <div className="relative rounded-xl border border-blue-200/50 bg-gradient-to-br from-white/80 via-blue-50/70 to-blue-100/80 p-5 shadow-lg overflow-hidden" role="complementary" aria-label="AI generated summary">
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <Sparkles className="h-4 w-4 font-bold text-blue-600" aria-hidden />
          <span className="text-sm font-bold text-blue-700">AI Summary</span>
          <span className="ml-1 inline-block h-[6px] w-[6px] rounded-full bg-black/10 animate-pulse" aria-hidden />
        </div>

        <p className="text-sm text-gray-800 leading-relaxed relative z-10">
          {summary}
        </p>
      </div>
    </div>
  );
}