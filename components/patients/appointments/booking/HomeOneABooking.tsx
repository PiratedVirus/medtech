import { useState, useEffect } from "react";
import axios from "axios";
import { DoctorInfoOne } from "@/appointment-book/DoctorInfoOneABooking";
import { DateNavigator } from "@/custom/cd-date-navigator";
import { TimeSlots } from "@/custom/cd-time-slot";
import { Sidebar } from "@/appointment-book/SidebarABooking";
import CdLoader from "@/custom/cd-loader";
import HomeTwoAppointmentBooking from "@/appointment-book/HomeTwoABooking";
import { useDispatch } from "react-redux";
import { setSubscriptionData } from "@/store/subscriptionSlice";
import { useDecryptedProfile } from "@/hooks/use-centralized-profile";

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

export default function AppointmentBookingHomeOne({
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
  const { profile } = useDecryptedProfile();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!doctor?.id) return;
    let isMounted = true;
    setFetching(true);

    axios
      .get(`/api/doctors/${doctor.id}/availability?page=${page}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data.success) {
          const apiAvailability = res.data.availability as Availability[];
          const apiSlotCounts = res.data.slotCounts as { date: string; count: number }[];

          setAvailability(apiAvailability);

          // Fallback: recompute counts from availability in case API counts are zero/mismatched
          const computedMap = new Map<string, number>();
          for (const a of apiAvailability) {
            const key = new Date(a.date).toISOString().split("T")[0];
            computedMap.set(key, (computedMap.get(key) || 0) + 1);
          }
          const finalCounts = (apiSlotCounts || []).map((sc: { date: string; count: number }) => {
            const key = sc.date;
            const computed = computedMap.get(key) || 0;
            return { date: key, count: Math.max(sc.count ?? 0, computed) };
          });
          // If API returned empty slotCounts but availability exists, build from computed map
          const slotCountsToSet = finalCounts.length > 0 ? finalCounts : Array.from(computedMap.entries()).map(([date, count]) => ({ date, count }));
          setSlotCounts(slotCountsToSet);
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

  useEffect(() => {
    console.log("Profile", profile);
    if (profile?.id) {
      if (profile?.subscriptionDetails?.subscriptionId) {
      fetchSubscriptionTracker(profile.id).then((data) => {
          console.log("Plan Tracker Data", data);
        });
      }
    }
  }, [profile]); 

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

  const fetchSubscriptionTracker = async (userId: string) => {
    try {
      const response = await axios.get(`/api/plans/planTracker?userId=${userId}`);
      dispatch(setSubscriptionData(response.data.data));
      return response.data;
    } catch (error) {
      console.error("Error fetching plan tracker:", error);
      return null;
    }
  };

  // Determine the currently selected day's ISO date and count
  const currentDayInfo = slotCounts[dayIndex];
  const currentDayDateISO = currentDayInfo ? currentDayInfo.date : "";
  const currentDayCount = currentDayInfo ? currentDayInfo.count : 0;

  // Filter slots for the selected day (comparing only the date part)
  const displayedSlots = currentDayDateISO
    ? availability.filter((slot) => {
        const localDate = new Date(slot.date);
        // 'en-CA' gives YYYY-MM-DD format
        const localDateStr = localDate.toLocaleDateString('en-CA');
        return localDateStr === currentDayDateISO;
      })
    : [];

  if (selectedSlot) {
    return (
      <HomeTwoAppointmentBooking
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
          <DoctorInfoOne doctor={doctor} onBack={onBack} />
          {(fetching || !doctor) ? (
            <CdLoader height="60vh" />
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
        <Sidebar consultationType={consultationType} />
      </div>
    </div>
  );
}