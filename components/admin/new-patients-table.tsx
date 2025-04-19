"use client"

import { useState, useEffect } from "react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function NewPatientsTable() {
  const [newPatients, setNewPatients] = useState([]);

  useEffect(() => {
    const fetchNewPatients = async () => {
      try {
        const response = await axios.get("/api/admin-dashboard/new-patients");
        setNewPatients(response.data);
      } catch (error) {
        console.error("Failed to fetch new patients:", error);
      }
    };

    fetchNewPatients();
  }, []);

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-[rgba(242,138,46,0.05)]">
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Joined On</TableHead>
          <TableHead>Plan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {newPatients.map((patient) => (
          <TableRow key={patient.id} className="hover:bg-[rgba(242,138,46,0.05)]">
            <TableCell className="font-medium">{patient.name}</TableCell>
            <TableCell>{patient.email}</TableCell>
            <TableCell>{patient.joinedOn}</TableCell>
            <TableCell>
              <Badge
                variant={
                  patient.plan === "Basic"
                    ? "outline"
                    : patient.plan === "Standard"
                      ? "secondary"
                      : patient.plan === "Premium" || patient.plan === "Care+"
                        ? "default"
                        : "outline"
                }
                className={
                  patient.plan === "Basic"
                    ? "border-[#F28A2E] text-[#F28A2E]"
                    : patient.plan === "Standard"
                      ? "bg-[#56A67C] hover:bg-[#134F30]"
                      : patient.plan === "Premium" || patient.plan === "Care+"
                        ? "bg-[#F28A2E] hover:bg-[#E67E22]"
                        : ""
                }
              >
                {patient.plan}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
