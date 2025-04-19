"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AppointmentsTable() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get("/api/admin-dashboard/appointments");
        // console.log("Fetched appointments:", response.data);
        setAppointments(response.data);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      }
    };

    fetchAppointments();
  }, []);

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
        {appointments.map((appointment) => (
          <TableRow key={appointment.id} className="hover:bg-[rgba(242,138,46,0.05)]">
            {/* Extract patient name */}
            <TableCell className="font-medium">{appointment.patient?.name || "N/A"}</TableCell>
            {/* Extract doctor name */}
            <TableCell>{appointment.doctor?.name || "N/A"}</TableCell>
            {/* Format appointment date and time */}
            <TableCell>
              {new Date(appointment.appointmentDate).toLocaleDateString("en-IN")}{" "}
              {new Date(appointment.appointmentDate).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </TableCell>
            {/* Display consultation type */}
            <TableCell>{appointment.consultationType}</TableCell>
            {/* Display status with badge */}
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
        ))}
      </TableBody>
    </Table>
  );
}