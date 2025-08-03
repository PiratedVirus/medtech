"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ArrowUpRight, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Patient {
  id: number;
  name: string;
  address: string;
  mobileNumber: string;
  sampleStatus: string;
  status: string;
  testsOrdered: string;
  assignedPhlebotomist?: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/pathology/patients");
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.mobileNumber.includes(searchQuery)
  );

  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const handleExportCSV = () => {
    const csvContent = [
      ["Patient Name", "Address", "Mobile Number", "Sample Status", "Status", "Tests Ordered"],
      ...patients.map(patient => [
        patient.name,
        patient.address,
        patient.mobileNumber,
        patient.sampleStatus,
        patient.status,
        patient.testsOrdered
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patients.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Patients List</h1>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString("en-GB")} | {new Date().toLocaleTimeString("en-US", { hour12: true })} <Calendar className="inline ml-1 h-4 w-4" />
        </div>
      </div>

      {/* Search and Export */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Q Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Patients Table */}
      <Card className="bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  Patient Name
                  <div className="inline-block ml-1 text-gray-400">|</div>
                  <div className="inline-block ml-1">⋮</div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Address
                  <div className="inline-block ml-1 text-gray-400">|</div>
                  <div className="inline-block ml-1">⋮</div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Mobile Number
                  <div className="inline-block ml-1 text-gray-400">|</div>
                  <div className="inline-block ml-1">⋮</div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Sample Status
                  <div className="inline-block ml-1 text-gray-400">|</div>
                  <div className="inline-block ml-1">⋮</div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Status
                  <div className="inline-block ml-1 text-gray-400">|</div>
                  <div className="inline-block ml-1">⋮</div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Tests Ordered
                  <div className="inline-block ml-1 text-gray-400">|</div>
                  <div className="inline-block ml-1">⋮</div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Assigned Phlebotomist
                  <div className="inline-block ml-1 text-gray-400">|</div>
                  <div className="inline-block ml-1">⋮</div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPatients.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-800">
                    {patient.name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {patient.address}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {patient.mobileNumber}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={patient.sampleStatus === "Not Collected" ? "destructive" : "default"}
                      className={
                        patient.sampleStatus === "Not Collected" 
                          ? "bg-red-100 text-red-800" 
                          : patient.sampleStatus === "Collected"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }
                    >
                      {patient.sampleStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      patient.status === "Assigned" 
                        ? "bg-green-100 text-green-800"
                        : patient.status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }>
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-800">
                      {patient.testsOrdered}
                    </span>
                  </TableCell>
                  <TableCell>
                    {patient.assignedPhlebotomist ? (
                      <span className="text-green-600 font-medium">
                        {patient.assignedPhlebotomist}
                      </span>
                    ) : (
                      <span className="text-gray-500">Not Assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 hover:bg-gray-100"
                      onClick={() => window.location.href = `/pathology/patients/${patient.id}`}
                    >
                      <ArrowUpRight className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ←
          </Button>
          {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className={currentPage === pageNum ? "bg-green-600 text-white" : ""}
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            →
          </Button>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>{itemsPerPage}</span>
          <span>/Page</span>
        </div>
      </div>
    </div>
  );
} 