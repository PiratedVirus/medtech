"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, TestTube, CheckCircle, AlertCircle } from "lucide-react";

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  onStatusUpdate: () => void;
}

const STATUS_OPTIONS = [
  { value: "ASSIGNED", label: "Assigned", color: "bg-blue-100 text-blue-800" },
  { value: "PHLEBOTOMIST_LEFT", label: "Phlebotomist Left", color: "bg-yellow-100 text-yellow-800" },
  { value: "SAMPLE_COLLECTED", label: "Sample Collected", color: "bg-green-100 text-green-800" },
  { value: "IN_LAB", label: "In Lab", color: "bg-indigo-100 text-indigo-800" },
  { value: "ANALYZING", label: "Analyzing", color: "bg-orange-100 text-orange-800" },
  { value: "COMPLETED", label: "Completed", color: "bg-emerald-100 text-emerald-800" },
];

export default function StatusUpdateModal({
  isOpen,
  onClose,
  assignment,
  onStatusUpdate,
}: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(assignment?.status || "");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      alert("Please select a status");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/pathology/lab-assignments/${assignment.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedStatus,
          remarks,
        }),
      });

      if (response.ok) {
        onStatusUpdate();
        onClose();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus(assignment?.status || "");
    setRemarks("");
    onClose();
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === assignment?.status);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Update Assignment Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Information */}
          <div className="bg-custom-mutedgreen p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Assignment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Patient:</span>
                <span className="ml-2 font-medium">{assignment?.patient?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Phlebotomist:</span>
                <span className="ml-2 font-medium">{assignment?.phlebotomist?.user?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium">{assignment?.assignedDate}</span>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <span className="ml-2 font-medium">{assignment?.assignedTime}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Current Status:</span>
                <Badge className={`ml-2 ${currentStatus?.color || "bg-gray-100 text-gray-800"}`}>
                  {currentStatus?.label || assignment?.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Update Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${status.color} text-xs`}>
                        {status.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedStatus && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    {STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  This will update the current status of the assignment
                </p>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Remarks (Optional)</Label>
            <Textarea
              placeholder="Add any additional notes about this status update..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>

          {/* Status Flow Visualization */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Status Flow</Label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((status) => (
                <div key={status.value} className={`flex items-center space-x-2 p-2 rounded-lg border ${selectedStatus === status.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className={`p-1 rounded ${status.color}`}>
                    <TestTube className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-medium truncate">{status.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!selectedStatus || loading}
              className="bg-primary hover:bg-primary/80 hover:text-white"
            >
              {loading ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 