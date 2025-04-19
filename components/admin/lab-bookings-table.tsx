"use client"

import { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function LabBookingsTable() {
  const [labBookings, setLabBookings] = useState([]);

  useEffect(() => {
    const fetchLabBookings = async () => {
      try {
        const response = await axios.get("/api/admin-dashboard/lab-bookings");
        setLabBookings(response.data);
      } catch (error) {
        console.error("Failed to fetch lab bookings:", error);
      }
    };

    fetchLabBookings();
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-[rgba(86,166,124,0.05)]">
          <TableHead>Patient</TableHead>
          <TableHead>Test Package</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {labBookings.map((booking) => (
          <TableRow key={booking.id} className="hover:bg-[rgba(86,166,124,0.05)]">
            <TableCell className="font-medium">{booking.patient}</TableCell>
            <TableCell>{booking.testPackage}</TableCell>
            <TableCell>{booking.date}</TableCell>
            <TableCell>
              <Badge
                variant={
                  booking.status === "Pending"
                    ? "outline"
                    : booking.status === "Sample Collected"
                      ? "secondary"
                      : booking.status === "Processing"
                        ? "default"
                        : booking.status === "Completed"
                          ? "default"
                          : "destructive"
                }
                className={
                  booking.status === "Pending"
                    ? "border-[#F28A2E] text-[#F28A2E]"
                    : booking.status === "Sample Collected" || booking.status === "Processing"
                      ? "bg-[#56A67C] hover:bg-[#134F30]"
                      : ""
                }
              >
                {booking.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
