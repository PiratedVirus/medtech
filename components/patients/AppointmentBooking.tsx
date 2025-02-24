import { useState, useEffect } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { addDays, startOfDay } from "date-fns";

interface AppointmentBookingProps {
  doctor: any;
  consultationType: "video" | "clinic" | null;
  onBack: () => void;
}

interface Availability {
  date: string;      // e.g. "2025-02-27T19:07:34.079Z"
  startTime: string; // e.g. "09:00 AM"
  endTime: string;   // e.g. "09:30 AM"
}

export default function AppointmentBooking({
  doctor,
  consultationType,
  onBack,
}: AppointmentBookingProps) {
  // Which 3-day chunk are we on?
  const [page, setPage] = useState(1);

  // We store all 3 days' data in these:
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [slotCounts, setSlotCounts] = useState<{ date: string; count: number }[]>([]);

  // Which of the 3 days is selected? (0 => first day, 1 => second, 2 => third)
  const [dayIndex, setDayIndex] = useState(0);

  // For smooth fetch. Keep old data until new chunk arrives
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  // =======================
  // Fetch chunk
  // =======================
  useEffect(() => {
    if (!doctor?.id) return;

    let isMounted = true;
    setFetching(true);

    axios
      .get(`/api/doctors/${doctor.id}/availability?page=${page}`)
      .then((res) => {
        if (!isMounted) return;

        if (res.data.success) {
          setAvailability(res.data.availability); // all 3 days combined
          setSlotCounts(res.data.slotCounts);     // day-based counts
          // reset dayIndex to 0 (first day in the chunk)
          setDayIndex(0);
          setError("");
        } else {
          setError("Failed to load availability");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Something went wrong");
      })
      .finally(() => {
        if (isMounted) setFetching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doctor, page]);

  // =======================
  // Navigation
  // =======================
  function goToPreviousDay() {
    // If we can move within the chunk
    if (dayIndex > 0) {
      setDayIndex(dayIndex - 1);
      return;
    }

    // If dayIndex===0 => we need the previous chunk (unless page=1)
    if (page > 1) {
      setPage(page - 1);
      // We want to highlight the last day (index 2) of the previous chunk
      // after it loads. So let's do a small delay or a "pending" state:
      setTimeout(() => {
        setDayIndex(2);
      }, 100);
    }
    // If page=1 & dayIndex=0 => can't go back further
  }

  function goToNextDay() {
    // If we can move within the current chunk
    if (dayIndex < 2) {
      setDayIndex(dayIndex + 1);
      return;
    }

    // If dayIndex===2 => fetch next chunk
    setPage(page + 1);
    // We'll default to dayIndex=0 for the new chunk
  }

  // If the user clicks on one of the 3 day boxes directly:
  function selectDay(index: number) {
    setDayIndex(index);
  }

  // =======================
  // Figure out which day the user is currently viewing
  // =======================
  // E.g. slotCounts[0], slotCounts[1], slotCounts[2]
  const currentDayInfo = slotCounts[dayIndex];
  let currentDayDateISO: string | null = null;
  let currentDayCount = 0;

  if (currentDayInfo) {
    currentDayDateISO = currentDayInfo.date; // "2025-02-27T00:00:00.000Z", etc.
    currentDayCount = currentDayInfo.count;
  }

  // Filter availability to just this day
  const displayedSlots = currentDayDateISO
    ? availability.filter(
        (slot) =>
          slot.date.split("T")[0] ===
          new Date(currentDayDateISO).toISOString().split("T")[0]
      )
    : [];

  // =======================
  // "Today"/"Tomorrow" logic
  // =======================
  function formatDateString(dateStr: string) {
    const d = new Date(dateStr);
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(addDays(new Date(), 1));

    if (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    ) {
      return "Today";
    }
    if (
      d.getFullYear() === tomorrow.getFullYear() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getDate() === tomorrow.getDate()
    ) {
      return "Tomorrow";
    }
    return d.toDateString(); // e.g. "Thu Feb 27 2025"
  }

  // =======================
  // Grouping: morning/afternoon/evening
  // =======================
  function parseTimeTo24Hour(time12h: string): number {
    // "09:30 AM" => [ "09:30", "AM" ]
    const [time, meridiem] = time12h.split(" ");
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (meridiem === "PM" && hour < 12) {
      hour += 12;
    }
    if (meridiem === "AM" && hour === 12) {
      hour = 0;
    }
    return hour + minute / 60;
  }

  function getTimeSegment(time12h: string) {
    const hour24 = parseTimeTo24Hour(time12h);
    if (hour24 < 12) return "morning";
    if (hour24 < 17) return "afternoon";
    return "evening";
  }

  const morningSlots = displayedSlots.filter(
    (slot) => getTimeSegment(slot.startTime) === "morning"
  );
  const afternoonSlots = displayedSlots.filter(
    (slot) => getTimeSegment(slot.startTime) === "afternoon"
  );
  const eveningSlots = displayedSlots.filter(
    (slot) => getTimeSegment(slot.startTime) === "evening"
  );

  // =======================
  // Render
  // =======================
  return (
    <div className="container mx-auto p-4">
      {/* BACK BUTTON */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold">{doctor?.name}</h1>

      {/* Error label, but keep old data if any */}
      {error && <p className="text-red-500 text-center py-2">{error}</p>}

      {/* Date Navigator: 3 days from slotCounts[] */}
      <Card className="bg-[#e6f4f1] p-4 mt-4">
        <div className="flex items-center justify-between">
          {/* PREV DAY */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousDay}
            disabled={(page === 1 && dayIndex === 0) || fetching}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* 3 day boxes */}
          <div className="grid grid-cols-3 gap-8">
            {slotCounts.map((info, i) => {
              const isSelected = i === dayIndex;
              return (
                <button
                  key={i}
                  onClick={() => selectDay(i)}
                  className={`text-center p-2 rounded-lg transition-colors duration-300
                    ${
                      isSelected
                        ? "bg-green-400 text-white"
                        : "hover:bg-green-50"
                    }
                  `}
                >
                  <h3 className="font-semibold">
                    {formatDateString(info.date)}
                  </h3>
                  <p
                    className={
                      info.count > 0 ? "text-green-900" : "text-gray-500"
                    }
                  >
                    {info.count} slot{info.count !== 1 ? "s" : ""} available
                  </p>
                </button>
              );
            })}
          </div>

          {/* NEXT DAY */}
          <Button variant="ghost" size="icon" onClick={goToNextDay} disabled={fetching}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* TIME SLOTS for the currently selected day */}
      <div className="mt-6 space-y-4">
        {currentDayDateISO && (
          <h2 className="text-xl font-semibold">
            {formatDateString(currentDayDateISO)}
          </h2>
        )}

        {/* If no slots */}
        {displayedSlots.length === 0 && !fetching && (
          <p className="text-gray-500">No slots available for this date.</p>
        )}

        {/* Grouped morning/afternoon/evening */}
        {displayedSlots.length > 0 && (
          <div className="space-y-6">
            {/* Morning */}
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

            {/* Afternoon */}
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

            {/* Evening */}
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
    </div>
  );
}