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
  const [hours, setHours] = useState<string>("00")
  const [minutes, setMinutes] = useState<string>("00")
  const [displayValue, setDisplayValue] = useState<string>("")
  const isUpdatingFromProps = useRef(false)
  const lastEmittedValue = useRef<string>("")

  // Initialize from value prop if provided (24h only: "14:30")
  useEffect(() => {
    if (!value) return

    // Parse 24h format: HH:MM
    const match24 = value.match(/^([01]?\d|2[0-3]):(\d{2})$/)

    let nextHours = hours
    let nextMinutes = minutes

    if (match24) {
      const h24 = parseInt(match24[1], 10)
      nextMinutes = match24[2]
      nextHours = String(h24)
    } else {
      // Unrecognized format; don't override user selection or emit changes
      return
    }

    // Prevent an extra onChange emission after initializing from props
    const computed = `${nextHours.padStart(2, "0")}:${nextMinutes.padStart(2, "0")}`
    lastEmittedValue.current = computed
    isUpdatingFromProps.current = true
    setHours(nextHours)
    setMinutes(nextMinutes)
    isUpdatingFromProps.current = false
  }, [value])

  // Update display value when time components change and export formatted time
  useEffect(() => {
    // If no external value provided yet and user hasn't interacted, avoid forcing a default display like "12:00 AM"
    const noExternalValue = !value
    const userHasNotInteracted = lastEmittedValue.current === ""
    if (noExternalValue && userHasNotInteracted) {
      setDisplayValue("")
      return
    }

    const formattedHours = hours.padStart(2, "0")
    const formattedMinutes = minutes.padStart(2, "0")
    const timeString = `${formattedHours}:${formattedMinutes}`
    setDisplayValue(timeString)

    // Only call onChange if we're not updating from props and the value has actually changed
    if (onChange && !isUpdatingFromProps.current && lastEmittedValue.current !== timeString) {
      lastEmittedValue.current = timeString
      onChange(timeString)
    }
  }, [hours, minutes]) // Removed onChange from dependencies to prevent infinite loop

  // Generate hours options (00-23)
  const hoursOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))

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
          
        </div>
      </PopoverContent>
    </Popover>
  )
}