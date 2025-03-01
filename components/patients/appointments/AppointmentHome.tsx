import { useState, useEffect } from "react";
import axios from "axios";
import { DoctorInfo } from "@/components/patients/appointments/AppointmentDoctorInfo";
import { DateNavigator } from "@/custom/cd-date-navigator";
import { TimeSlots } from "@/custom/cd-time-slot";
import { Sidebar } from "@/components/patients/appointments/AppointmentSidebar";
import CdLoader from "@/custom/cd-loader";
import AppointmentBookingTimeSlot from "@/patients/appointments/AppointmentBookingTimeSlot";

interface AppointmentHomeProps {
  doctor: any;
  consultationType: "video" | "clinic" | null;
  onBack: () => void;
}

interface Availability {
  date: string;
  startTime: string;
  endTime: string;
}

export default function AppointmentHome({
  doctor,
  consultationType,
  onBack,
}: AppointmentHomeProps) {
  // 3-day chunk state
  const [page, setPage] = useState(1);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [slotCounts, setSlotCounts] = useState<{ date: string; count: number }[]>([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);

  useEffect(() => {
    if (!doctor?.id) return;
    let isMounted = true;
    setFetching(true);

    axios
      .get(`/api/doctors/${doctor.id}/availability?page=${page}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data.success) {
          setAvailability(res.data.availability);
          setSlotCounts(res.data.slotCounts);
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

  // Navigation functions
  function goToPreviousDay() {
    if (dayIndex > 0) {
      setDayIndex(dayIndex - 1);
    } else if (page > 1) {
      setPage(page - 1);
      setTimeout(() => {
        setDayIndex(2);
      }, 100);
    }
  }

  function goToNextDay() {
    if (dayIndex < 2) {
      setDayIndex(dayIndex + 1);
    } else {
      setPage(page + 1);
    }
  }

  function selectDay(index: number) {
    setDayIndex(index);
  }

  // Determine the currently selected day's ISO date and count
  const currentDayInfo = slotCounts[dayIndex];
  const currentDayDateISO = currentDayInfo ? currentDayInfo.date : "";
  const currentDayCount = currentDayInfo ? currentDayInfo.count : 0;

  // Filter slots for the selected day (comparing only the date part)
  const displayedSlots = currentDayDateISO
    ? availability.filter(
        (slot) =>
          slot.date.split("T")[0] ===
          new Date(currentDayDateISO).toISOString().split("T")[0]
      )
    : [];

  if (selectedSlot) {
    return (
      <AppointmentBookingTimeSlot
        slot={selectedSlot}
        doctor={doctor}
        onBack={() => setSelectedSlot(null)}
      />
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div>
          <DoctorInfo doctor={doctor} onBack={onBack} />
          {(fetching || !doctor) ? (
            <CdLoader />
          ) : (
            <>
              <DateNavigator
                slotCounts={slotCounts}
                dayIndex={dayIndex}
                onSelectDay={selectDay}
                onPrev={goToPreviousDay}
                onNext={goToNextDay}
                fetching={fetching}
              />
              {currentDayDateISO && (
                <TimeSlots
                  currentDayDate={currentDayDateISO}
                  displayedSlots={displayedSlots}
                  onSlotSelect={(slot) => setSelectedSlot(slot)}
                />
              )}
            </>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}