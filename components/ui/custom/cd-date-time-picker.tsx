"use client"

import type * as React from "react"
import { useState, useEffect, useRef } from "react"
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
  const isUpdatingFromProps = useRef(false)
  const lastEmittedValue = useRef<string>("")

  // Initialize from value prop if provided (supports "10:00 AM" and "14:30")
  useEffect(() => {
    if (!value) return

    // Parse 12h format: 1-12:MM AM/PM
    const match12 = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i)
    // Parse 24h format: HH:MM
    const match24 = value.match(/^([01]?\d|2[0-3]):(\d{2})$/)

    let nextHours = hours
    let nextMinutes = minutes
    let nextPeriod: "AM" | "PM" = period

    if (match12) {
      nextHours = match12[1]
      nextMinutes = match12[2]
      nextPeriod = (match12[3].toUpperCase() as "AM" | "PM")
    } else if (match24) {
      const h24 = parseInt(match24[1], 10)
      nextMinutes = match24[2]
      if (h24 === 0) {
        nextHours = "12"
        nextPeriod = "AM"
      } else if (h24 === 12) {
        nextHours = "12"
        nextPeriod = "PM"
      } else if (h24 > 12) {
        nextHours = String(h24 - 12)
        nextPeriod = "PM"
      } else {
        nextHours = String(h24)
        nextPeriod = "AM"
      }
    } else {
      // Unrecognized format; don't override user selection or emit changes
      return
    }

    // Prevent an extra onChange emission after initializing from props
    const computed = `${nextHours.padStart(2, "0")}:${nextMinutes.padStart(2, "0")} ${nextPeriod}`
    lastEmittedValue.current = computed
    isUpdatingFromProps.current = true
    setHours(nextHours)
    setMinutes(nextMinutes)
    setPeriod(nextPeriod)
    isUpdatingFromProps.current = false
  }, [value])

  // Update display value when time components change and export formatted time
  useEffect(() => {
    const formattedHours = hours.padStart(2, "0")
    const formattedMinutes = minutes.padStart(2, "0")
    const timeString = `${formattedHours}:${formattedMinutes} ${period}`
    setDisplayValue(timeString)

    // Only call onChange if we're not updating from props and the value has actually changed
    if (onChange && !isUpdatingFromProps.current && lastEmittedValue.current !== timeString) {
      lastEmittedValue.current = timeString
      onChange(timeString)
    }
  }, [hours, minutes, period]) // Removed onChange from dependencies to prevent infinite loop

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