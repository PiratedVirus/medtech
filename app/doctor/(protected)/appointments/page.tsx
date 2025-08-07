"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, FileText, Link2, Pill, User, Building2, Video, CreditCard, Banknote, Play } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await axios.get("/api/doctor/appointments/all");
        setData(res.data);
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
        <div className="flex-1 flex flex-col gap-3 pr-4 z-10">
          {/* Patient Name and Previous Tag */}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-gray-800 text-base">{appt.patientName}</span>
            {appt.isFirst && !hasPreviousAppointments ? (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">New</span>
            ) : null}
          </div>
          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(appt.date)}</span>
            <Clock className="h-4 w-4 ml-4" />
            <span>{formatTime(appt.startTime)} - {formatTime(appt.endTime)}</span>
          </div>
          {/* Consultation Type */}
          <div className="flex items-center gap-2 text-sm">
            {appt.consultationType.toUpperCase() === "CLINIC" ? (
              <>
                <Building2 className="h-4 w-4 text-gray-600" />
                <span className="font-bold text-gray-800">Physical consultation</span>
              </>
            ) : (
              <>
                <Video className="h-4 w-4 text-gray-600" />
                <span className="font-bold text-gray-800">Video consultation</span>
                {appt.meetingRoomLink && (
                  <a
                    href={appt.meetingRoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 ml-2"
                    title="Meeting Room Link"
                  >
                    <Link2 className="h-3 w-3" />
                    <span className="text-xs">Room</span>
                  </a>
                )}
              </>
            )}
          </div>
          {/* Prescription Actions */}
          <div className="flex items-center justify-start mt-2">
            {isPast ? (
              <a
                href={appt.prescriptionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary text-sm pr-4 py-2 hover:cursor-pointer"
              >
                 View prescription
              </a>
            ) : (
              <a
                href={`/doctor/appointments/${appt.id}`}
                className="inline-flex items-center gap-2 text-green-600 text-sm pr-4 py-2 hover:cursor-pointer hover:text-green-700"
              >
                <Play className="h-4 w-4" />
                Start appointment
              </a>
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

  return (
    <div className="bg-muted flex flex-col items-center">
      <div className="container w-full bg-mutedbg p-4">
        <h2 className="text-2xl font-semibold mb-6">Appointments</h2>
        {loading ? (
          <div className="text-center text-gray-600 py-12">Loading appointments...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Appointments - Left Column */}
            <section className="lg:border-r lg:border-gray-200 lg:pr-6 ">
              <h3 className="text-xl font-semibold mb-4">Upcoming Appointments</h3>
              <div className="h-[600px] overflow-y-auto pr-2">
                {data.upcoming.length === 0 ? (
                  <div className="text-gray-500">No upcoming appointments.</div>
                ) : (
                  <div>
                    {data.upcoming.map((appt: any, idx: number) => (
                      <AppointmentCard appt={appt} idx={idx} key={appt.id} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Past Appointments - Right Column */}
            <section className="lg:pl-6">
              <h3 className="text-xl font-semibold mb-4">Past Appointments</h3>
              <div className="h-[600px] overflow-y-auto pr-2">
                {data.past.length === 0 ? (
                  <div className="text-gray-500">No past appointments.</div>
                ) : (
                  <div>
                    {data.past.map((appt: any, idx: number) => (
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