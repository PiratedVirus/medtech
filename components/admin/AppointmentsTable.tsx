"use client"

import { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
        const response = await axios.get("/api/admin/dashboard/appointments");
        setAppointments(response.data);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const formatDateTime = (date: string, startTime: string) => {
    try {
      const appointmentDate = new Date(date);
      const [hours, minutes] = startTime.split(':').map(Number);
      
      // Create a new date object with the appointment date and time
      const dateTime = new Date(appointmentDate);
      dateTime.setHours(hours, minutes, 0, 0);
      
      return dateTime.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading appointments...</div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
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
              <TableCell className="font-medium">{appointment.patient.name}</TableCell>
              <TableCell>{appointment.doctor.name}</TableCell>
              <TableCell>
                {formatDateTime(
                  appointment.doctorAvailability.date,
                  appointment.doctorAvailability.startTime
                )}
              </TableCell>
              <TableCell>{appointment.consultationType}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    appointment.status === "Scheduled"
                      ? "outline"
                      : appointment.status === "Confirmed"
                      ? "secondary"
                      : appointment.status === "Completed"
                      ? "default"
                      : "destructive"
                  }
                  className={
                    appointment.status === "Scheduled"
                      ? "border-[#F28A2E] text-[#F28A2E]"
                      : appointment.status === "Confirmed"
                      ? "bg-[#56A67C] hover:bg-[#134F30]"
                      : ""
                  }
                >
                  {appointment.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
