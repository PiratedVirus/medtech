"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Edit2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplaintCardProps {
  complaint: {
    id: string;
    text: string;
    severity: "PERFECT" | "GOOD" | "MODERATE" | "RISK" | "CRITICAL";
    daysSince?: number;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(complaint.text);

  const getSeverityColor = (severity: string) => {
    const option = severityOptions.find(opt => opt.value === severity);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  const getSeverityLabel = (severity: string) => {
    const option = severityOptions.find(opt => opt.value === severity);
    return option?.label || severity;
  };

  const handleSave = () => {
    onUpdate({ text: editText });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(complaint.text);
    setIsEditing(false);
  };

  const getTimeAgo = (daysSince?: number) => {
    if (!daysSince) return "Just now";
    if (daysSince === 1) return "1 Day ago";
    if (daysSince < 7) return `${daysSince} Days ago`;
    if (daysSince < 30) return `${Math.floor(daysSince / 7)} Weeks ago`;
    return `${Math.floor(daysSince / 30)} Months ago`;
  };

  return (
    <Card className="p-4 border-l-4 border-blue-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{complaint.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(complaint.daysSince)}
                    </span>
                    <FileText className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {!isEditing && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Days:</span>
                <Select
                  value={complaint.daysSince?.toString() || "1"}
                  onValueChange={(value) => onUpdate({ daysSince: parseInt(value) })}
                >
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 14, 21, 30].map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Severity:</span>
                <Select
                  value={complaint.severity}
                  onValueChange={(value) => onUpdate({ severity: value })}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", option.color)}>
                            {option.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </>
          )}

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

      {!isEditing && (
        <div className="mt-3 flex items-center justify-between">
          <Badge className={cn("text-xs", getSeverityColor(complaint.severity))}>
            {getSeverityLabel(complaint.severity)}
          </Badge>
        </div>
      )}
    </Card>
  );
} 