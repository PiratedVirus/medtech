"use client"

import type * as React from "react"
import { useState, useEffect } from "react"
import { ChevronDown, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimeInputProps {
  className?: string
  value?: string
  onChange?: (value: string) => void
}

export function TimeInput({ className, value, onChange, ...props }: TimeInputProps) {
  const [open, setOpen] = useState(false)
  const [hours, setHours] = useState<string>("12")
  const [minutes, setMinutes] = useState<string>("00")
  const [period, setPeriod] = useState<"AM" | "PM">("AM")
  const [displayValue, setDisplayValue] = useState<string>("")

  // Initialize from value prop if provided (e.g. "10:00 AM")
  useEffect(() => {
    if (value) {
      const match = value.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/)
      if (match) {
        setHours(match[1])
        setMinutes(match[2])
        setPeriod(match[3] as "AM" | "PM")
      }
    }
  }, [value])

  // Update display value when time components change and export formatted time
  useEffect(() => {
    const formattedHours = hours.padStart(2, "0")
    const formattedMinutes = minutes.padStart(2, "0")
    const timeString = `${formattedHours}:${formattedMinutes} ${period}`
    setDisplayValue(timeString)

    if (onChange) {
      onChange(timeString)
    }
  }, [hours, minutes, period, onChange])

  // Generate hours options (1-12)
  const hoursOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString())

  // Generate minutes options with 15-minute gap
  const minutesOptions = ["00", "15", "30", "45"]

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
          {...props}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 opacity-50" />
            {displayValue || "Select time..."}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-white text-black" align="start">
        <div className="flex items-end gap-2">
          <div className="grid gap-1">
            <p className="text-sm font-medium">Hours</p>
            <Select value={hours} onValueChange={(value) => setHours(value)}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {hoursOptions.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <p className="text-sm font-medium">Minutes</p>
            <Select value={minutes} onValueChange={(value) => setMinutes(value)}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {minutesOptions.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <p className="text-sm font-medium">Period</p>
            <Select value={period} onValueChange={(value) => setPeriod(value as "AM" | "PM")}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}