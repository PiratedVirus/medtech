"use client"

import { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { normalizeStatus } from "@/lib/utils/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CdLoader from "@/components/ui/custom/cd-loader";

export function AppointmentsTable() {
  interface Appointment {
    id: string;
    patient: { name: string };
    doctor: { name: string };
    consultationType: string;
    status: string;
    doctorAvailability: {
      date: string;
      startTime: string;
      endTime: string;
    };
  }

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/admin/optimized/appointments");
        // API returns { data: appointments[], total, page, pageSize, totalPages }
        // We need the appointments array from response.data.data
        setAppointments(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        setAppointments([]); // Set empty array on error to prevent undefined issues
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const formatDateTime = (date: string, startTime: string) => {
    try {
      // Parse the date string and create a new date object
      const appointmentDate = new Date(date);
      
      // Handle different time formats
      let hours = 0;
      let minutes = 0;
      
      if (startTime.includes('AM') || startTime.includes('PM')) {
        // Handle 12-hour format like "12:00 AM" or "11:15 AM"
        const timeMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (timeMatch) {
          hours = parseInt(timeMatch[1]);
          minutes = parseInt(timeMatch[2]);
          const period = timeMatch[3].toUpperCase();
          
          // Convert to 24-hour format
          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
        }
      } else {
        // Handle 24-hour format like "16:30" or "11:15"
        const [hoursStr, minutesStr] = startTime.split(':');
        hours = parseInt(hoursStr);
        minutes = parseInt(minutesStr);
      }
      
      // Create a new date object with the appointment date and time
      const dateTime = new Date(appointmentDate);
      dateTime.setHours(hours, minutes, 0, 0);
      
      // Use UTC to avoid timezone issues
      return dateTime.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      });
    } catch (error) {
      console.error("Error formatting date:", error, { date, startTime });
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CdLoader />
    </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-white z-10">
          <TableRow className="bg-[rgba(242,138,46,0.05)]">
            <TableHead>Patient</TableHead>
            <TableHead>Doctor</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No upcoming appointments found
              </TableCell>
            </TableRow>
          ) : (
            appointments.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-[rgba(242,138,46,0.05)]">
                <TableCell className="font-medium">{appointment.patient?.name || 'N/A'}</TableCell>
                <TableCell>{appointment.doctor?.name || 'N/A'}</TableCell>
                <TableCell>
                  {appointment.doctorAvailability ? formatDateTime(
                    appointment.doctorAvailability.date,
                    appointment.doctorAvailability.startTime
                  ) : 'N/A'}
                </TableCell>
                <TableCell>{appointment.consultationType || 'N/A'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      normalizeStatus(appointment.status) === "SCHEDULED"
                        ? "outline"
                        : normalizeStatus(appointment.status) === "CONFIRMED"
                        ? "secondary"
                        : normalizeStatus(appointment.status) === "COMPLETED"
                        ? "default"
                        : "destructive"
                    }
                    className={
                      normalizeStatus(appointment.status) === "SCHEDULED"
                        ? "border-[#F28A2E] text-[#F28A2E]"
                        : normalizeStatus(appointment.status) === "CONFIRMED"
                        ? "bg-[#56A67C] hover:bg-[#134F30]"
                        : ""
                    }
                  >
                    {normalizeStatus(appointment.status) || 'UNKNOWN'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
