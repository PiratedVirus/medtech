"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { User, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import CdLoader from "@/components/ui/custom/cd-loader";

interface Patient {
  id: string;
  name: string;
  address: string;
  mobileNumber: string;
  sampleStatus: string;
  status: string;
  testsOrdered: string;
  assignedPhlebotomist?: string;
}

export function AllPatientsCard() {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAllPatients = async () => {
      try {
        const response = await fetch("/api/pathology/patients");
        const data = await response.json();
        setAllPatients(data.patients || []);
      } catch (error) {
        console.error("Failed to fetch all patients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPatients();
  }, []);

  const filteredPatients = allPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.mobileNumber.includes(searchQuery) ||
    patient.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCardClick = (patientId: string): void => {
    router.push(`/pathology/patients/${patientId}`);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Patient ID", "Name", "Address", "Mobile Number", "Sample Status", "Status"],
      ...allPatients.map(patient => [
        patient.id,
        patient.name,
        patient.address,
        patient.mobileNumber,
        patient.sampleStatus,
        patient.status
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pathology-patients.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <CdLoader />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Export */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          size="sm"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPatients.map((patient) => (
          <Card
            key={patient.id}
            onClick={() => handleCardClick(patient.id)}
            className="relative overflow-hidden cursor-pointer border bg-custom-mutedgreen rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="absolute -right-6 -top-6 opacity-10">
              <User size={100} />
            </div>
            <CardHeader className="relative px-2 z-10">
              <CardTitle className="text-xl font-semibold text-secondary">{patient.name}</CardTitle>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  patient.status === "Phlebotomist Sent" 
                    ? 'bg-green-700 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {patient.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 px-2 text-sm text-gray-700">
              <div className="flex items-center justify-between font-semibold">
                <span>{patient.mobileNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs">{patient.address}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 