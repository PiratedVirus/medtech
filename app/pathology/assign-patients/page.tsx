"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface Phlebotomist {
  id: number;
  employeeId: string;
  user: {
    name: string;
  };
  isAvailable: boolean;
  currentLocation?: string;
}

interface Patient {
  id: number;
  name: string;
  assignedPhlebotomistId?: string;
}

export default function AssignPatientsPage() {
  const [phlebotomists, setPhlebotomists] = useState<Phlebotomist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchPhlebotomist, setSearchPhlebotomist] = useState("");
  const [searchPatient, setSearchPatient] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPhlebotomist, setSelectedPhlebotomist] = useState<Phlebotomist | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch phlebotomists
      const phlebotomistsResponse = await fetch("/api/pathology/phlebotomists");
      const phlebotomistsData = await phlebotomistsResponse.json();
      setPhlebotomists(phlebotomistsData.phlebotomists || []);

      // Fetch patients
      const patientsResponse = await fetch("/api/pathology/patients");
      const patientsData = await patientsResponse.json();
      setPatients(patientsData.patients || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPhlebotomist = (patient: Patient, phlebotomistId: string) => {
    setSelectedPatient(patient);
    setSelectedPhlebotomist(phlebotomists.find(p => p.employeeId === phlebotomistId) || null);
    setShowAssignmentModal(true);
  };

  const confirmAssignment = async () => {
    if (!selectedPatient || !selectedPhlebotomist) return;

    try {
      const response = await fetch("/api/pathology/assign-phlebotomist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          phlebotomistId: selectedPhlebotomist.id,
        }),
      });

      if (response.ok) {
        // Update local state
        setPatients(prev => 
          prev.map(p => 
            p.id === selectedPatient.id 
              ? { ...p, assignedPhlebotomistId: selectedPhlebotomist.employeeId }
              : p
          )
        );
        setShowAssignmentModal(false);
        setSelectedPatient(null);
        setSelectedPhlebotomist(null);
      }
    } catch (error) {
      console.error("Error assigning phlebotomist:", error);
    }
  };

  const filteredPhlebotomists = phlebotomists.filter(p =>
    p.user.name.toLowerCase().includes(searchPhlebotomist.toLowerCase()) ||
    p.employeeId.toLowerCase().includes(searchPhlebotomist.toLowerCase())
  );

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchPatient.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Assign Phlebotomists to Patients</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Phlebotomists */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-green-600">Available Phlebotomists</h2>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search phlebotomist.."
              value={searchPhlebotomist}
              onChange={(e) => setSearchPhlebotomist(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Phlebotomist List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPhlebotomists.map((phlebotomist) => (
              <Card key={phlebotomist.id} className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <User className="h-6 w-6 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{phlebotomist.user.name}</h3>
                      <p className="text-sm text-gray-600">ID: #{phlebotomist.employeeId}</p>
                      {phlebotomist.currentLocation && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {phlebotomist.currentLocation}
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={phlebotomist.isAvailable ? "default" : "secondary"}
                      className={phlebotomist.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                    >
                      {phlebotomist.isAvailable ? "Available" : "Busy"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Patients to Assign */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-green-600">Patients to Assign</h2>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search patient.."
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Patient List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                      <div className="mt-2">
                        {patient.assignedPhlebotomistId ? (
                          <div className="bg-green-100 px-3 py-1 rounded text-sm text-green-800">
                            #{patient.assignedPhlebotomistId}
                          </div>
                        ) : (
                          <Input
                            placeholder="Enter Phlebotomist ID here"
                            className="text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const phlebotomist = phlebotomists.find(p => p.employeeId === e.currentTarget.value);
                                if (phlebotomist) {
                                  handleAssignPhlebotomist(patient, phlebotomist.employeeId);
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (patient.assignedPhlebotomistId) {
                          handleAssignPhlebotomist(patient, patient.assignedPhlebotomistId);
                        }
                      }}
                      disabled={!patient.assignedPhlebotomistId}
                      className={`px-4 py-2 rounded ${
                        patient.assignedPhlebotomistId 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Assign Phlebotomist
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Confirmation Modal */}
      <Dialog open={showAssignmentModal} onOpenChange={setShowAssignmentModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-green-600">
                Assigned Phlebotomist to the patient
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssignmentModal(false)}
                className="text-orange-500 hover:text-orange-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedPatient && selectedPhlebotomist && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Patient Information</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedPatient.name}</p>
                    <p className="text-sm text-gray-600">Patient ID: ABC12345</p>
                    <p className="text-sm text-gray-600">Gender: Male</p>
                    <p className="text-sm text-gray-600">Last Visit: 20th Oct 2024</p>
                  </div>
                </div>
              </div>

              {/* Assigned Phlebotomist */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Assigned Phlebotomist</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center">
                    <User className="h-8 w-8 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedPhlebotomist.user.name}</p>
                    <p className="text-sm text-gray-600">Medical Director Senior Consultant & Head (Respiratory Medicine)</p>
                    <p className="text-sm text-gray-600">Date & Time: 23-08-2024, 09:30 am</p>
                    <p className="text-sm text-gray-600">Reports: <span className="text-purple-600">Not Collected</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAssignmentModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAssignment}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Confirm Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 