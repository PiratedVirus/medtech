import React from "react";
import { CardContent } from "@/components/ui/card";

interface ScrollableCardsContainerProps {
  children: React.ReactNode;
  id: string;
  className?: string;
}

export default function ScrollableCardsContainer({ 
  children, 
  id, 
  className = "" 
}: ScrollableCardsContainerProps) {
  return (
    <div className="relative">
      <div
        id={id}
        className={`flex space-x-4 overflow-x-auto scrollbar-hide pb-2 ${className}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
} 