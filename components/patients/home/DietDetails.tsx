'use client'
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, File } from "lucide-react";

export interface DietPlan {
  id: string;
  pdfUrl: string;
  date: string;
}

export interface DietPlanCarouselProps {
  dietPlans: DietPlan[];
  onRequestNew: () => void;
}

export const DietPlanCarousel: React.FC<DietPlanCarouselProps> = ({ dietPlans, onRequestNew }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedPlan = dietPlans[selectedIndex];

  // Handle empty state
  if (!dietPlans || dietPlans.length === 0) {
    return (
      <div className="w-full p-4 bg-white rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-2">Diet Plans</h2>
        <p className="mb-4 text-sm text-gray-500">No diet plans available.</p>
        <Button onClick={onRequestNew}>Request New Diet</Button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 bg-white rounded-xl shadow-md flex">
      {/* Large preview */}
      <div className="flex-2 mr-4">
        <div className="border rounded-lg overflow-hidden">
          <object
            data={`${selectedPlan.pdfUrl}#page=1`}
            type="application/pdf"
            className="w-full h-[500px]"
            onClick={() => window.open(selectedPlan.pdfUrl, "_blank")}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <File size={48} className="text-red-500" />
              <span className="mt-2 text-sm text-gray-700">{selectedPlan.date}</span>
            </div>
          </object>
        </div>
      </div>
      {/* Sidebar with name and thumbnails */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold mb-2">{selectedPlan.id}</h2>
        <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[500px]">
          {dietPlans.map((plan, index) =>
            index !== selectedIndex && (
              <div
                key={plan.id}
                className="flex items-center cursor-pointer"
                onClick={() => setSelectedIndex(index)}
              >
                <object
                  data={`${plan.pdfUrl}#page=1`}
                  type="application/pdf"
                  className="w-16 h-20 rounded shadow"
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <File size={24} className="text-red-500" />
                  </div>
                </object>
                <span className="ml-2 text-xs text-gray-600">{plan.date}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
