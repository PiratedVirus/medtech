"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Plus, X, Edit2, Clock, Calendar, User, FileText, Save, Download } from "lucide-react";
import TypeAheadInput from "./TypeAheadInput";
import ComplaintCard from "./ComplaintCard";
import MedicineCard from "./MedicineCard";

interface PrescriptionFormProps {
  prescriptionData: any;
  setPrescriptionData: (data: any) => void;
  patientInfo: any;
  onLoadPrevious: () => void;
}

export default function PrescriptionForm({
  prescriptionData,
  setPrescriptionData,
  patientInfo,
  onLoadPrevious,
}: PrescriptionFormProps) {
  const [newComplaint, setNewComplaint] = useState("");
  const [newMedicine, setNewMedicine] = useState("");
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const patientCardRef = useRef<HTMLDivElement>(null);

  const severityOptions = [
    { value: "PERFECT", label: "Perfect", color: "bg-green-100 text-green-800" },
    { value: "GOOD", label: "Good", color: "bg-blue-100 text-blue-800" },
    { value: "MODERATE", label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
    { value: "RISK", label: "Risk", color: "bg-orange-100 text-orange-800" },
    { value: "CRITICAL", label: "Critical", color: "bg-red-100 text-red-800" },
  ];

  const addComplaint = () => {
    if (newComplaint.trim()) {
      setPrescriptionData({
        ...prescriptionData,
        complaints: [
          ...prescriptionData.complaints,
          {
            id: Date.now().toString(),
            text: newComplaint,
            severity: "MODERATE",
            daysSince: 1,
            isFlagged: false,
          },
        ],
      });
      setNewComplaint("");
    }
  };

  const updateComplaint = (id: string, updates: any) => {
    setPrescriptionData({
      ...prescriptionData,
      complaints: prescriptionData.complaints.map((complaint: any) =>
        complaint.id === id ? { ...complaint, ...updates } : complaint
      ),
    });
  };

  const removeComplaint = (id: string) => {
    setPrescriptionData({
      ...prescriptionData,
      complaints: prescriptionData.complaints.filter((complaint: any) => complaint.id !== id),
    });
  };

  const addMedicine = () => {
    if (newMedicine.trim()) {
      setPrescriptionData({
        ...prescriptionData,
        medicines: [
          ...prescriptionData.medicines,
          {
            id: Date.now().toString(),
            name: newMedicine,
            frequency: "1-0-0",
            medicineTime: "Post-meal",
            duration: "",
            quantity: "0",
          },
        ],
      });
      setNewMedicine("");
    }
  };

  const updateMedicine = (id: string, updates: any) => {
    setPrescriptionData({
      ...prescriptionData,
      medicines: prescriptionData.medicines.map((medicine: any) =>
        medicine.id === id ? { ...medicine, ...updates } : medicine
      ),
    });
  };

  const removeMedicine = (id: string) => {
    setPrescriptionData({
      ...prescriptionData,
      medicines: prescriptionData.medicines.filter((medicine: any) => medicine.id !== id),
    });
  };

  const calculateNextVisitDate = (type: string, value: number) => {
    const today = new Date();
    let nextDate = new Date(today);

    switch (type) {
      case "days":
        nextDate.setDate(today.getDate() + value);
        break;
      case "weeks":
        nextDate.setDate(today.getDate() + (value * 7));
        break;
      case "months":
        nextDate.setMonth(today.getMonth() + value);
        break;
    }

    return nextDate;
  };

  const handleNextVisitChange = (type: string, value: number) => {
    const nextDate = calculateNextVisitDate(type, value);
    setPrescriptionData({
      ...prescriptionData,
      nextVisit: {
        type,
        value,
        date: nextDate,
      },
    });
  };

  const processFrequencyInput = (input: string): string => {
    // Remove all non-numeric characters except dashes
    const cleanInput = input.replace(/[^0-9-]/g, '');

    // If input is just numbers, format it as frequency
    if (/^\d{1,3}$/.test(cleanInput)) {
      const digits = cleanInput.split('');
      if (digits.length === 1) {
        return `${digits[0]}-0-0`;
      } else if (digits.length === 2) {
        return `${digits[0]}-${digits[1]}-0`;
      } else if (digits.length === 3) {
        return `${digits[0]}-${digits[1]}-${digits[2]}`;
      }
    }

    // If already in correct format, return as is
    if (/^\d-\d-\d$/.test(cleanInput)) {
      return cleanInput;
    }

    return input;
  };

  useEffect(() => {
    const handleScroll = () => {
      if (patientCardRef.current) {
        const rect = patientCardRef.current.getBoundingClientRect();
        // Show sticky header when patient card is scrolled out of view
        setShowStickyHeader(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

    return (
    <div className="space-y-6 w-full">
      {/* Sticky Header - Shows when patient card is out of view */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b transition-all duration-300 ${
        showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">#{patientInfo.appointmentId || 'APT001'}</span>
              <span className="text-lg font-semibold text-gray-900">{patientInfo.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Load Template
            </Button>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button variant="default" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Prescription
            </Button>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div 
        ref={patientCardRef}
        className="bg-custom-mutedgreen p-6 rounded-2xl border border-gray-200 flex justify-between items-start relative overflow-hidden"
      >
        {/* Embossed User Icon - Bottom Left */}
        <div className="absolute bottom-0 left-0 opacity-10">
          <User className="h-32 w-32 text-custom-darkgreen" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 w-full flex justify-between items-start">
          <h3 className="text-lg text-custom-darkgreen font-semibold mb-4">Patient Information</h3>
          <div className="flex flex-col text-right">
            <div>
              <h4 className="text-xl text-custom-darkgreen font-medium mb-1">#{patientInfo.appointmentId || 'APT001'}</h4>
            </div>
            <div>
              <h2 className="text-2xl text-custom-darkgreen font-semibold mb-1">{patientInfo.name}</h2>
            </div>
            <div>
              <h4 className="text-sm text-custom-darkgreen font-light mb-4">{patientInfo.prescriptionId}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Vitals Section */}
      <div className="rounded-lg ">
        {/* <h3 className="text-lg font-semibold mb-4">Vitals</h3> */}
        <div className="grid grid-cols-4 gap-6">
          {/* BP Vital */}
          <div className="flex flex-col">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-custom-mutedgreen flex-1 flex items-center justify-center px-3 py-2">
                <span className="text-custom-darkgreen font-semibold text-sm">BP</span>
              </div>
              <div className="flex-1">
                <Input
                  id="bp"
                  value={prescriptionData.vitals.bloodPressure}
                  onChange={(e) =>
                    setPrescriptionData({
                      ...prescriptionData,
                      vitals: { ...prescriptionData.vitals, bloodPressure: e.target.value },
                    })
                  }
                  placeholder="120/80"
                  className="border-0 bg-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full text-center"
                />
              </div>
            </div>
            <span className="text-sm text-gray-500 mt-1 text-right">mm/Hg</span>
          </div>

          {/* Pulse Vital */}
          <div className="flex flex-col">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-custom-mutedgreen flex-1 flex items-center justify-center px-3 py-2">
                <span className="text-custom-darkgreen font-semibold text-sm">Pulse</span>
              </div>
              <div className="flex-1">
                <Input
                  id="pulse"
                  value={prescriptionData.vitals.pulse}
                  onChange={(e) =>
                    setPrescriptionData({
                      ...prescriptionData,
                      vitals: { ...prescriptionData.vitals, pulse: e.target.value },
                    })
                  }
                  placeholder="72"
                  className="border-0 bg-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full text-center"
                />
              </div>
            </div>
            <span className="text-sm text-gray-500 mt-1 text-right">bpm</span>
          </div>

          {/* Height Vital */}
          <div className="flex flex-col">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-custom-mutedgreen flex-1 flex items-center justify-center px-3 py-2">
                <span className="text-custom-darkgreen font-semibold text-sm">Height</span>
              </div>
              <div className="flex-1">
                <Input
                  id="height"
                  value={prescriptionData.vitals.height}
                  onChange={(e) =>
                    setPrescriptionData({
                      ...prescriptionData,
                      vitals: { ...prescriptionData.vitals, height: e.target.value },
                    })
                  }
                  placeholder="182"
                  className="border-0 bg-white rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full text-center"
                />
              </div>
            </div>
            <span className="text-sm text-gray-500 mt-1 text-right">cm</span>
          </div>

          {/* Weight Vital */}
          <div className="flex flex-col">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-custom-mutedgreen flex-1 flex items-center justify-center px-3 py-2">
                <span className="text-custom-darkgreen font-semibold text-sm">Weight</span>
              </div>
              <div className="flex-1">
                <Input
                  id="weight"
                  value={prescriptionData.vitals.weight}
                  onChange={(e) =>
                    setPrescriptionData({
                      ...prescriptionData,
                      vitals: { ...prescriptionData.vitals, weight: e.target.value },
                    })
                  }
                  placeholder="95"
                  className="border-0 bg-white-100 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full text-center"
                />
              </div>
            </div>
            <span className="text-sm text-gray-500 mt-1 text-right">kg</span>
          </div>
        </div>
      </div>

      {/* Complaints Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Complaints</h3>
        <div className="space-y-4">
          <TypeAheadInput
            value={newComplaint}
            onChange={setNewComplaint}
            placeholder="Search complaints here..."
            type="complaints"
            className="w-full"
            showAddButtons={true}
            onAddItem={(item) => {
              const complaintText = item.text || item.name || item.value || "";
              setPrescriptionData({
                ...prescriptionData,
                complaints: [
                  ...prescriptionData.complaints,
                  {
                    id: Date.now().toString(),
                    text: complaintText,
                    severity: "MODERATE",
                    daysSince: 1,
                    isFlagged: false,
                  },
                ],
              });
            }}
          />

          {/* Existing Complaints */}
          <div className="space-y-3">
            {prescriptionData.complaints.map((complaint: any) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onUpdate={(updates: any) => updateComplaint(complaint.id, updates)}
                onRemove={() => removeComplaint(complaint.id)}
                severityOptions={severityOptions}
              />
            ))}
          </div>


        </div>
      </div>



      {/* History Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">History</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="allergies" className="text-sm font-medium text-gray-700">Allergies</Label>
            <Textarea
              id="allergies"
              value={prescriptionData.history.allergies}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  history: { ...prescriptionData.history, allergies: e.target.value },
                })
              }
              placeholder="Enter here..."
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="personalHistory" className="text-sm font-medium text-gray-700">Personal History</Label>
            <Textarea
              id="personalHistory"
              value={prescriptionData.history.personalHistory}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  history: { ...prescriptionData.history, personalHistory: e.target.value },
                })
              }
              placeholder="Enter here..."
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="pastMedicalHistory" className="text-sm font-medium text-gray-700">Past Medical History</Label>
            <Textarea
              id="pastMedicalHistory"
              value={prescriptionData.history.pastMedicalHistory}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  history: { ...prescriptionData.history, pastMedicalHistory: e.target.value },
                })
              }
              placeholder="Enter here..."
              rows={2}
              className="mt-1"
            />
          </div>

        </div>
      </div>

      {/* Systemic Examination Section */}
      <div className="bg-custom-mutedgreen p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Systemic Examination</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <Label htmlFor="general">General</Label>
            <Select
              value={prescriptionData.systemicExamination.general}
              onValueChange={(value) =>
                setPrescriptionData({
                  ...prescriptionData,
                  systemicExamination: { ...prescriptionData.systemicExamination, general: value },
                })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select general here" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="NAD">NAD</SelectItem>
                <SelectItem value="Conscious">Conscious</SelectItem>
                <SelectItem value="Orientated">Orientated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cvs">CVS</Label>
            <Input
              id="cvs"
              className="bg-white"
              value={prescriptionData.systemicExamination.cvs}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  systemicExamination: { ...prescriptionData.systemicExamination, cvs: e.target.value },
                })
              }
              placeholder="NAD"
            />
          </div>
          <div>
            <Label htmlFor="rs">RS</Label>
            <Input
              id="rs"
              className="bg-white"
              value={prescriptionData.systemicExamination.rs}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  systemicExamination: { ...prescriptionData.systemicExamination, rs: e.target.value },
                })
              }
              placeholder="NAD"
            />
          </div>
          <div>
            <Label htmlFor="cns">CNS</Label>
            <Input
              id="cns"
              className="bg-white"
              value={prescriptionData.systemicExamination.cns}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  systemicExamination: { ...prescriptionData.systemicExamination, cns: e.target.value },
                })
              }
              placeholder="NAD"
            />
          </div>
        </div>
      </div>

      {/* Medicine Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Medicine</h3>
          <Button variant="outline" size="sm" onClick={onLoadPrevious}>
            <Clock className="h-4 w-4 mr-2" />
            Load from Previous
          </Button>
        </div>
        <div className="space-y-4">
          <TypeAheadInput
            value={newMedicine}
            onChange={setNewMedicine}
            placeholder="Search medicines here..."
            type="medicines"
            className="w-full"
            showAddButtons={true}
            onAddItem={(item) => {
              const medicineName = item.text || item.name || item.value || "";
              setPrescriptionData({
                ...prescriptionData,
                medicines: [
                  ...prescriptionData.medicines,
                  {
                    id: Date.now().toString(),
                    name: medicineName,
                    frequency: "1-0-0",
                    medicineTime: "Post-meal",
                    duration: "",
                    quantity: "0",
                  },
                ],
              });
            }}
          />

          {/* Medicine Cards */}
          <div className="space-y-3">
            {prescriptionData.medicines.map((medicine: any) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onUpdate={(updates: any) => updateMedicine(medicine.id, updates)}
                onRemove={() => removeMedicine(medicine.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Advice and Tests Requested Section - Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Advice Section - Left Half */}
        <Card className="bg-custom-mutedgreen">
          <CardHeader>
            <CardTitle className="text-lg">Advice</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prescriptionData.advice}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  advice: e.target.value,
                })
              }
              placeholder="Write instructions or advice here..."
              rows={4}
              className="bg-white"
            />
          </CardContent>
        </Card>

        {/* Tests Requested Section - Right Half */}
        <Card className="bg-custom-mutedgreen">
          <CardHeader>
            <CardTitle className="text-lg">Tests Requested</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prescriptionData.testsRequested}
              onChange={(e) =>
                setPrescriptionData({
                  ...prescriptionData,
                  testsRequested: e.target.value,
                })
              }
              placeholder="Enter the tests to be done by the patient here..."
              rows={4}
              className="bg-white"
            />
          </CardContent>
        </Card>
      </div>


      {/* Next Visit Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Next Visit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="nextVisitValue">Enter the No. of</Label>
              <Input
                id="nextVisitValue"
                type="number"
                value={prescriptionData.nextVisit.value}
                onChange={(e) =>
                  handleNextVisitChange(prescriptionData.nextVisit.type, parseInt(e.target.value) || 0)
                }
                className="w-20"
              />
            </div>
            <div className="flex gap-2">
              {["days", "weeks", "months"].map((type) => (
                <Button
                  key={type}
                  variant={prescriptionData.nextVisit.type === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleNextVisitChange(type, prescriptionData.nextVisit.value)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Or choose Date:</span>
            <span className="font-medium">
              {prescriptionData.nextVisit.date
                ? prescriptionData.nextVisit.date.toLocaleDateString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
                : "Select date"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 