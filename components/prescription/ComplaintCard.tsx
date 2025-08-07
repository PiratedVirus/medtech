"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { X, FileText, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ComplaintCardProps {
  complaint: {
    id: string;
    text: string;
    severity: "PERFECT" | "GOOD" | "MODERATE" | "RISK" | "CRITICAL";
    daysSince?: number;
    isFlagged?: boolean;
  };
  onUpdate: (updates: any) => void;
  onRemove: () => void;
  severityOptions: Array<{
    value: string;
    label: string;
    color: string;
  }>;
}

export default function ComplaintCard({
  complaint,
  onUpdate,
  onRemove,
  severityOptions,
}: ComplaintCardProps) {
  const { toast } = useToast();
  const [isSplitScreen, setIsSplitScreen] = useState(false);

  useEffect(() => {
    const detectSplitScreen = () => {
      // Check if we're in split screen mode by looking for the split screen container
      const splitContainer = document.querySelector('.lg\\:w-1\\/2') as HTMLElement;
      const scrollContainer = document.querySelector('.lg\\:h-full.overflow-y-auto') as HTMLElement;
      setIsSplitScreen(!!(splitContainer || scrollContainer));
    };

    detectSplitScreen();
    
    // Re-check on window resize
    window.addEventListener('resize', detectSplitScreen);
    return () => window.removeEventListener('resize', detectSplitScreen);
  }, []);

  const handleFlagToggle = () => {
    onUpdate({ isFlagged: !complaint.isFlagged });
  };


  const getSeverityColor = (severity: string) => {
    const option = severityOptions.find(opt => opt.value === severity);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const getSeverityLabel = (severity: string) => {
    const option = severityOptions.find(opt => opt.value === severity);
    return option?.label || severity;
  };



  const getTimeAgo = (daysSince?: number) => {
    if (!daysSince) return "Just now";
    if (daysSince === 1) return "1 Day ago";
    if (daysSince < 7) return `${daysSince} Days ago`;
    if (daysSince < 30) return `${Math.floor(daysSince / 7)} Weeks ago`;
    return `${Math.floor(daysSince / 30)} Months ago`;
  };

  const getSeverityValue = (severity: string) => {
    const severityMap = {
      "PERFECT": 1,
      "GOOD": 2,
      "MODERATE": 3,
      "RISK": 4,
      "CRITICAL": 5,
    };
    return severityMap[severity as keyof typeof severityMap] || 3;
  };

  const getSeverityFromValue = (value: number) => {
    const severityMap = {
      1: "PERFECT",
      2: "GOOD",
      3: "MODERATE",
      4: "RISK",
      5: "CRITICAL",
    };
    return severityMap[value as keyof typeof severityMap] || "MODERATE";
  };

  return (
    <Card className="p-4 bg-custom-mutedgreen">
      {isSplitScreen ? (
        // Two-row layout for split screen compatibility
        <div className="space-y-3">
          {/* Row 1 - Complaint name and days */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-900 font-semibold">{complaint.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {getTimeAgo(complaint.daysSince)}
                </span>
              </div>
            </div>
            
            {/* Days selector */}
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs text-gray-500">Days:</span>
              <Select
                value={complaint.daysSince?.toString() || "1"}
                onValueChange={(value) => onUpdate({ daysSince: parseInt(value) })}
              >
                <SelectTrigger className="w-16 h-8 bg-white rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  {[1, 2, 3, 4, 5, 6, 7, 14, 21, 30].map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2 - Severity controls and actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Severity badge */}
            <div className="flex-shrink-0">
              <Badge className={cn("text-xs", getSeverityColor(complaint.severity))}>
                {getSeverityLabel(complaint.severity)}
              </Badge>
            </div>

            {/* Severity slider */}
            <div className="flex-1 max-w-32 mx-4">
              <Slider
                value={[getSeverityValue(complaint.severity)]}
                onValueChange={(value) => onUpdate({ severity: getSeverityFromValue(value[0]) })}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFlagToggle}
                className={cn(
                  "h-8 w-8 p-0",
                  complaint.isFlagged ? "text-red-500" : "text-gray-400 hover:text-red-500"
                )}
              >
                <Flag className="h-3 w-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Original single-row layout for non-split screen
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Left side - Complaint name (6 cols) */}
          <div className="col-span-6">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-semibold">{complaint.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(complaint.daysSince)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Controls (6 cols) */}
          <div className="col-span-6">
            <div className="flex items-center justify-between gap-3">
              {/* Days selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Days:</span>
                <Select
                  value={complaint.daysSince?.toString() || "1"}
                  onValueChange={(value) => onUpdate({ daysSince: parseInt(value) })}
                >
                  <SelectTrigger className="w-16 h-8 bg-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {[1, 2, 3, 4, 5, 6, 7, 14, 21, 30].map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Severity badge */}
              <div className="w-32 text-center">
                <Badge className={cn("text-xs", getSeverityColor(complaint.severity))}>
                  {getSeverityLabel(complaint.severity)}
                </Badge>
              </div>

              {/* Severity slider */}
              <div className="w-32 flex-shrink-0">
                <Slider
                  value={[getSeverityValue(complaint.severity)]}
                  onValueChange={(value) => onUpdate({ severity: getSeverityFromValue(value[0]) })}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleFlagToggle}
                  className={cn(
                    "h-8 w-8 p-0",
                    complaint.isFlagged ? "text-red-500" : "text-gray-400 hover:text-red-500"
                  )}
                >
                  <Flag className="h-3 w-3" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRemove}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 