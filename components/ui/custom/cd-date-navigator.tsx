// components/DateNavigator.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatDateString } from "@/lib/utils";

interface DateNavigatorProps {
  slotCounts: { date: string; count: number }[];
  dayIndex: number;
  onSelectDay: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  fetching: boolean;
}

export function DateNavigator({
  slotCounts,
  dayIndex,
  onSelectDay,
  onPrev,
  onNext,
  fetching,
}: DateNavigatorProps) {
  return (
    <Card className="bg-[#e6f4f1] p-4 mt-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          disabled={fetching}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="grid grid-cols-3 gap-8">
          {slotCounts.map((info, i) => {
            const isSelected = i === dayIndex;
            return (
              <button
                key={i}
                onClick={() => onSelectDay(i)}
                className={`text-center p-2 rounded-lg transition-colors duration-300
                  ${isSelected ? "bg-green-400 text-white" : "hover:bg-green-50"}`}
              >
                <h3 className="font-semibold">{formatDateString(info.date)}</h3>
                <p className={info.count > 0 ? "text-green-900" : "text-gray-500"}>
                  {info.count} slot{info.count !== 1 ? "s" : ""} available
                </p>
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={fetching}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}