"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin, CheckCircle } from "lucide-react";

interface Phlebotomist {
  id: number;
  employeeId: string;
  user: {
    name: string;
  };
  specialization: string;
  isAvailable: boolean;
  currentLocation?: string;
}

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onAssignmentComplete: () => void;
}

export default function AssignmentModal({
  isOpen,
  onClose,
  appointment,
  onAssignmentComplete,
}: AssignmentModalProps) {
  const [phlebotomists, setPhlebotomists] = useState<Phlebotomist[]>([]);
  const [selectedPhlebotomist, setSelectedPhlebotomist] = useState<string>("");
  const [assignedTime, setAssignedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchPhlebotomists();
    }
  }, [isOpen]);

  const fetchPhlebotomists = async () => {
    try {
      const response = await fetch("/api/pathology/phlebotomists");
      const data = await response.json();
      setPhlebotomists(data.phlebotomists || []);
    } catch (error) {
      console.error("Error fetching phlebotomists:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedPhlebotomist || !assignedTime) {
      alert("Please select a phlebotomist and assign time");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/pathology/assign-phlebotomist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: appointment.patientId,
          phlebotomistId: parseInt(selectedPhlebotomist),
          appointmentId: appointment.id,
          assignedTime,
        }),
      });

      if (response.ok) {
        setStep(2); // Show confirmation
        onAssignmentComplete();
      } else {
        alert("Failed to assign phlebotomist");
      }
    } catch (error) {
      console.error("Error assigning phlebotomist:", error);
      alert("Error assigning phlebotomist");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPhlebotomist("");
    setAssignedTime("");
    onClose();
  };

  const availablePhlebotomists = phlebotomists.filter(p => p.isAvailable);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {step === 1 ? "Assign Phlebotomist" : "Assignment Confirmed"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{appointment?.patientName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Test:</span>
                  <span className="ml-2 font-medium">{appointment?.appointmentFor}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-medium">{appointment?.appointmentDate}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className="ml-2 bg-orange-100 text-orange-800">Unassigned</Badge>
                </div>
              </div>
            </div>

            {/* Phlebotomist Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Select Phlebotomist</Label>
              <Select value={selectedPhlebotomist} onValueChange={setSelectedPhlebotomist}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a phlebotomist" />
                </SelectTrigger>
                <SelectContent>
                  {availablePhlebotomists.map((phlebotomist) => (
                    <SelectItem key={phlebotomist.id} value={phlebotomist.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span>{phlebotomist.user.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {phlebotomist.specialization}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPhlebotomist && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      {availablePhlebotomists.find(p => p.id.toString() === selectedPhlebotomist)?.user.name}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-600">
                      {availablePhlebotomists.find(p => p.id.toString() === selectedPhlebotomist)?.specialization}
                    </span>
                  </div>
                  {availablePhlebotomists.find(p => p.id.toString() === selectedPhlebotomist)?.currentLocation && (
                    <div className="flex items-center space-x-2 text-sm mt-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {availablePhlebotomists.find(p => p.id.toString() === selectedPhlebotomist)?.currentLocation}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Assignment Time */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Assign Time</Label>
              <Input
                type="time"
                value={assignedTime}
                onChange={(e) => setAssignedTime(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedPhlebotomist || !assignedTime || loading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {loading ? "Assigning..." : "Assign Phlebotomist"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Phlebotomist Assigned Successfully!
              </h3>
              <p className="text-gray-600">
                {appointment?.patientName} has been assigned to{" "}
                {availablePhlebotomists.find(p => p.id.toString() === selectedPhlebotomist)?.user.name}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <span className="ml-2 font-medium">{appointment?.patientName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phlebotomist:</span>
                  <span className="ml-2 font-medium">
                    {availablePhlebotomists.find(p => p.id.toString() === selectedPhlebotomist)?.user.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <span className="ml-2 font-medium">{assignedTime}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className="ml-2 bg-green-100 text-green-800">Assigned</Badge>
                </div>
              </div>
            </div>
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 