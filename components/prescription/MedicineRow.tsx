"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import TypeAheadInput from "./TypeAheadInput";

interface MedicineRowProps {
  medicine: {
    id: string;
    name: string;
    frequency: string;
    medicineTime: string;
    duration: string;
    quantity: string;
    instructions?: string;
  };
  onUpdate: (updates: any) => void;
  onRemove: () => void;
}

export default function MedicineRow({
  medicine,
  onUpdate,
  onRemove,
}: MedicineRowProps) {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Medicine Name */}
        <div className="col-span-3">
          <div className="text-xs text-gray-500 mb-1">Medicine</div>
          <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
        </div>

        {/* Frequency */}
        <div className="col-span-2">
          <div className="text-xs text-gray-500 mb-1">Frequency</div>
          <Select
            value={medicine.frequency}
            onValueChange={(value) => onUpdate({ frequency: value })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Once daily">Once daily</SelectItem>
              <SelectItem value="Twice daily">Twice daily</SelectItem>
              <SelectItem value="Three times daily">Three times daily</SelectItem>
              <SelectItem value="As needed">As needed</SelectItem>
              <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
              <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
              <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Medicine Time */}
        <div className="col-span-2">
          <div className="text-xs text-gray-500 mb-1">Time</div>
          <Select
            value={medicine.medicineTime}
            onValueChange={(value) => onUpdate({ medicineTime: value })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Morning">Morning</SelectItem>
              <SelectItem value="Evening">Evening</SelectItem>
              <SelectItem value="Before meals">Before meals</SelectItem>
              <SelectItem value="After meals">After meals</SelectItem>
              <SelectItem value="Bedtime">Bedtime</SelectItem>
              <SelectItem value="Any time">Any time</SelectItem>
              <SelectItem value="Morning & Evening">Morning & Evening</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="col-span-2">
          <div className="text-xs text-gray-500 mb-1">Duration</div>
          <Select
            value={medicine.duration}
            onValueChange={(value) => onUpdate({ duration: value })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3 days">3 days</SelectItem>
              <SelectItem value="7 days">7 days</SelectItem>
              <SelectItem value="10 days">10 days</SelectItem>
              <SelectItem value="15 days">15 days</SelectItem>
              <SelectItem value="30 days">30 days</SelectItem>
              <SelectItem value="As needed">As needed</SelectItem>
              <SelectItem value="Until symptoms improve">Until symptoms improve</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quantity */}
        <div className="col-span-2">
          <div className="text-xs text-gray-500 mb-1">Quantity</div>
          <Input
            value={medicine.quantity}
            onChange={(e) => onUpdate({ quantity: e.target.value })}
            placeholder="Enter quantity"
            className="h-8 text-xs"
          />
        </div>

        {/* Remove Button */}
        <div className="col-span-1 flex justify-end">
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

      {/* Instructions (if any) */}
      {medicine.instructions && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Instructions</div>
          <div className="text-sm text-gray-700">{medicine.instructions}</div>
        </div>
      )}
    </Card>
  );
} 