"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MedicineCardProps {
  medicine: {
    id: string;
    name: string;
    frequency: string;
    medicineTime: string;
    duration: string;
    quantity: string;
  };
  onUpdate: (updates: any) => void;
  onRemove: () => void;
}

const frequencyOptions = [
  { value: "1-0-0", label: "1-0-0 (Breakfast only)" },
  { value: "0-1-0", label: "0-1-0 (Lunch only)" },
  { value: "0-0-1", label: "0-0-1 (Dinner only)" },
  { value: "1-1-0", label: "1-1-0 (Breakfast & Lunch)" },
  { value: "1-0-1", label: "1-0-1 (Breakfast & Dinner)" },
  { value: "0-1-1", label: "0-1-1 (Lunch & Dinner)" },
  { value: "1-1-1", label: "1-1-1 (All meals)" },
  { value: "0-0-0", label: "0-0-0 (As needed)" },
];

const timeOptions = [
  { value: "Pre-meal", label: "Pre-meal" },
  { value: "Post-meal", label: "Post-meal" },
  { value: "Empty stomach", label: "Empty stomach" },
];

const durationPills = [
  { value: "3d", label: "3d" },
  { value: "5d", label: "5d" },
  { value: "7d", label: "7d" },
];

export default function MedicineCard({
  medicine,
  onUpdate,
  onRemove,
}: MedicineCardProps) {
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
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

  const calculateQuantity = (frequency: string, duration: string) => {
    if (!frequency || !duration) return "";

    const freqCount = frequency.split('-').reduce((sum, val) => sum + parseInt(val || '0'), 0);
    const durationDays = parseInt(String(duration).replace('d', ''));

    if (isNaN(freqCount) || isNaN(durationDays)) return "";

    return (freqCount * durationDays).toString();
  };

  const handleFrequencyChange = (value: string) => {
    // compute qty before updating
    const newQuantity = calculateQuantity(value, medicine.duration);

    // single atomic update prevents race‑condition where second call would overwrite frequency
    onUpdate({
      frequency: value,
      quantity: newQuantity,
    });

    setFrequencyOpen(false);
  };

  const handleTimeChange = (value: string) => {
    onUpdate({ medicineTime: value });
    setTimeOpen(false);
  };

  const handleDurationChange = (value: string) => {
    if (medicine.duration === value) {
      // Toggle off
      onUpdate({ duration: "", quantity: "0" });
      return;
    }

    // Select new pill
    const newQty = calculateQuantity(medicine.frequency, value);
    onUpdate({ duration: value, quantity: newQty });
  };

  const handleCustomDurationChange = (val: string) => {
    const digits = val.replace(/[^0-9]/g, "");
    if (!digits) {
      onUpdate({ duration: "", quantity: "0" });
      return;
    }
    const dur = `${digits}d`;
    onUpdate({
      duration: dur,
      quantity: calculateQuantity(medicine.frequency, dur),
    });
  };

  const processFrequencyInput = (input: string): string => {
    // Remove all non-numeric characters except dashes
    const cleanInput = input.replace(/[^0-9-]/g, '');

    // If input is just numbers, format it as frequency
    if (/^\d{1,3}$/.test(cleanInput)) {
      const digits = cleanInput.split('');
      if (digits.length === 1) {
        return `${digits[0]}-0-0`;
      } else if (digits.length === 2) {
        return `${digits[0]}-${digits[1]}-0`;
      } else if (digits.length === 3) {
        return `${digits[0]}-${digits[1]}-${digits[2]}`;
      }
    }

    // If already in correct format, return as is
    if (/^\d-\d-\d$/.test(cleanInput)) {
      return cleanInput;
    }

    return input;
  };

  return (
    <Card className="p-4 bg-custom-mutedgreen">
      {isSplitScreen ? (
        // Two-row layout for split screen compatibility
        <div className="space-y-3">
          {/* Row 1 - Medicine name and frequency */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-900 font-semibold">{medicine.name}</p>
            </div>
            
            {/* Frequency combobox */}
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <span className="text-xs text-gray-500 whitespace-nowrap">Freq:</span>
              <Popover open={frequencyOpen} onOpenChange={setFrequencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={frequencyOpen}
                    className="w-28 h-8 justify-between bg-white text-xs"
                  >
                    {medicine.frequency || "Select..."}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  align="start"
                  sideOffset={4}
                  className="p-0 bg-white"
                  style={{ width: 'var(--radix-popover-trigger-width)' }}
                >
                  <Command className="bg-white">
                    <CommandInput
                      placeholder="Type frequency..."
                      className="h-8 text-xs"
                      onValueChange={(value) => {
                        const processed = processFrequencyInput(value);
                        onUpdate({ frequency: processed });
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No frequency found.</CommandEmpty>
                      <CommandGroup>
                        {frequencyOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => handleFrequencyChange(option.value)}
                            className="text-xs"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                medicine.frequency === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <div className="font-medium">{option.value}</div>
                              <div className="text-gray-500 text-xs">{option.label.split('(')[1]?.replace(')', '')}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 2 - Time, Duration, Quantity and Actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Time combobox */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Time:</span>
              <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={timeOpen}
                    className="w-24 h-8 justify-between bg-white text-xs"
                  >
                    {medicine.medicineTime || "Select..."}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command className="bg-white">
                    <CommandInput
                      placeholder="Type time..."
                      className="h-8 text-xs"
                      onValueChange={(value) => {
                        onUpdate({ medicineTime: value });
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No time found.</CommandEmpty>
                      <CommandGroup>
                        {timeOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => handleTimeChange(option.value)}
                            className="text-xs"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                medicine.medicineTime === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration pills + custom input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Dur:</span>
              <div className="flex items-center gap-1">
                {durationPills.map((pill) => (
                  <button
                    key={pill.value}
                    onClick={() => handleDurationChange(pill.value)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-lg border",
                      medicine.duration === pill.value
                        ? "bg-custom-orange text-white border-custom-orange"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={
                    medicine.duration && !durationPills.some(d => d.value === medicine.duration)
                      ? String(medicine.duration).replace("d", "")
                      : ""
                  }
                  onChange={e => handleCustomDurationChange(e.target.value)}
                  className="w-16 h-8 bg-white text-center text-xs"
                  placeholder="Days"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Quantity and remove button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Qty:</span>
                <span className="text-sm font-medium text-gray-900">
                  {medicine.quantity || "0"}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Original single-row layout for non-split screen
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Medicine name (3 cols) */}
          <div className="col-span-3">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-semibold">{medicine.name}</p>
              </div>
            </div>
          </div>

          {/* Frequency combobox (3 cols) */}
          <div className="col-span-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Freq:</span>
              <Popover open={frequencyOpen} onOpenChange={setFrequencyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={frequencyOpen}
                    className="w-full h-8 justify-between bg-white text-xs"
                  >
                    {medicine.frequency || "Select frequency..."}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  align="start"
                  sideOffset={4}
                  className="p-0 bg-white"
                  style={{ width: 'var(--radix-popover-trigger-width)' }}
                >
                  <Command className="bg-white">
                    <CommandInput
                      placeholder="Type frequency..."
                      className="h-8 text-xs"
                      onValueChange={(value) => {
                        const processed = processFrequencyInput(value);
                        onUpdate({ frequency: processed });
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No frequency found.</CommandEmpty>
                      <CommandGroup>
                        {frequencyOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => handleFrequencyChange(option.value)}
                            className="text-xs"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                medicine.frequency === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <div className="font-medium">{option.value}</div>
                              <div className="text-gray-500 text-xs">{option.label.split('(')[1]?.replace(')', '')}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Time combobox (2 cols) */}
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Time:</span>
              <Popover open={timeOpen} onOpenChange={setTimeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={timeOpen}
                    className="w-full h-8 justify-between bg-white text-xs"
                  >
                    {medicine.medicineTime || "Select time..."}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command className="bg-white">
                    <CommandInput
                      placeholder="Type time..."
                      className="h-8 text-xs"
                      onValueChange={(value) => {
                        onUpdate({ medicineTime: value });
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No time found.</CommandEmpty>
                      <CommandGroup>
                        {timeOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => handleTimeChange(option.value)}
                            className="text-xs"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3 w-3",
                                medicine.medicineTime === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Duration pills + custom input (3 cols) */}
          <div className="col-span-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">Dur:</span>
                <div className="flex items-center gap-1">
                  {durationPills.map((pill) => (
                    <button
                      key={pill.value}
                      onClick={() => handleDurationChange(pill.value)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-lg border",
                        medicine.duration === pill.value
                          ? "bg-custom-orange text-white border-custom-orange"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {pill.label}
                    </button>
                  ))}
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={
                      medicine.duration && !durationPills.some(d => d.value === medicine.duration)
                        ? String(medicine.duration).replace("d", "")
                        : ""
                    }
                    onChange={e => handleCustomDurationChange(e.target.value)}
                    className="w-24 h-8 bg-white text-center text-xs"
                    placeholder="Days"
                    maxLength={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quantity and remove button (1 col) */}
          <div className="col-span-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Qty:</span>
                <span className="text-sm font-medium text-gray-900">
                  {medicine.quantity || "0"}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 