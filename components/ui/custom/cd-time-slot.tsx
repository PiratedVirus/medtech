// components/TimeSlots.tsx
import { Button } from "@/components/ui/button";
import { getTimeSegment, formatDateString } from "@/lib/utils";

interface Availability {
  date: string;
  startTime: string;
  endTime: string;
}

interface TimeSlotsProps {
  currentDayDate: string;
  displayedSlots: Availability[];
}

export function TimeSlots({ currentDayDate, displayedSlots }: TimeSlotsProps) {
  // Group slots into segments
  const morningSlots = displayedSlots.filter(
    (slot) => getTimeSegment(slot.startTime) === "morning"
  );
  const afternoonSlots = displayedSlots.filter(
    (slot) => getTimeSegment(slot.startTime) === "afternoon"
  );
  const eveningSlots = displayedSlots.filter(
    (slot) => getTimeSegment(slot.startTime) === "evening"
  );

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-semibold">{formatDateString(currentDayDate)}</h2>
      {displayedSlots.length === 0 && (
        <p className="text-gray-500">No slots available for this date.</p>
      )}
      {displayedSlots.length > 0 && (
        <div className="space-y-6">
          {morningSlots.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Morning</h4>
              <div className="flex flex-wrap gap-3">
                {morningSlots.map((slot, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    {slot.startTime} - {slot.endTime}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {afternoonSlots.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Afternoon</h4>
              <div className="flex flex-wrap gap-3">
                {afternoonSlots.map((slot, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    {slot.startTime} - {slot.endTime}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {eveningSlots.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Evening</h4>
              <div className="flex flex-wrap gap-3">
                {eveningSlots.map((slot, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    {slot.startTime} - {slot.endTime}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}