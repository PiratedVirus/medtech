"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SuccessModal({ open, onClose }: SuccessModalProps) {
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        onClose();
      }, 3000); // Auto-close the modal after 3 seconds
    }
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 border-none">
        <div className="relative flex flex-col items-center justify-center p-12">
          <div className="absolute">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-[#56a67c] animate-pulse"
                style={{
                  width: i % 2 === 0 ? "8px" : "6px",
                  height: i % 2 === 0 ? "8px" : "6px",
                  top: `${Math.sin((i * Math.PI) / 4) * 80}px`,
                  left: `${Math.cos((i * Math.PI) / 4) * 80}px`,
                  animationDelay: `${i * 0.1}s`,
                  opacity: i % 2 === 0 ? 0.8 : 0.5,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex items-center justify-center w-24 h-24 mb-8 rounded-full bg-[#56a67c]">
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </div>

          <h2 className="text-3xl font-medium text-[#56a67c] text-center">
            Appointment Booked Successfully
          </h2>
        </div>
      </DialogContent>
    </Dialog>
  );
}