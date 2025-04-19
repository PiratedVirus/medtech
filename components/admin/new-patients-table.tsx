"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const newPatients = [
  {
    id: "PAT-1234",
    name: "Carol Thompson",
    email: "carol@mail.com",
    joinedOn: "2025-04-15",
    plan: "Care+",
  },
  {
    id: "PAT-1235",
    name: "Michael Rodriguez",
    email: "michael@mail.com",
    joinedOn: "2025-04-16",
    plan: "Standard",
  },
  {
    id: "PAT-1236",
    name: "Jennifer Martinez",
    email: "jennifer@mail.com",
    joinedOn: "2025-04-17",
    plan: "Basic",
  },
  {
    id: "PAT-1237",
    name: "Robert Wilson",
    email: "robert@mail.com",
    joinedOn: "2025-04-18",
    plan: "Premium",
  },
  {
    id: "PAT-1238",
    name: "Sarah Anderson",
    email: "sarah@mail.com",
    joinedOn: "2025-04-19",
    plan: "Standard",
  },
]

export function NewPatientsTable() {
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
  )
}
