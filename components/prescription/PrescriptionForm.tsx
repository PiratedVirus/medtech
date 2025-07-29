"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Plus, X, Edit2, Clock, Calendar } from "lucide-react";
import TypeAheadInput from "./TypeAheadInput";
import ComplaintCard from "./ComplaintCard";
import MedicineRow from "./MedicineRow";

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
            frequency: "",
            medicineTime: "",
            duration: "",
            quantity: "",
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

  return (
    <div className="space-y-6 w-full">
      {/* Patient Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <Label htmlFor="patientName" className="text-sm font-medium text-gray-700">Patient Name</Label>
            <Input
              id="patientName"
              value={patientInfo.name}
              readOnly
              className="bg-gray-50 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="patientId" className="text-sm font-medium text-gray-700">Patient ID</Label>
            <Input
              id="patientId"
              value={patientInfo.patientId}
              readOnly
              className="bg-gray-50 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="prescriptionId" className="text-sm font-medium text-gray-700">Prescription ID</Label>
            <Input
              id="prescriptionId"
              value={patientInfo.prescriptionId}
              readOnly
              className="bg-gray-50 mt-1"
            />
          </div>
        </div>
      </div>

      {/* Complaints Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Complaints</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <TypeAheadInput
              value={newComplaint}
              onChange={setNewComplaint}
              placeholder="Type complaint here..."
              type="complaints"
              className="flex-1 min-w-[500px]"
            />
            <Button onClick={addComplaint} disabled={!newComplaint.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

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

          {/* Active Complaint Card (like in the image) */}
          {newComplaint && (
            <div className="bg-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-800 font-medium">{newComplaint}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Select Number</span>
                    <Select
                      value={prescriptionData.complaints.find((c: any) => c.text === newComplaint)?.daysSince?.toString() || "1"}
                      onValueChange={(value) => {
                        const complaint = prescriptionData.complaints.find((c: any) => c.text === newComplaint);
                        if (complaint) {
                          updateComplaint(complaint.id, { daysSince: parseInt(value) });
                        }
                      }}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">Days</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Severity:</span>
                    <div className="flex items-center gap-1">
                      {severityOptions.map((option) => (
                        <button
                          key={option.value}
                          className={`px-2 py-1 text-xs rounded ${
                            prescriptionData.complaints.find((c: any) => c.text === newComplaint)?.severity === option.value
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                          onClick={() => {
                            const complaint = prescriptionData.complaints.find((c: any) => c.text === newComplaint);
                            if (complaint) {
                              updateComplaint(complaint.id, { severity: option.value });
                            }
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setNewComplaint("")}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vitals Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Vitals</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <Label htmlFor="bp" className="text-sm font-medium text-gray-700">BP</Label>
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
              className="mt-1"
            />
            <span className="text-sm text-gray-500">mm/Hg</span>
          </div>
          <div>
            <Label htmlFor="pulse" className="text-sm font-medium text-gray-700">Pulse</Label>
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
              className="mt-1"
            />
            <span className="text-sm text-gray-500">bpm</span>
          </div>
          <div>
            <Label htmlFor="height" className="text-sm font-medium text-gray-700">Height</Label>
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
              className="mt-1"
            />
            <span className="text-sm text-gray-500">cm</span>
          </div>
          <div>
            <Label htmlFor="weight" className="text-sm font-medium text-gray-700">Weight</Label>
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
              className="mt-1"
            />
            <span className="text-sm text-gray-500">kg</span>
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
      <div className="bg-white p-6 rounded-lg border border-gray-200">
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
              <SelectTrigger>
                <SelectValue placeholder="Select general here" />
              </SelectTrigger>
              <SelectContent>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Medicine</CardTitle>
            <Button variant="outline" size="sm" onClick={onLoadPrevious}>
              <Clock className="h-4 w-4 mr-2" />
              Load from Previous
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <TypeAheadInput
              value={newMedicine}
              onChange={setNewMedicine}
              placeholder="Search Medicines here"
              type="medicines"
              className="flex-1"
            />
            <Button onClick={addMedicine} disabled={!newMedicine.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Medicine Rows */}
          <div className="space-y-3">
            {prescriptionData.medicines.map((medicine: any) => (
              <MedicineRow
                key={medicine.id}
                medicine={medicine}
                onUpdate={(updates) => updateMedicine(medicine.id, updates)}
                onRemove={() => removeMedicine(medicine.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advice Section */}
      <Card>
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
          />
        </CardContent>
      </Card>

      {/* Tests Requested Section */}
      <Card>
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
          />
        </CardContent>
      </Card>

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