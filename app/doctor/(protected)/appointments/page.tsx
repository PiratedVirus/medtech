"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, FileText, Link2, Pill, User, Building2, Video, CreditCard, Banknote, Play, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function formatDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  // dd Mon yyyy (e.g., 05 Jan 2025)
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeString: string) {
  if (!timeString) return "-";
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

const RIBBON_COLORS = [
  "border-l-4 border-emerald-400",
  "border-l-4 border-teal-400",
  "border-l-4 border-blue-300",
  "border-l-4 border-lime-400",
  "border-l-4 border-cyan-300",
  "border-l-4 border-yellow-300",
  "border-l-4 border-pink-300",
  "border-l-4 border-purple-300",
  "border-l-4 border-orange-300",
  "border-l-4 border-fuchsia-300",
  "border-l-4 border-rose-300",
  "border-l-4 border-green-300",
];

export default function DoctorAppointmentsPage() {
  const [data, setData] = useState<any>({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [scheduledView, setScheduledView] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await axios.get("/api/doctor/appointments/all");
        setData(res.data);
        // After fetching, auto-mark any appointments with a prescription as COMPLETED
        const all = [...(res.data.upcoming || []), ...(res.data.past || [])];
        const toMark = all.filter((a: any) => a.prescriptionLink && String(a.status).toUpperCase() !== "COMPLETED");
        if (toMark.length > 0) {
          // Fire and forget; no need to block UI
          toMark.forEach((a: any) => {
            axios.put(`/api/doctor/appointments/${a.id}/mark-completed`).catch(() => {});
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function AppointmentCard({ appt, idx, isPast }: { appt: any; idx: number; isPast?: boolean }) {
    const ribbon = RIBBON_COLORS[idx % RIBBON_COLORS.length];
    // Check if patient has previous appointments
    const hasPreviousAppointments = data.past.some((pastAppt: any) => 
      pastAppt.patientId === appt.patientId && pastAppt.id !== appt.id
    );

    // Check if this is a past appointment that's not completed and has no prescription
    const isPastIncomplete = isPast && 
      appt.status.toUpperCase() !== "COMPLETED" && 
      !appt.prescriptionLink;
      
    // Check if this is a completed appointment (either by status or by having prescription)
    const isCompleted = appt.status.toUpperCase() === "COMPLETED" || !!appt.prescriptionLink;

    return (
      <div className={cn("relative rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow mb-4 bg-custom-mutedgreen flex flex-col justify-between min-h-[170px]", ribbon)}>
        {/* Embossed Background Icon (Outline style, top-right, low opacity) */}
        {/* <div className="absolute right-2 top-2 h-20 w-20 opacity-10 pointer-events-none z-0">
          <User className="h-full w-full" />
        </div> */}
        {/* Status Pill - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <span className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
            appt.status.toUpperCase() === "COMPLETED"
              ? "bg-green-100 text-green-700 border-green-200"
              : appt.status.toUpperCase() === "CONFIRMED" || appt.status.toUpperCase() === "SCHEDULED"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : appt.status.toUpperCase() === "PENDING"
              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
              : appt.status.toUpperCase() === "CANCELLED"
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-gray-100 text-gray-700 border-gray-200"
          )}>
            {appt.status}
          </span>
        </div>
        <div className="flex-1 flex flex-col gap-2 pr-4 z-10">
          {/* Appointment ID pill */}
          <div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-300 text-emerald-800 bg-emerald-50">
              ID: {appt.id}
            </span>
          </div>
          {/* Patient Name and Previous Tag */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-base">{appt.patientName}</span>
            {appt.isFirst && !hasPreviousAppointments ? (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">New</span>
            ) : null}
          </div>

          {/* Consultation Type */}
          <div className="flex items-center gap-2 text-sm">
            <>
            {appt.consultationType.toUpperCase() === "CLINIC" || appt.consultationType.toUpperCase() === "PHYSICAL" ? (
              <>
                <Building2 className="h-4 w-4 text-gray-600" />
                <span className="font-bold text-gray-800">Physical consultation</span>
              </>
            ) : (
              <>
                <Video className="h-4 w-4 text-gray-600" />
                <span className="font-bold text-gray-800">Video consultation</span>
                {/* Room link removed as per request; available on Home -> Join meet room */}
              </>
            )}
            
            </>
          </div>
                    {/* Date and Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">{formatDate(appt.date)}</span>
            <Clock className="h-4 w-4 ml-4" />
            <span>{formatTime(appt.startTime)} - {formatTime(appt.endTime)}</span>
          </div>
          {/* Prescription Actions */}
          <div className="flex items-center justify-start mt-2 gap-2">
            {isPast ? (
              isCompleted && appt.prescriptionLink ? (
                // Completed appointment with prescription - show "View Prescription" button
                <Button
                  variant="outline"
                  size="sm"
                  className="text-primary border-primary hover:bg-primary hover:text-white"
                  onClick={() => {
                    window.open(appt.prescriptionLink, '_blank');
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Prescription
                </Button>
              ) : isCompleted ? (
                // Completed appointment without prescription - show "Edit Prescription" button
                <Button
                  size="sm"
                  className="bg-secondary hover:bg-secondary/80 text-white"
                  onClick={() => {
                    window.location.href = `/doctor/appointments/${appt.id}`;
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Edit Prescription
                </Button>
              ) : (
                // Past appointment that's not completed - show "Start Appointment Now" button
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/80 text-white"
                  onClick={() => {
                    // Navigate to start appointment page
                    window.location.href = `/doctor/appointments/${appt.id}`;
                  }}
                >
                  <Clock3 className="h-4 w-4 mr-2" />
                  Start Appointment Now
                </Button>
              )
            ) : (
              // Future appointment - show "Start Appointment" button
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  // Navigate to start appointment page
                  window.location.href = `/doctor/appointments/${appt.id}`;
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Appointment
              </Button>
            )}
          </div>
        </div>
        {/* Payment Type - Bottom Right (absolute) */}
        <div className="absolute bottom-3 right-3 z-10">
          {appt.paymentType && appt.paymentType.toUpperCase() === "ONLINE" ? (
            <img src="/icons/upi.svg" alt="UPI" className="h-6 w-auto" />
          ) : appt.paymentType && appt.paymentType.toUpperCase() === "CASH" ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
              <Banknote className="h-3 w-3" />
              Cash
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Derived partitions irrespective of date: Scheduled vs Completed
  const allAppointments = [...(data.upcoming || []), ...(data.past || [])];
  const completedAppointments = allAppointments.filter((a: any) => String(a.status).toUpperCase() === "COMPLETED" || a.prescriptionLink);
  const scheduledAppointments = allAppointments.filter((a: any) => !(String(a.status).toUpperCase() === "COMPLETED" || a.prescriptionLink));

  const now = new Date();
  const isFutureDate = (d?: string) => {
    if (!d) return false;
    const dt = new Date(d);
    return dt.getTime() >= now.getTime();
  };
  const scheduledUpcoming = scheduledAppointments.filter((a: any) => isFutureDate(a.date));
  const scheduledPast = scheduledAppointments.filter((a: any) => !isFutureDate(a.date));

  return (
    <div className="bg-muted flex flex-col items-center">
      <div className="container w-full bg-mutedbg p-4">
        <h2 className="text-2xl font-semibold mb-6">Appointments</h2>
        {loading ? (
          <div className="text-center text-gray-600 py-12">Loading appointments...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Scheduled Appointments - Left Column */}
            <section className="lg:border-r lg:border-gray-200 lg:pr-6 ">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Scheduled Appointments</h3>
                <div className="inline-flex items-center rounded-md border border-gray-200 overflow-hidden">
                  <button
                    className={cn(
                      "px-3 py-1 text-sm",
                      scheduledView === "upcoming"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600"
                    )}
                    onClick={() => setScheduledView("upcoming")}
                  >
                    Upcoming
                  </button>
                  <button
                    className={cn(
                      "px-3 py-1 text-sm border-l border-gray-200",
                      scheduledView === "past"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600"
                    )}
                    onClick={() => setScheduledView("past")}
                  >
                    Past
                  </button>
                </div>
              </div>
              <div className="h-[600px] overflow-y-auto pr-2">
                {(
                  scheduledView === "upcoming" ? scheduledUpcoming : scheduledPast
                ).length === 0 ? (
                  <div className="text-gray-500">No {scheduledView} scheduled appointments.</div>
                ) : (
                  <div>
                    {(scheduledView === "upcoming" ? scheduledUpcoming : scheduledPast).map((appt: any, idx: number) => (
                      <AppointmentCard appt={appt} idx={idx} key={appt.id} isPast={scheduledView === "past"} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Completed Appointments - Right Column */}
            <section className="lg:pl-6">
              <h3 className="text-xl font-semibold mb-4">Completed Appointments</h3>
              <div className="h-[600px] overflow-y-auto pr-2">
                {completedAppointments.length === 0 ? (
                  <div className="text-gray-500">No completed appointments.</div>
                ) : (
                  <div>
                    {completedAppointments.map((appt: any, idx: number) => (
                      <AppointmentCard appt={appt} idx={idx} key={appt.id} isPast />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
} 