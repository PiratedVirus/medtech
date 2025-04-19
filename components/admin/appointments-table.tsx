"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const appointments = [
  {
    id: "APP-1234",
    patient: "Alice Johnson",
    doctor: "Dr. Roy Smith",
    dateTime: "2025-04-20 10:30",
    type: "Consultation",
    status: "Scheduled",
  },
  {
    id: "APP-1235",
    patient: "Bob Williams",
    doctor: "Dr. Sarah Lee",
    dateTime: "2025-04-20 11:45",
    type: "Follow-up",
    status: "Confirmed",
  },
  {
    id: "APP-1236",
    patient: "Carol Davis",
    doctor: "Dr. James Wilson",
    dateTime: "2025-04-20 13:15",
    type: "Consultation",
    status: "Scheduled",
  },
  {
    id: "APP-1237",
    patient: "David Miller",
    doctor: "Dr. Roy Smith",
    dateTime: "2025-04-20 14:30",
    type: "Follow-up",
    status: "Confirmed",
  },
  {
    id: "APP-1238",
    patient: "Emma Brown",
    doctor: "Dr. Sarah Lee",
    dateTime: "2025-04-20 15:45",
    type: "Consultation",
    status: "Scheduled",
  },
]

export function AppointmentsTable() {
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
            <TableCell className="font-medium">{appointment.patient}</TableCell>
            <TableCell>{appointment.doctor}</TableCell>
            <TableCell>{appointment.dateTime}</TableCell>
            <TableCell>{appointment.type}</TableCell>
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
  )
}
