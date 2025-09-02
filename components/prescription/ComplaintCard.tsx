"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  const [durationUnit, setDurationUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('days');
  const [durationValue, setDurationValue] = useState<number>(1);

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

  const unitMultiplier = (unit: 'days' | 'weeks' | 'months' | 'years'): number => {
    switch (unit) {
      case 'weeks':
        return 7;
      case 'months':
        return 30; // approximate month
      case 'years':
        return 365; // approximate year
      default:
        return 1;
    }
  };

  const pickBestUnit = (days: number): { unit: 'days' | 'weeks' | 'months' | 'years'; value: number } => {
    if (days % 365 === 0 && days >= 365) {
      return { unit: 'years', value: Math.max(days / 365, 1) };
    }
    if (days % 30 === 0 && days >= 30) {
      return { unit: 'months', value: Math.max(days / 30, 1) };
    }
    if (days % 7 === 0 && days >= 7) {
      return { unit: 'weeks', value: Math.max(days / 7, 1) };
    }
    return { unit: 'days', value: Math.max(days, 1) };
  };

  // Keep local duration value in sync if parent updates daysSince
  useEffect(() => {
    const days = Math.max(complaint.daysSince || 1, 1);
    const best = pickBestUnit(days);
    setDurationUnit(best.unit);
    setDurationValue(best.value);
  }, [complaint.daysSince]);

  const handleDurationValueChange = (v: string) => {
    const num = Math.max(parseInt(v || '1', 10) || 1, 1);
    setDurationValue(num);
    const days = num * unitMultiplier(durationUnit);
    onUpdate({ daysSince: days });
  };

  const handleDurationUnitChange = (unit: string) => {
    const u = (unit as 'days' | 'weeks' | 'months' | 'years');
    const sourceDays = Math.max(complaint.daysSince || (durationValue * unitMultiplier(durationUnit)), 1);
    const newValue = Math.max(Math.round(sourceDays / unitMultiplier(u)), 1);
    setDurationUnit(u);
    setDurationValue(newValue);
    const days = newValue * unitMultiplier(u);
    onUpdate({ daysSince: days });
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
            
            {/* Duration input with unit selector */}
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs text-gray-500">Duration:</span>
              <Input
                type="number"
                min={1}
                value={durationValue}
                onChange={(e) => handleDurationValueChange(e.target.value)}
                className="w-20 h-8 bg-white rounded-lg"
              />
              <Select value={durationUnit} onValueChange={(value) => handleDurationUnitChange(value)}>
                <SelectTrigger className="w-24 h-8 bg-white rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                  <SelectItem value="years">Years</SelectItem>
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
              {/* Duration input with unit selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Duration:</span>
                <Input
                  type="number"
                  min={1}
                  value={durationValue}
                  onChange={(e) => handleDurationValueChange(e.target.value)}
                  className="w-20 h-8 bg-white rounded-lg"
                />
                <Select value={durationUnit} onValueChange={(value) => handleDurationUnitChange(value)}>
                  <SelectTrigger className="w-24 h-8 bg-white rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
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