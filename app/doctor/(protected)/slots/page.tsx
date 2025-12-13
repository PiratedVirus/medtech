'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMinutes, setHours, setMinutes, addDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const SLOT_START = 6 * 60; // 6:00 AM in minutes
const SLOT_END = 23 * 60; // 11:00 PM in minutes
const SLOT_DURATION = 30; // 30 mins

type SlotState = 'available' | 'break' | 'unselected';
interface Slot {
  startTime: string;
  endTime: string;
  label: string;
}

function generateSlots(): Slot[] {
  const slots: Slot[] = [];
  for (let mins = SLOT_START; mins < SLOT_END; mins += SLOT_DURATION) {
    const start = setMinutes(setHours(new Date(), Math.floor(mins / 60)), mins % 60);
    const end = addMinutes(start, SLOT_DURATION);
    slots.push({
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
      label: `${format(start, 'hh:mm a')} - ${format(end, 'hh:mm a')}`,
    });
  }
  return slots;
}

const ALL_SLOTS = generateSlots();

function groupSlots(slots: Slot[]): Record<string, Slot[]> {
  // Morning: 6am-12pm (6:00, 6:30, 7:00, 7:30, 8:00, 8:30, 9:00, 9:30, 10:00, 10:30, 11:00, 11:30) = 12 slots
  // Afternoon: 12pm-4pm (12:00, 12:30, 1:00, 1:30, 2:00, 2:30, 3:00, 3:30) = 8 slots
  // Evening: 4pm-11pm (4:00, 4:30, 5:00, 5:30, 6:00, 6:30, 7:00, 7:30, 8:00, 8:30, 9:00, 9:30, 10:00, 10:30) = 14 slots
  // Total: 34 slots (6am to 11pm, 30min intervals)
  return {
    Morning: slots.slice(0, 12),    // 6am-12pm (12 slots)
    Afternoon: slots.slice(12, 20), // 12pm-4pm (8 slots)
    Evening: slots.slice(20),      // 4pm-11pm (14 slots)
  };
}

const SLOT_COLORS = {
  unselected: 'bg-muted text-foreground border border-muted',
  available: 'bg-green-100 text-green-800 border border-green-300',
  break: 'bg-red-100 text-red-700 border border-red-300',
};

interface SlotStates {
  [startTime: string]: SlotState;
}

export default function DoctorSlotsPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [slotStates, setSlotStates] = useState<SlotStates>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch slots for selected date
  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      try {
        const res = await axios.get(`/api/doctor/slots?date=${selectedDate}`);
        // Assume API returns: [{ startTime, endTime, status: 'AVAILABLE' | 'BREAK' }]
        const states: SlotStates = {};
        for (const slot of ALL_SLOTS) {
          states[slot.startTime] = 'unselected';
        }
        for (const dbSlot of res.data.slots || []) {
          if (dbSlot.status === 'AVAILABLE') states[dbSlot.startTime] = 'available';
          if (dbSlot.status === 'BREAK') states[dbSlot.startTime] = 'break';
        }
        setSlotStates(states);
      } catch (e) {
        // fallback: all unselected
        const states: SlotStates = {};
        for (const slot of ALL_SLOTS) states[slot.startTime] = 'unselected';
        setSlotStates(states);
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [selectedDate]);

  function handleSlotClick(startTime: string) {
    setSlotStates((prev) => {
      const next: SlotStates = { ...prev };
      // Toggle only between unselected and available (remove BREAK state)
      next[startTime] = next[startTime] === 'available' ? 'unselected' : 'available';
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Prepare payload: [{ startTime, endTime, status }]
      const payload = ALL_SLOTS.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slotStates[slot.startTime] === 'available' ? 'AVAILABLE' : null,
      })).filter((s) => s.status);
      // Upsert: backend should handle create/update for the date
      await axios.post('/api/doctor/slots', {
        date: selectedDate,
        slots: payload,
      });
      toast({
        variant: 'success',
        title: 'Slots saved',
        description: `Availability updated for ${format(parseISO(selectedDate), 'dd MMM yyyy')}`,
      });
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to save availability';
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: message,
      });
    } finally {
      setSaving(false);
    }
  }

  function handlePrevDay() {
    setSelectedDate((prev) => format(addDays(parseISO(prev), -1), 'yyyy-MM-dd'));
  }
  function handleNextDay() {
    setSelectedDate((prev) => format(addDays(parseISO(prev), 1), 'yyyy-MM-dd'));
  }

  const grouped = groupSlots(ALL_SLOTS);

  return (
    <div className="bg-muted flex flex-col items-center">
      <div className="container w-full p-4">
        <h2 className="text-2xl font-semibold mb-6">Manage Availability</h2>
        <div className="flex flex-col md:flex-row gap-8 bg-white rounded-xl p-6">
          {/* Calendar & Date Navigation */}
          <div className="flex flex-col items-start gap-2 min-w-[220px]">
            <label className="block mb-2 font-semibold">Choose Date</label>
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous day"
                className="p-2 rounded hover:bg-muted-foreground/10 transition"
                onClick={handlePrevDay}
                type="button"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <input
                type="date"
                className="border rounded-lg px-3 py-2"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button
                aria-label="Next day"
                className="p-2 rounded hover:bg-muted-foreground/10 transition"
                onClick={handleNextDay}
                type="button"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Slots */}
          <div className="flex-1">
            <label className="block mb-2 font-semibold">Choose Time Slots</label>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" /> Loading...</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([period, slots]) => (
                  <div key={period}>
                    <div className="mb-1 text-muted-foreground font-medium">
                      {period} <span className="text-xs font-normal">({slots.length} slots)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.startTime}
                          type="button"
                          className={cn(
                            'px-4 py-1 rounded-full text-sm font-medium border transition-colors',
                            SLOT_COLORS[slotStates[slot.startTime] || 'unselected'],
                            'focus:outline-none focus:ring-2 focus:ring-primary/40',
                          )}
                          onClick={() => handleSlotClick(slot.startTime)}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Legend & Save */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-4">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">Available</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-muted">Unselected</span>
          </div>
          <button
            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin inline-block mr-2" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
} 