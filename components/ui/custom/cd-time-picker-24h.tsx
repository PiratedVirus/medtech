"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TimePicker24hProps {
  className?: string;
  value?: string; // HH:MM format
  onChange?: (value: string) => void;
}

export function TimePicker24h({ className, value, onChange }: TimePicker24hProps) {
  const [open, setOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<string>("");
    console.log("$$ Value:", value);
  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const match = value.match(/^([01]?\d|2[0-3]):(\d{2})$/);
      if (match) {
        const hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        setSelectedHour(hour);
        setSelectedMinute(minute);
        setDisplayValue(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
      }
    } else {
      setSelectedHour(0);
      setSelectedMinute(0);
      setDisplayValue("");
    }
  }, [value]);

  // Update display when selection changes
  useEffect(() => {
    const timeString = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
    setDisplayValue(timeString);
    if (onChange && timeString !== value) {
      onChange(timeString);
    }
  }, [selectedHour, selectedMinute, onChange, value]);

  const handleHourChange = (hour: number) => {
    setSelectedHour(hour);
  };

  const handleMinuteChange = (minute: number) => {
    setSelectedMinute(minute);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !displayValue && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 opacity-50" />
            {displayValue || "Select time..."}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex h-[300px] divide-x">
          <ScrollArea className="w-20">
            <div className="flex flex-col p-2">
              {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                <Button
                  key={hour}
                  size="sm"
                  variant={selectedHour === hour ? "default" : "ghost"}
                  className="w-full justify-center"
                  onClick={() => handleHourChange(hour)}
                >
                  {hour.toString().padStart(2, "0")}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <ScrollArea className="w-20">
            <div className="flex flex-col p-2">
              {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                <Button
                  key={minute}
                  size="sm"
                  variant={selectedMinute === minute ? "default" : "ghost"}
                  className="w-full justify-center"
                  onClick={() => handleMinuteChange(minute)}
                >
                  {minute.toString().padStart(2, "0")}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}


